import { db, nowIso } from "@/lib/db";
import { executeSalesLoop, logSalesActivity } from "./engine";
import { getLead } from "./leadCapture";
import type { Conversation } from "@/lib/types";

export interface CloseProbabilityInput {
  leadId: string;
}

export interface CloseProbabilityBreakdown {
  urgency: number;
  budget: number;
  fit: number;
  responsiveness: number;
  painLevel: number;
}

export interface CloseProbabilityOutput {
  score: number;
  breakdown: CloseProbabilityBreakdown;
  summary: string;
}

const URGENCY_SCORE: Record<string, number> = { high: 25, medium: 15, low: 5 };

function budgetScore(budgetRange: string | null): number {
  if (!budgetRange) return 5;
  const b = budgetRange.toLowerCase();
  if (b.includes("20") || b.includes("enterprise")) return 25;
  if (b.includes("9") || b.includes("18")) return 20;
  if (b.includes("4") || b.includes("8")) return 12;
  return 6;
}

function responsivenessScore(conversations: Conversation[]): number {
  if (conversations.length === 0) return 0;
  const mostRecent = conversations.reduce(
    (latest, c) => (new Date(c.occurred_at) > new Date(latest) ? c.occurred_at : latest),
    conversations[0].occurred_at
  );
  const daysSince = (Date.now() - new Date(mostRecent).getTime()) / (1000 * 60 * 60 * 24);
  const recencyScore = daysSince <= 2 ? 8 : daysSince <= 7 ? 5 : daysSince <= 14 ? 2 : 0;
  const volumeScore = Math.min(7, conversations.length * 2);
  return recencyScore + volumeScore;
}

/**
 * Loop 6 (Sales): Close Probability Loop.
 * Scores 0-100 how likely a lead is to close, from urgency, budget, offer
 * fit, responsiveness (conversation cadence), and pain level.
 */
export function runCloseProbabilityLoop(input: CloseProbabilityInput) {
  return executeSalesLoop<CloseProbabilityInput, CloseProbabilityOutput>(
    {
      type: "close_probability",
      run: ({ leadId }) => {
        const lead = getLead(leadId);
        if (!lead) throw new Error(`Lead ${leadId} not found`);

        const conversations = db
          .prepare("SELECT * FROM conversations WHERE lead_id = ?")
          .all(leadId) as Conversation[];

        const diagnosis = lead.diagnosis_json ? JSON.parse(lead.diagnosis_json) : null;
        const offerMatch = lead.offer_match_json ? JSON.parse(lead.offer_match_json) : null;

        const breakdown: CloseProbabilityBreakdown = {
          urgency: URGENCY_SCORE[lead.urgency] ?? 10,
          budget: budgetScore(lead.budget_range),
          fit: offerMatch ? Math.round((offerMatch.fitScore / 100) * 20) : 5,
          responsiveness: responsivenessScore(conversations),
          painLevel: diagnosis ? Math.round((diagnosis.painScore / 100) * 15) : 5,
        };

        const score = Math.max(
          0,
          Math.min(100, breakdown.urgency + breakdown.budget + breakdown.fit + breakdown.responsiveness + breakdown.painLevel)
        );

        const summary =
          score >= 70
            ? "Hot lead — high urgency, strong fit, and active engagement."
            : score >= 40
              ? "Warm lead — worth continued follow-up."
              : "Cold lead — low signal on urgency, budget, or engagement.";

        const output: CloseProbabilityOutput = { score, breakdown, summary };

        db.prepare(
          `UPDATE leads SET close_probability = ?, close_probability_json = ?, updated_at = ? WHERE id = ?`
        ).run(score, JSON.stringify(output), nowIso(), leadId);

        logSalesActivity("lead", leadId, "close_probability_scored", `Close probability: ${score}/100 — ${summary}`);

        return { output, context: { leadId } };
      },
    },
    input
  );
}
