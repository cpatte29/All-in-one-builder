// Vertical Profile Engine — the contract. An industry is a data module that
// implements this interface; engines (classify.ts, the loops under
// src/lib/loops/) consult the registry and never name an industry
// themselves (Platform Constitution, Article IV — Engine Purity).
//
// Dependency direction: a profile may depend on another engine's types (as
// below, on the Sequence Engine's SequenceSpec) — that's "profile imports
// engine types." The reverse must never happen (an engine importing from
// src/lib/verticals/ would let industry-specific code leak into it).
import type { SequenceSpec } from "@/lib/sequences/types";

export interface ClassificationPainSignal {
  /** Lowercase substring matched against combined intake/pain text. */
  pattern: string;
  label: string;
  weight: number;
}

export interface VerticalClassification {
  /** Lowercase substrings that route a business to this profile (checked before the generic industry map). */
  keywords: string[];
  painSignals: ClassificationPainSignal[];
  recommendedFocus: string[];
}

export interface VerticalPackages {
  buildPackageId: string;
  recurringPackageId?: string;
}

export interface OnboardingTaskSpec {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
}

export interface ProposalFramingContext {
  businessName: string;
  contactName: string;
  urgency: string;
  painPoints: string[];
}

export interface VerticalProposalFraming {
  positioning: (ctx: ProposalFramingContext) => string;
  nextStep: (ctx: ProposalFramingContext) => string;
  /** Fixed content merged verbatim (e.g. a compliance FAQ) — no lead context needed. */
  staticSections: Record<string, string | string[]>;
  proofPointQuery?: { industryLabel: string };
}

export interface VerticalProfile {
  id: string;
  /** Bump on any content revision — lets the Overseer later correlate outcomes with a profile revision (Article IX). */
  version: number;
  /** The value written to clients.industry / leads diagnosis industry when this profile matches. */
  industryLabel: string;
  classification: VerticalClassification;
  packages: VerticalPackages;
  onboardingTasks: OnboardingTaskSpec[];
  proposalFraming?: VerticalProposalFraming;
  sequences?: SequenceSpec[];
}
