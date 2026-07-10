// Vertical Profile Engine — the contract. An industry is a data module that
// implements this interface; engines (classify.ts, the loops under
// src/lib/loops/) consult the registry and never name an industry
// themselves (Platform Constitution, Article IV — Engine Purity).

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
  /**
   * Reserved by this packet, typed precisely by the Sequence Engine packet
   * (src/lib/sequences/types.ts) once it exists. Left opaque here rather
   * than importing a module that doesn't exist yet — a profile packet
   * narrows this type when it adds real sequences.
   */
  sequences?: unknown[];
}
