# Packet 05 — Proposal Framing Engine + Dental Framing Pack

**Executor:** Sonnet · **Depends on:** Packets 00, 01
**Revised by 03-platform-review.md:** was a dental helper wired in with a
package conditional; now a generic framing engine + dental framing data in
the profile.

## Context

Packet 00 landed the lookup + `staticSections` merge hook in the Proposal
Generation Loop. This packet completes the engine (dynamic sections,
proof-point lookup, rendering) and supplies the dental framing content.
The engine must render *any* profile's framing; dentistry appears only in
the dental profile module.

## Spec — engine

1. **`src/lib/proposals/framing.ts` (new, industry-free)** —
   `buildFraming(profile, lead, diagnosis)`:
   - Renders `profile.proposalFraming.positioning(ctx)` and `nextStep(ctx)`
     with actual captured data (business name, real detected pain points,
     contact, urgency) — the engine passes context, profiles own the prose.
   - Resolves `proofPointQuery`: find one delivered client whose industry
     matches `industryLabel`; produce a one-sentence citation; omit the
     section cleanly when none exists.
   - Resolves `recurringPackageId` into a `carePlan` section (name, price
     range, deliverables) from the packages table.
   - Merges `staticSections` verbatim.
   - Returns a `FramingSections` record merged into the proposal's
     `scope_json` by the loop when a profile with framing matches.
2. **Proposal Detail (`src/app/proposals/[id]/page.tsx`)** — generic
   renderer for known section shapes: `positioning` (paragraph above
   deliverables), `proofPoint` (line under positioning), `carePlan` (own
   card), `complianceFaq` (block at bottom), custom string/string[] sections
   (labeled blocks). Absent sections render nothing — existing proposals
   unaffected.

## Spec — dental framing (in `src/lib/verticals/dental.ts`)

- `positioning(ctx)`: 2–3 sentences tying ctx.painPoints to dental outcomes
  (new-patient flow, recall, filled chairs, review presence). Must
  interpolate at least one actual pain point — no boilerplate.
- `nextStep(ctx)`: urgency-aware, dental-phrased ("15-minute call to review
  which service lines to feature and your front-desk booking flow";
  same-week phrasing when urgency is high).
- `staticSections.complianceFaq`: forms collect contact + scheduling
  preference only; no health details collected or stored; reminders and
  recall messages never mention procedures; PMS integration = separately
  scoped engagement with a BAA.
- `proofPointQuery: { industryLabel: "Dental" }` (Riverside Family Dental
  in seed data).
- `packages.recurringPackageId` already set in Packet 01 → carePlan section.

## Out of scope

PDF/e-signature. In-UI editing. Changes to generic proposal output.

## Acceptance criteria

- `npm run build` passes.
- Dental lead via Field Mode → `scope_json` contains positioning (with a
  real captured pain point), proofPoint, carePlan, complianceFaq, nextStep;
  Proposal Detail renders all of them.
- Empty DB of delivered dental clients → proofPoint omitted, page renders
  without gaps.
- Fixture-profile framing renders through the same engine in the
  verification script (proves industry-independence).
- Generic lead's proposal byte-identical to today (regression);
  `grep -ri dental src/lib/proposals` returns nothing.

---

## Execution Verification (Overseer)

**Constitution compliance:** PASS. Framing engine is industry-free
(grep-enforced); dental prose lives in the profile as pure functions of
captured lead data; compliance FAQ ships in `staticSections` so the posture
appears in every dental proposal without engine knowledge of it.

**Frameworks Before Features:** PASS — fixture-profile framing must render
through the same engine in the verification script.

**Engine purity:** grep criterion above; additionally the engine must not
special-case any section *name* beyond the render shapes listed (a profile
adding a custom section gets the generic labeled-block rendering).

**Loop Contract:** PASS. Proposal Generation Loop is unchanged in shape:
input `{ leadId }`, structured output, `proposals` row persisted, lead
status → `proposal_ready`, sales activity logged. Framing enriches
`scope_json` inside the existing side-effect path — no second write path,
no new loop type.

**Backward compatibility:** proposals without framing sections render
exactly as today (renderer returns nothing for absent sections); generic
proposal output byte-identical (golden scenario). Existing dental-less DBs:
proof point cleanly omitted — explicitly tested.

**Dependencies:** Packets 00 and 01 (including F1 — without the seed
industry correction the proof-point acceptance cannot pass). Merge after
04 if both are in flight (shared `dental.ts`).

**Regression plan:** golden harness — generic proposal scenario diffs
empty; dental proposal scenario added with all five sections asserted;
empty-proof-point path exercised against a DB seeded without the delivered
dental client (harness variant).

**Success criteria:** acceptance criteria + both dental baselines (with and
without proof point) committed.

**Rollback criteria:** revert if the generic proposal diff is non-empty, if
Proposal Detail errors on any pre-existing proposal row, or if grep purity
fails. Nothing depends on 05; it reverts freely (mind the shared
`dental.ts` hunk if 04 merged after it).
