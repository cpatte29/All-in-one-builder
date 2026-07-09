# 02 — Operational Plan: Dental Vertical

The repeatable lead-to-delivery operation for dental clients, mapped onto
the loop system that already runs the company. Nothing here invents new
machinery — it configures existing loops with dental knowledge.

## Phase 0 — Platform readiness (Sonnet, ~1 week of packets)

Execute packets in order; 01 unblocks the rest, 02–05 can run in parallel
after it.

1. **Packet 01** — dental classification + dental packages in the catalog
2. **Packet 02** — dental onboarding preset + task templates
3. **Packet 03** — dental website template
4. **Packet 04** — dental automation package specs
5. **Packet 05** — dental-aware proposal generation

Exit criteria: a test lead with business type "dental practice" flows
Field Mode → diagnosis says `Dental` → offer match picks the Dental
Practice Package → proposal reads in dental vocabulary → task generation
emits the dental onboarding checklist.

## Phase 1 — First three dental clients (CEO, 90 days)

**Sourcing (CEO Field Mode, as today):**
- Ask Riverside Family Dental for 2 introductions (dentists refer dentists).
- Local dental society meetings / study clubs — capture conversations in
  Field Mode on the spot.
- Cold outreach to practices with visibly outdated sites; lead with a
  specific observation, not a pitch.

**Sales motion per lead (all existing loops):**
1. Field Mode Quick Capture at the conversation → all 6 sales loops run.
2. Same day: send the generated follow-up email.
3. Within 48h: send the dental proposal (Packet 05 output) — package,
   price, timeline, care plan, compliance FAQ.
4. Close Probability ≥ 70 → CEO calls within 24h. Overseer alerts enforce this.

**Pricing discipline for the first three:**
- Dental Practice Package: quote $6,000–$9,000 (bottom of range — we're
  buying case studies), care plan $300/month, honest about it being a new
  vertical. No custom scope. Repeatability is the product.

## Phase 2 — Delivery (per client, 4–5 weeks)

| Week | Work | Loops |
|------|------|-------|
| 1 | Onboarding checklist (Packet 02 tasks): PMS, insurance list, service lines, photo/copy approvals | Task Generation, Client Profile |
| 2–3 | Clone dental template (Packet 03), populate content, review pass | Claude Build, Quality Review |
| 3–4 | Automation setup (Packet 04): booking capture, reminders, recall, reviews | Claude Build, Quality Review |
| 4–5 | Launch, care-plan handoff, first monthly report scheduled | Client Update |

Every task goes through the Claude Build Loop → build brief → Quality
Review Loop, exactly as the platform works today.

## Phase 3 — Evaluate the vertical (Overseer, day 90)

Questions the Overseer must answer before we scale spend:
- Dental win rate vs. company baseline?
- Actual delivery time vs. the 4–5 week promise?
- Care-plan attach rate (target: 3 of 3)?
- Referral yield per delivered dental client (target: ≥1)?

Decision gate: **3 delivered + care plans attached + ≤5 weeks average
delivery** → build Gap 8 (Overseer vertical analytics) and raise prices to
the full $8,000–$12,000 range. Anything less → hold at three, diagnose,
adjust packets before scaling.

## Risks the Overseer will watch

| Risk | Signal | Mitigation |
|------|--------|-----------|
| Compliance objection stalls deals | proposals stalled ≥7d with "HIPAA" in notes | FAQ block in every proposal (Packet 05); BAA conversation script |
| Template drifts into custom work | dental projects >5 weeks | Quality Review rejects out-of-scope tasks; custom work = separate proposal |
| Vertical distracts from existing pipeline | non-dental lead flow drops | Overseer lead-flow risk detection already fires on 7-day stalls |
| One anchor client dominates | revenue concentration alert | already implemented in Overseer |
