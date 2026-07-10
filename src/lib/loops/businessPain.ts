import { db, nowIso } from "@/lib/db";
import { executeSalesLoop, logSalesActivity } from "./engine";
import { classifyBusiness } from "@/lib/classify";
import { detectProfile } from "@/lib/verticals";
import { getLead } from "./leadCapture";

export interface BusinessPainInput {
  leadId: string;
}

export interface BusinessPainOutput {
  industry: string;
  businessType: string;
  opportunityScore: number;
  painScore: number;
  painPoints: string[];
  recommendedFocus: string[];
}

const GENERIC_PAIN_SIGNALS: { pattern: string; label: string; weight: number }[] = [
  { pattern: "lead", label: "Lead capture / follow-up gaps", weight: 20 },
  { pattern: "manual", label: "Manual, time-consuming operations", weight: 20 },
  { pattern: "time", label: "Time-consuming manual work", weight: 15 },
  { pattern: "book", label: "Scheduling / booking friction", weight: 15 },
  { pattern: "schedul", label: "Scheduling / booking friction", weight: 15 },
  { pattern: "lose", label: "Losing business to competitors", weight: 20 },
  { pattern: "losing", label: "Losing business to competitors", weight: 20 },
  { pattern: "slow", label: "Slow response / turnaround", weight: 15 },
  { pattern: "no website", label: "No web presence", weight: 20 },
  { pattern: "outdated", label: "Outdated systems / site", weight: 15 },
  { pattern: "frustrat", label: "High frustration with current process", weight: 15 },
  { pattern: "urgent", label: "Urgent / time-sensitive need", weight: 15 },
];

/**
 * Scores pain from raw text. When a vertical profile matches the text, its
 * pain signals are used instead of the generic list — the same
 * "profile owns its own vocabulary" pattern classify.ts uses, applied here
 * because this loop has its own independent pain-detection path (it scores
 * off the CEO's captured words, not classifyBusiness's generic signals).
 * With no profiles registered, detectProfile always returns undefined and
 * this is byte-identical to the pre-engine implementation.
 */
function scorePain(text: string): { painScore: number; painPoints: string[] } {
  const haystack = text.toLowerCase();
  const profile = detectProfile(haystack);
  const signals = profile ? profile.classification.painSignals : GENERIC_PAIN_SIGNALS;
  let score = text.trim().length > 0 ? 20 : 0; // baseline for having any stated pain at all
  const painPoints: string[] = [];
  for (const { pattern, label, weight } of signals) {
    if (haystack.includes(pattern) && !painPoints.includes(label)) {
      score += weight;
      painPoints.push(label);
    }
  }
  if (painPoints.length === 0 && text.trim().length > 0) {
    painPoints.push("Undifferentiated pain point (needs follow-up to clarify)");
  }
  return { painScore: Math.max(0, Math.min(100, score)), painPoints };
}

/**
 * Loop 2 (Sales): Business Pain Loop.
 * Diagnoses the lead's business and scores how much pain they're in —
 * mirrors the Business Diagnosis Loop, but weighted toward what the CEO
 * heard directly (pain points + requested service) rather than intake copy.
 */
export function runBusinessPainLoop(input: BusinessPainInput) {
  return executeSalesLoop<BusinessPainInput, BusinessPainOutput>(
    {
      type: "business_pain",
      run: ({ leadId }) => {
        const lead = getLead(leadId);
        if (!lead) throw new Error(`Lead ${leadId} not found`);

        const classification = classifyBusiness({
          businessName: lead.business_name,
          businessTypeRaw: lead.business_type ?? undefined,
          goals: lead.requested_service ?? undefined,
          painPoints: lead.pain_points ?? undefined,
          websitePresent: false,
          budgetRange: lead.budget_range ?? undefined,
        });

        const { painScore, painPoints } = scorePain(
          [lead.pain_points, lead.requested_service].filter(Boolean).join(" ")
        );

        const output: BusinessPainOutput = {
          industry: classification.industry,
          businessType: classification.businessType,
          opportunityScore: classification.opportunityScore,
          painScore,
          painPoints: painPoints.length > 0 ? painPoints : classification.painPoints,
          recommendedFocus: classification.recommendedFocus,
        };

        db.prepare(`UPDATE leads SET diagnosis_json = ?, status = 'diagnosed', updated_at = ? WHERE id = ?`).run(
          JSON.stringify(output),
          nowIso(),
          leadId
        );

        logSalesActivity(
          "lead",
          leadId,
          "diagnosed",
          `Diagnosed as ${output.industry} — pain score ${output.painScore}/100, opportunity score ${output.opportunityScore}/100.`
        );

        return { output, context: { leadId } };
      },
    },
    input
  );
}
