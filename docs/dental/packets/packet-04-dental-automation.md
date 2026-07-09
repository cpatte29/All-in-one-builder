# Packet 04 — Dental Automation Package

**Executor:** Sonnet · **Depends on:** Packet 01; pairs with Packet 03's booking form

## Context

"Automation package" must be a concrete, buildable spec, not a deliverable
string. The Claude Build Loop hands tasks to developers as structured
briefs; this packet defines the four standard dental automations so those
briefs are precise and identical across clients. MVP implementations are
local-first (same philosophy as the rest of FABLE): sequence engines +
message templates + adapter interfaces, with real SMS/email providers
(Twilio/SendGrid) as documented adapter swaps, not hard dependencies.

## Spec

Create `src/lib/automations/dental/` in the FABLE repo with one module per
automation plus shared types (`types.ts`: `SequenceStep`, `MessageTemplate`,
`ChannelAdapter` with `console`/`file` dev adapters).

1. **`bookingCapture.ts`** — on booking-request submission (Packet 03 form):
   notify front desk (channel adapter, dev = console/file), auto-acknowledge
   the patient ("We got your request — we'll call you within X business
   hours"), and create a follow-up task if unconfirmed after the SLA.
   Payload contains contact info + preferences only — **the adapter
   interface must not accept a free-text health field; enforce via types.**

2. **`reminders.ts`** — appointment reminder sequence for a
   `{ patientFirstName, phoneOrEmail, appointmentAt }` record: T-7d email,
   T-2d SMS, T-3h SMS templates with confirm/reschedule reply guidance.
   Message templates contain date/time + practice contact only — never
   procedure or health details (a reminder mentioning treatment type is a
   PHI leak on a lock screen).

3. **`recall.ts`** — reactivation sequence for patients unseen for N months
   (default 7): gentle email at day 0, SMS at day 14, final email at day 45
   with booking-request link. Input is `{ firstName, contact, lastVisitAt }`
   only.

4. **`reviewRequest.ts`** — post-visit single message (email or SMS) with
   the practice's review link (from site config), sent once per visit,
   opt-out honored via a `doNotContact` flag checked by every automation in
   this package.

5. **Documentation:** `docs/dental/automation-runbook.md` — per automation:
   trigger, sequence table, template text, adapter swap instructions, and
   the data-minimization rules restated. This runbook is what Quality
   Review checks builds against.

## Out of scope

Direct PMS (Dentrix/Eaglesoft/Open Dental) integrations — standard package
excludes them; they require a BAA conversation and a custom proposal.
Actual Twilio/SendGrid wiring (adapter swap docs only).

## Acceptance criteria

- `npm run build` passes.
- Unit-style verification script or test exercising each sequence with the
  dev adapter: correct steps at correct offsets, `doNotContact` short-circuits.
- Type-level check: no automation input type accepts health/procedure
  fields; templates contain no `{procedure}`-style placeholders.
- Runbook exists and matches the implemented templates verbatim.
