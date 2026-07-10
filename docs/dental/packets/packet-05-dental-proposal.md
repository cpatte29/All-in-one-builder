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
