import { db, nowIso } from "@/lib/db";
import { executeSalesLoop, logSalesActivity } from "./engine";
import { packageForScore } from "@/lib/packages";
import { getLead } from "./leadCapture";
import type { Package } from "@/lib/types";

export interface OfferMatchInput {
  leadId: string;
}

export interface OfferMatchOutput {
  packageId: string;
  packageName: string;
  fitScore: number;
  rationale: string;
}

/**
 * Loop 3 (Sales): Offer Match Loop.
 * Matches the diagnosed pain/opportunity to a service package from the
 * catalog — the sales-side counterpart to the Package Recommendation Loop.
 */
export function runOfferMatchLoop(input: OfferMatchInput) {
  return executeSalesLoop<OfferMatchInput, OfferMatchOutput>(
    {
      type: "offer_match",
      run: ({ leadId }) => {
        const lead = getLead(leadId);
        if (!lead) throw new Error(`Lead ${leadId} not found`);
        if (!lead.diagnosis_json) {
          throw new Error("Lead must complete the Business Pain Loop first");
        }

        const diagnosis = JSON.parse(lead.diagnosis_json) as { opportunityScore: number; painScore: number };
        // Fit score blends business opportunity with how acute the pain is —
        // a lead with real pain and budget headroom is a better fit than a
        // high-opportunity lead who's just browsing.
        const fitScore = Math.round(diagnosis.opportunityScore * 0.7 + diagnosis.painScore * 0.3);
        const def = packageForScore(diagnosis.opportunityScore);
        const pkg = db.prepare("SELECT * FROM packages WHERE id = ?").get(def.id) as Package | undefined;
        if (!pkg) throw new Error(`Package ${def.id} not seeded`);

        const rationale = `Opportunity score ${diagnosis.opportunityScore}/100 and pain score ${diagnosis.painScore}/100 (fit ${fitScore}/100) point to the "${def.tier}" tier — ${pkg.name}.`;

        const output: OfferMatchOutput = { packageId: pkg.id, packageName: pkg.name, fitScore, rationale };

        db.prepare(`UPDATE leads SET offer_match_json = ?, status = 'matched', updated_at = ? WHERE id = ?`).run(
          JSON.stringify(output),
          nowIso(),
          leadId
        );

        logSalesActivity("lead", leadId, "offer_matched", rationale);

        return { output, context: { leadId } };
      },
    },
    input
  );
}
