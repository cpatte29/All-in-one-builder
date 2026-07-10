# Packet 00 — Vertical Profile Engine (platform capability)

**Executor:** Sonnet · **Depends on:** nothing · **Unblocks:** all other packets

## Context

FABLE 5's loops currently treat every business generically; the dental
directive (docs/dental/) was about to introduce `if (industry === "Dental")`
branches into four loops. This packet builds the platform capability
instead: verticals as data modules, engines that consult the active profile
and never name an industry. Dental (Packet 01) is the first profile; future
verticals must require zero engine edits.

## Spec

1. **`src/lib/verticals/types.ts` (new)** — the profile contract:

   ```ts
   interface VerticalProfile {
     id: string;                  // "dental"
     version: number;             // bump on revision; Overseer correlates outcomes later
     industryLabel: string;       // "Dental" — value written to clients.industry / diagnosis
     classification: {
       keywords: string[];                       // industry detection, checked before generic map
       painSignals: { pattern: string; label: string; weight: number }[];
       recommendedFocus: string[];
     };
     packages: { buildPackageId: string; recurringPackageId?: string };
     onboardingTasks: { title: string; description: string; priority: "low" | "medium" | "high" }[];
     proposalFraming?: {
       positioning: (ctx: { businessName: string; painPoints: string[] }) => string;
       nextStep: (ctx: { contactName: string; urgency: string }) => string;
       staticSections: Record<string, string | string[]>;  // complianceFaq, carePlan, ...
       proofPointQuery?: { industryLabel: string };        // find a delivered client to cite
     };
     sequences?: SequenceSpec[];   // defined in Packet 04's engine types
   }
   ```

   Exact shapes may be refined during implementation, but the contract must
   stay: **pure data + pure functions of captured lead data. No profile
   field may reach into the DB or mutate anything.**

2. **`src/lib/verticals/registry.ts` (new)** — `registerProfile()`,
   `profileForIndustry(label)`, `detectProfile(text)` (keyword match,
   consulted before the generic `INDUSTRY_KEYWORDS` map, first match wins).
   Registry starts empty; profiles self-register via an `index.ts` import.

3. **Wire four engines to the registry (generic lookups only):**
   - `src/lib/classify.ts` — `classifyBusiness()` consults
     `detectProfile()` first; on match, uses profile keywords/painSignals/
     recommendedFocus. No profile → exactly current behavior.
   - `packageRecommendation.ts` + `offerMatch.ts` — if
     `profileForIndustry(diagnosed industry)` exists, select
     `profile.packages.buildPackageId`; rationale mentions the industry
     label from the profile. No profile → `packageForScore()` as today.
   - `taskGeneration.ts` — if the project's package matches a registered
     profile's `buildPackageId`, prepend `profile.onboardingTasks`
     (category "Onboarding") instead of the generic setup tasks.
   - `proposalGeneration.ts` — if a profile with `proposalFraming` matches,
     merge framing sections into `scope_json` (mechanics in Packet 05; this
     packet lands the lookup + merge hook with `staticSections` only).

4. **Verification fixture:** `src/lib/verticals/__fixtures__/testProfile.ts`
   — a minimal synthetic profile (fake industry "Test Vertical") used by a
   verification script to prove the engine paths work independently of any
   real vertical. Not registered in production code paths (registered only
   inside the verification script).

## Guardrails (grep-enforced in acceptance)

- The strings `dental`/`Dental` must not appear anywhere in this packet's
  code. This packet is industry-free by definition.
- No schema changes. Profiles are code-level data; packages still live in
  the `packages` table via the existing catalog + seed.

## Out of scope

The dental profile itself (Packet 01), site template (03), sequence engine
internals (04), framing renderer (05).

## Acceptance criteria

- `npm run build` passes; `npm run db:seed` unchanged.
- Verification script registers the fixture profile and shows: detection
  routes to it, its package is selected, onboarding tasks prepend, static
  framing sections merge into a proposal.
- With no profiles registered, every loop output is byte-identical to
  current behavior (regression).
- `grep -ri dental src/lib/verticals src/lib/loops src/lib/classify.ts`
  returns nothing.
