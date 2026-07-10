import { registerProfile } from "./registry";
import type { VerticalProfile } from "./types";

/**
 * Dental Profile v1. Pure data — see Packet 00 (src/lib/verticals/{types,
 * registry}.ts) for the engine that consults this. If reading this module
 * requires editing anything under src/lib/loops/ or src/lib/classify.ts to
 * work, the engine is wrong; fix it there, not here.
 *
 * onboardingTasks and proposalFraming are intentionally left minimal here —
 * they are populated by their own dedicated packets (02 and 05
 * respectively) so each stays a single, reviewable, revertible unit of
 * change (Platform Constitution, Article XI).
 */
const dentalProfile: VerticalProfile = {
  id: "dental",
  version: 1,
  industryLabel: "Dental",
  classification: {
    keywords: [
      "dental",
      "dentist",
      "dds",
      "dmd",
      "orthodont",
      "endodont",
      "periodont",
      "oral surg",
      "implant",
      "invisalign",
      "hygien",
    ],
    painSignals: [
      { pattern: "no-show", label: "No-show and open-slot leakage", weight: 20 },
      { pattern: "no show", label: "No-show and open-slot leakage", weight: 20 },
      { pattern: "recall", label: "Recall / reactivation lapse", weight: 20 },
      { pattern: "reactivat", label: "Recall / reactivation lapse", weight: 20 },
      { pattern: "haven't been back", label: "Recall / reactivation lapse", weight: 20 },
      // Note: a standalone "ppo" pattern was dropped — it's a substring of
      // "appointments," a word dental pain text uses constantly, and
      // produced false-positive "insurance" matches on text never
      // mentioning insurance at all. "insurance" alone covers the signal.
      { pattern: "insurance", label: "Insurance confusion deflecting patients", weight: 15 },
      { pattern: "review", label: "Weak review presence", weight: 15 },
      { pattern: "front desk", label: "Front-desk overload", weight: 15 },
      { pattern: "phones", label: "Front-desk overload", weight: 15 },
    ],
    recommendedFocus: ["New-patient conversion website", "Recall + reminder automation", "Review growth"],
  },
  packages: {
    buildPackageId: "pkg_dental_practice",
    recurringPackageId: "pkg_dental_care_plan",
  },
  onboardingTasks: [],
};

registerProfile(dentalProfile);

export default dentalProfile;
