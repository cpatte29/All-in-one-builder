import type { VerticalProfile } from "./types";

const registry = new Map<string, VerticalProfile>();

export function registerProfile(profile: VerticalProfile): void {
  registry.set(profile.id, profile);
}

export function allProfiles(): VerticalProfile[] {
  return Array.from(registry.values());
}

export function profileForIndustry(industryLabel: string): VerticalProfile | undefined {
  return allProfiles().find((p) => p.industryLabel === industryLabel);
}

export function profileForPackageId(packageId: string): VerticalProfile | undefined {
  return allProfiles().find(
    (p) => p.packages.buildPackageId === packageId || p.packages.recurringPackageId === packageId
  );
}

/** First profile whose classification keywords appear in `text` (already lowercased by the caller, or not — matching is case-insensitive). */
export function detectProfile(text: string): VerticalProfile | undefined {
  const haystack = text.toLowerCase();
  return allProfiles().find((p) => p.classification.keywords.some((k) => haystack.includes(k)));
}

/**
 * Test-only. Clears all registered profiles. Never called from a
 * production code path — verification scripts use it to isolate the
 * fixture profile from whatever profiles are registered in src/lib/verticals/index.ts.
 */
export function __resetRegistryForTests(): void {
  registry.clear();
}
