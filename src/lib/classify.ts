import { detectProfile } from "./verticals";

export interface BusinessClassification {
  industry: string;
  businessType: string;
  size: string;
  opportunityScore: number;
  painPoints: string[];
  recommendedFocus: string[];
}

const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  "Home Services": ["plumb", "hvac", "roof", "electric", "landscap", "clean", "contractor"],
  "Health & Wellness": ["clinic", "dental", "chiropract", "spa", "salon", "fitness", "gym", "therapy"],
  "Restaurant & Food": ["restaurant", "cafe", "bakery", "catering", "food truck", "bar"],
  "Retail & E-commerce": ["shop", "store", "boutique", "ecommerce", "e-commerce", "retail"],
  "Professional Services": ["law", "legal", "accounting", "consult", "financial", "insurance", "realty", "real estate"],
  "Technology": ["saas", "software", "app", "tech", "startup"],
  "Nonprofit": ["nonprofit", "non-profit", "ngo", "charity"],
};

const SIZE_KEYWORDS: Record<string, string[]> = {
  Solo: ["solo", "just me", "one person", "myself"],
  Small: ["small team", "few employees", "2-5", "handful"],
  Medium: ["medium", "growing team", "10-50", "multiple locations"],
  Large: ["large", "enterprise", "multi-location", "franchise", "50+"],
};

function scoreMatch(text: string, keywords: string[]): boolean {
  return keywords.some((k) => text.includes(k));
}

export function classifyBusiness(input: {
  businessName: string;
  businessTypeRaw?: string;
  goals?: string;
  painPoints?: string;
  websitePresent: boolean;
  budgetRange?: string;
  teamSizeRaw?: string;
}): BusinessClassification {
  const haystack = [
    input.businessName,
    input.businessTypeRaw,
    input.goals,
    input.painPoints,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  // Vertical Profile Engine: a registered profile's keywords take priority
  // over the generic industry map (Platform Constitution, Article III —
  // Frameworks Before Features). With no profiles registered, this is a
  // no-op and behavior below is unchanged from before the engine existed.
  const profile = detectProfile(haystack);

  let industry: string;
  if (profile) {
    industry = profile.industryLabel;
  } else {
    industry = "General Business";
    for (const [name, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
      if (scoreMatch(haystack, keywords)) {
        industry = name;
        break;
      }
    }
  }

  const sizeHaystack = (input.teamSizeRaw || "").toLowerCase();
  let size = "Small";
  for (const [name, keywords] of Object.entries(SIZE_KEYWORDS)) {
    if (scoreMatch(sizeHaystack, keywords)) {
      size = name;
      break;
    }
  }

  const businessType = input.businessTypeRaw?.trim() || industry;

  // Opportunity score: heuristic blend of signals gathered at intake.
  // Industry-agnostic by design — a profile changes *which* industry and
  // pain points are detected, never how the score itself is computed.
  let score = 20;
  if (!input.websitePresent) score += 15; // no site = clear starter opportunity, but also urgency
  if (input.websitePresent) score += 10; // has a site = further along, room for automation upsell
  if (input.painPoints && input.painPoints.length > 40) score += 15;
  if (input.goals && input.goals.length > 40) score += 10;

  const budget = (input.budgetRange || "").toLowerCase();
  if (budget.includes("20") || budget.includes("enterprise")) score += 30;
  else if (budget.includes("9") || budget.includes("10") || budget.includes("15")) score += 20;
  else if (budget.includes("4") || budget.includes("5") || budget.includes("8")) score += 10;

  if (size === "Medium") score += 10;
  if (size === "Large") score += 20;

  score = Math.max(0, Math.min(100, score));

  const painPoints: string[] = [];
  if (!input.websitePresent) painPoints.push("No existing web presence");
  if (profile) {
    for (const signal of profile.classification.painSignals) {
      if (haystack.includes(signal.pattern) && !painPoints.includes(signal.label)) {
        painPoints.push(signal.label);
      }
    }
  } else {
    if ((input.painPoints || "").toLowerCase().includes("lead")) painPoints.push("Lead capture / follow-up gaps");
    if ((input.painPoints || "").toLowerCase().includes("manual") || (input.painPoints || "").toLowerCase().includes("time"))
      painPoints.push("Manual, time-consuming operations");
    if ((input.painPoints || "").toLowerCase().includes("book") || (input.painPoints || "").toLowerCase().includes("schedul"))
      painPoints.push("Scheduling / booking friction");
  }
  if (painPoints.length === 0) painPoints.push("Undifferentiated online presence");

  const recommendedFocus: string[] = [];
  if (profile) {
    recommendedFocus.push(...profile.classification.recommendedFocus);
  } else {
    if (!input.websitePresent) recommendedFocus.push("Website foundation");
    if (score >= 31) recommendedFocus.push("Lead + follow-up automation");
    if (score >= 61) recommendedFocus.push("Internal operations tooling");
    if (score >= 86) recommendedFocus.push("Multi-system platform integration");
  }

  return { industry, businessType, size, opportunityScore: score, painPoints, recommendedFocus };
}
