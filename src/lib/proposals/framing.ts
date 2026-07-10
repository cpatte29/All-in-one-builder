import { db } from "@/lib/db";
import type { VerticalProfile, ProposalFramingContext } from "@/lib/verticals";
import type { Client, Package } from "@/lib/types";

export interface CarePlanSection {
  name: string;
  priceRange: string;
  deliverables: string[];
}

export interface FramingSections {
  positioning?: string;
  proofPoint?: string;
  carePlan?: CarePlanSection;
  /** Custom sections a profile defines via staticSections — rendered generically by the caller. */
  [section: string]: unknown;
}

/**
 * Renders a matched vertical profile's proposal framing against real
 * captured lead data. Industry-free by construction: every section this
 * function knows how to build (positioning, proofPoint, carePlan, plus
 * whatever staticSections a profile supplies) is defined generically on
 * VerticalProposalFraming (src/lib/verticals/types.ts) — no profile is
 * named here. Returns {} when the profile has no proposalFraming.
 */
export function buildFraming(
  profile: VerticalProfile,
  ctx: ProposalFramingContext
): FramingSections {
  const framing = profile.proposalFraming;
  if (!framing) return {};

  const sections: FramingSections = {
    positioning: framing.positioning(ctx),
    ...framing.staticSections,
  };

  if (framing.proofPointQuery) {
    const client = db
      .prepare(
        "SELECT * FROM clients WHERE industry = ? AND status = 'delivered' ORDER BY updated_at DESC LIMIT 1"
      )
      .get(framing.proofPointQuery.industryLabel) as Client | undefined;
    if (client) {
      sections.proofPoint = `We recently delivered a similar project for ${client.business_name}.`;
    }
  }

  if (profile.packages.recurringPackageId) {
    const pkg = db.prepare("SELECT * FROM packages WHERE id = ?").get(profile.packages.recurringPackageId) as
      | Package
      | undefined;
    if (pkg) {
      sections.carePlan = {
        name: pkg.name,
        priceRange: pkg.price_range ?? "",
        deliverables: JSON.parse(pkg.deliverables_json || "[]"),
      };
    }
  }

  return sections;
}

/** The profile-aware next step, when a profile's framing supplies one — undefined otherwise so the caller falls back to the generic computation. */
export function buildNextStep(profile: VerticalProfile, ctx: ProposalFramingContext): string | undefined {
  return profile.proposalFraming?.nextStep(ctx);
}
