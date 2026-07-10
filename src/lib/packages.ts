export interface PackageDefinition {
  id: string;
  name: string;
  tier: "starter" | "growth" | "pro" | "enterprise";
  description: string;
  price_range: string;
  deliverables: string[];
  timeline_weeks: number;
  fitsFor: { minScore: number; maxScore: number };
}

// Opportunity score (0-100) from the Business Diagnosis Loop maps onto a tier.
export const PACKAGE_CATALOG: PackageDefinition[] = [
  {
    id: "pkg_starter_site",
    name: "Starter Web Presence",
    tier: "starter",
    description:
      "A single, fast, professionally designed marketing site for businesses that have little to no online presence today.",
    price_range: "$1,500 - $3,000",
    deliverables: [
      "5-page responsive website",
      "Basic on-page SEO setup",
      "Contact form + email routing",
      "Google Business Profile setup",
    ],
    timeline_weeks: 2,
    fitsFor: { minScore: 0, maxScore: 30 },
  },
  {
    id: "pkg_growth_automation",
    name: "Growth + Automation Package",
    tier: "growth",
    description:
      "For businesses with an existing site or process that needs modernizing, plus automation of lead intake and follow-up.",
    price_range: "$4,000 - $8,000",
    deliverables: [
      "Redesigned/rebuilt website",
      "CRM + lead intake automation",
      "Automated email/SMS follow-up sequences",
      "Analytics + conversion tracking",
    ],
    timeline_weeks: 4,
    fitsFor: { minScore: 31, maxScore: 60 },
  },
  {
    id: "pkg_pro_ai_ops",
    name: "Pro AI Ops Package",
    tier: "pro",
    description:
      "For established businesses ready to automate internal operations with AI: scheduling, support, reporting, and custom tooling.",
    price_range: "$9,000 - $18,000",
    deliverables: [
      "Custom web app or internal portal",
      "AI-assisted customer support / intake workflows",
      "Internal operations dashboard",
      "Third-party integrations (CRM, payments, scheduling)",
    ],
    timeline_weeks: 6,
    fitsFor: { minScore: 61, maxScore: 85 },
  },
  {
    id: "pkg_enterprise_platform",
    name: "Enterprise Platform Build",
    tier: "enterprise",
    description:
      "Full custom platform build with multi-system integration for larger organizations with complex, multi-stakeholder needs.",
    price_range: "$20,000+",
    deliverables: [
      "Custom multi-module platform",
      "Role-based access + multi-team workflows",
      "Full systems integration (ERP/CRM/payments/data)",
      "Dedicated build + QA loop cadence",
    ],
    timeline_weeks: 10,
    fitsFor: { minScore: 86, maxScore: 100 },
  },
  // Vertical packages below are selected by a matched VerticalProfile
  // (src/lib/verticals/), never by packageForScore() — fitsFor is set to
  // an unreachable range so score-based selection can never pick them.
  {
    id: "pkg_dental_practice",
    name: "Dental Practice Package",
    tier: "growth",
    description:
      "New-patient conversion website, booking-request capture, and appointment/recall/review automation for a dental practice.",
    price_range: "$6,000 - $12,000",
    deliverables: [
      "Dental practice website (from vertical site template)",
      "Online booking-request capture",
      "Appointment reminder automation",
      "Recall / reactivation sequence",
      "Post-visit review-request automation",
      "Local SEO + Google Business Profile setup",
    ],
    timeline_weeks: 5,
    fitsFor: { minScore: -1, maxScore: -1 },
  },
  {
    id: "pkg_dental_care_plan",
    name: "Dental Care Plan",
    tier: "starter",
    description: "Ongoing hosting, content, and automation monitoring for a delivered dental practice site.",
    price_range: "$300 - $600 / month",
    deliverables: [
      "Hosting + monitoring",
      "Monthly content update",
      "Automation monitoring + tuning",
      "Monthly performance report",
    ],
    timeline_weeks: 0,
    fitsFor: { minScore: -1, maxScore: -1 },
  },
];

export function packageForScore(score: number): PackageDefinition {
  return (
    PACKAGE_CATALOG.find((p) => score >= p.fitsFor.minScore && score <= p.fitsFor.maxScore) ??
    PACKAGE_CATALOG[0]
  );
}
