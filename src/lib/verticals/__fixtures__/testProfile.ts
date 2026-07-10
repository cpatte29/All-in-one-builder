import type { VerticalProfile } from "../types";

/**
 * A synthetic, never-registered-in-production profile used only by
 * scripts/verify-vertical-engine.ts to prove the Vertical Profile Engine
 * works for an arbitrary industry, independent of any specific real
 * vertical (Platform Constitution, Article V — No Speculative Build: this
 * is a fixture, not a second real vertical).
 */
export function createTestProfile(): VerticalProfile {
  return {
    id: "test-vertical",
    version: 1,
    industryLabel: "Test Vertical",
    classification: {
      keywords: ["zzzfixturekeyword"],
      painSignals: [{ pattern: "zzzpain", label: "Fixture pain signal", weight: 50 }],
      recommendedFocus: ["Fixture focus area"],
    },
    packages: { buildPackageId: "pkg_test_vertical_fixture" },
    onboardingTasks: [
      { title: "Fixture onboarding task", description: "Proves the onboarding-prepend hook works.", priority: "high" },
    ],
    proposalFraming: {
      positioning: (ctx) => `Fixture positioning for ${ctx.businessName}.`,
      nextStep: (ctx) => `Fixture next step for ${ctx.contactName}.`,
      staticSections: { fixtureFaq: "Fixture static section content." },
    },
  };
}
