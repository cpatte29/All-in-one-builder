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
  returns nothing **in code this packet adds or modifies**. Note: the
  pre-existing generic keyword `"dental"` in `classify.ts`'s Health &
  Wellness map is exempt here — it is removed by Packet 01 (finding F2 in
  EXECUTION-ORDER.md). Full-tree grep purity is binding from Packet 01.

---

## Execution Verification (Overseer)

**Constitution compliance:** PASS. Engines gain profile *lookups* only; no
industry names (F2 exemption noted above); no schema changes; profiles are
versioned data (`version` field mandatory); no speculative verticals (the
only profile shipped here is the synthetic test fixture, unregistered in
production paths).

**Loop Contract:** PASS. This packet modifies loop *internals*
(classification source, package selection, task-template source, scope_json
merge) but every touched loop still runs through
`executeLoop`/`executeSalesLoop`: structured input → structured output →
DB persist → status update → activity log. No new loop types introduced;
no harness bypass permitted.

**Backward compatibility:** with an empty registry, `detectProfile` returns
nothing and every code path falls through to current behavior. This is the
load-bearing property of the whole package — verified by the golden
harness, not by inspection.

**Dependencies:** none (first packet). The golden-baseline harness
(EXECUTION-ORDER.md) must be built and its baseline committed *before*
this packet's changes.

**Regression plan:** run golden harness after merge — all four generic
scenarios must diff empty. Run fixture-profile verification script —
detection, package selection, onboarding prepend, staticSections merge all
demonstrated. `npm run build` + `npm run db:seed` clean.

**Success criteria:** acceptance criteria above + empty golden diff +
fixture script output committed as evidence in the PR/commit description.

**Rollback criteria:** revert this packet's single commit if: golden diff
non-empty on any generic scenario; build fails; or the fixture script
cannot demonstrate all four engine hooks. Dependents (01, 02, 04, 05) must
not merge until 00 is green; if 00 is reverted after any dependent merged,
revert dependents first.
