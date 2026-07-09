# Packet 05 — Dental-Aware Proposal Generation

**Executor:** Sonnet · **Depends on:** Packet 01

## Context

The Proposal Generation Loop (`src/lib/loops/proposalGeneration.ts`) builds
`proposals` rows from the matched package. For dental leads it must speak
dentistry and answer the compliance objection preemptively — this is the
"proposal" success criterion.

## Spec

1. **`src/lib/proposals/dentalFraming.ts` (new)** — exports a
   `buildDentalFraming(lead, diagnosis)` helper returning structured
   sections merged into the proposal's `scope_json`:
   - `positioning`: 2–3 sentences tying the lead's detected pain points to
     outcomes in dental vocabulary (new-patient flow, recall, filled
     chairs, review presence). Use the actual pain points from
     `diagnosis_json`; no boilerplate that ignores capture data.
   - `proofPoint`: one sentence referencing a delivered dental client
     (query the DB for a delivered client with industry `Dental`, e.g.
     Riverside Family Dental from seed data; omit the section cleanly if
     none exists).
   - `carePlan`: the `pkg_dental_care_plan` summary as a monthly line item
     alongside the build quote.
   - `complianceFaq`: fixed block — forms collect contact + scheduling
     preference only; no health details collected or stored; reminder and
     recall messages never mention procedures; PMS integration available as
     a separate scoped engagement with a BAA.
   - `nextStep`: urgency-aware, dental-phrased ("15-minute call to review
     which service lines to feature and your front-desk booking flow").

2. **`src/lib/loops/proposalGeneration.ts`** — when the matched package is
   `pkg_dental_practice`, merge the framing sections into `scope_json` and
   use the dental `nextStep`. Non-dental proposals unchanged.

3. **Proposal Detail page (`src/app/proposals/[id]/page.tsx`)** — render
   the new sections when present: positioning paragraph above deliverables,
   care plan as its own card, compliance FAQ collapsed-style block at the
   bottom, proof point under positioning. Absent sections render nothing
   (backward compatible with existing proposals).

## Out of scope

PDF export / e-signature. Editing proposals in-UI. Changing generic proposals.

## Acceptance criteria

- `npm run build` passes.
- Dental lead through Field Mode → proposal `scope_json` contains all five
  sections; Proposal Detail renders them; positioning references at least
  one pain point actually captured on the lead.
- With no delivered dental client in the DB, `proofPoint` is omitted and
  the page renders without gaps.
- A generic (non-dental) lead's proposal is byte-identical to today's
  output (regression).
