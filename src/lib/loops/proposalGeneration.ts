import { db, newId, nowIso } from "@/lib/db";
import { executeSalesLoop, logSalesActivity } from "./engine";
import { profileForIndustry } from "@/lib/verticals";
import { buildFraming, buildNextStep } from "@/lib/proposals/framing";
import { getLead } from "./leadCapture";
import type { Package } from "@/lib/types";

export interface ProposalGenerationInput {
  leadId: string;
}

export interface ProposalGenerationOutput {
  proposalId: string;
  packageName: string;
  scope: { deliverables: string[]; focusAreas: string[]; [section: string]: unknown };
  priceRange: string;
  timelineWeeks: number;
  deliverables: string[];
  nextStep: string;
}

/**
 * Loop 4 (Sales): Proposal Generation Loop.
 * Turns the matched offer into a structured proposal (package, scope,
 * price range, timeline, deliverables, next step) ready for the CEO to
 * review and send. Creates the proposal as a draft — sending is a
 * separate, explicit action so "proposals sent" is a meaningful metric.
 */
export function runProposalGenerationLoop(input: ProposalGenerationInput) {
  return executeSalesLoop<ProposalGenerationInput, ProposalGenerationOutput>(
    {
      type: "proposal_generation",
      run: ({ leadId }) => {
        const lead = getLead(leadId);
        if (!lead) throw new Error(`Lead ${leadId} not found`);
        if (!lead.offer_match_json) {
          throw new Error("Lead must complete the Offer Match Loop first");
        }

        const offerMatch = JSON.parse(lead.offer_match_json) as { packageId: string; packageName: string };
        const pkg = db.prepare("SELECT * FROM packages WHERE id = ?").get(offerMatch.packageId) as Package;
        const diagnosis = lead.diagnosis_json ? JSON.parse(lead.diagnosis_json) : { recommendedFocus: [] };
        const deliverables: string[] = JSON.parse(pkg.deliverables_json || "[]");

        const genericNextStep = `Schedule a ${lead.urgency === "high" ? "same-week" : "kickoff"} call with ${lead.contact_name} to walk through the proposal and confirm scope.`;

        // A registered vertical profile's framing (positioning, proof
        // point, care plan, static sections like a compliance FAQ, and a
        // profile-phrased next step) merges into scope via the Proposal
        // Framing Engine (src/lib/proposals/framing.ts). With no profile
        // matched, this is byte-identical to the pre-engine implementation.
        const profile = diagnosis.industry ? profileForIndustry(diagnosis.industry) : undefined;
        const framingCtx = {
          businessName: lead.business_name,
          contactName: lead.contact_name,
          urgency: lead.urgency,
          painPoints: diagnosis.painPoints ?? [],
        };
        const nextStep = (profile && buildNextStep(profile, framingCtx)) || genericNextStep;
        const scope: ProposalGenerationOutput["scope"] = {
          deliverables,
          focusAreas: diagnosis.recommendedFocus ?? [],
          ...(profile ? buildFraming(profile, framingCtx) : {}),
        };

        const proposalId = newId("prop");
        db.prepare(
          `INSERT INTO proposals
            (id, lead_id, package_name, scope_json, price_range, timeline_weeks, deliverables_json, next_step, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`
        ).run(
          proposalId,
          leadId,
          pkg.name,
          JSON.stringify(scope),
          pkg.price_range,
          pkg.timeline_weeks,
          JSON.stringify(deliverables),
          nextStep,
          nowIso(),
          nowIso()
        );

        db.prepare(`UPDATE leads SET status = 'proposal_ready', updated_at = ? WHERE id = ?`).run(nowIso(), leadId);

        logSalesActivity(
          "proposal",
          proposalId,
          "proposal_drafted",
          `Drafted proposal for ${lead.business_name}: ${pkg.name}, ${pkg.price_range}, ${pkg.timeline_weeks} weeks.`
        );

        return {
          output: {
            proposalId,
            packageName: pkg.name,
            scope,
            priceRange: pkg.price_range ?? "TBD",
            timelineWeeks: pkg.timeline_weeks ?? 4,
            deliverables,
            nextStep,
          },
          context: { leadId, proposalId },
        };
      },
    },
    input
  );
}
