# Packet 04 — Sequence Engine + Dental Sequence Pack

**Executor:** Sonnet · **Depends on:** Packet 00 (types), pairs with Packet 03's form
**Revised by 03-platform-review.md:** was "dental automations"; the review
found this the clearest engine case of all five — timed sequences, channel
adapters, opt-out, SLA tasks are industry-agnostic. Engine first (04a),
dental specs as data (04b), one packet.

## Context

Automation deliverables must be concrete, buildable specs. Any
appointment-driven business (dental, med spa, chiro, vet, salon) needs the
same machinery: notify on lead capture, remind before appointments,
reactivate lapsed customers, request reviews. Only templates, offsets, and
vocabulary differ — that's data.

## Spec — 04a: Sequence Engine (`src/lib/sequences/`)

1. **`types.ts`** — the contract:
   - `SequenceSpec`: id, trigger (`lead_captured` | `appointment_scheduled`
     | `lapsed_customer` | `visit_completed`), steps.
   - `SequenceStep`: offset (relative to trigger), channel (`email`|`sms`),
     `MessageTemplate`.
   - `MessageTemplate`: subject?, body with a **closed placeholder set**:
     `{firstName}`, `{businessName}`, `{phone}`, `{link}`, `{dateTime}` —
     nothing else. **Type-level data minimization: no placeholder for
     procedure/health/notes may exist, and step inputs are typed records
     (`{ firstName, contact, ...trigger-specific timestamps }`) that cannot
     carry free-text fields.**
   - `ChannelAdapter` interface + dev adapters (`console`, `file`).
2. **`engine.ts`** — resolve a spec against a trigger record: compute step
   send-times, render templates, dispatch via adapter; skip everything when
   `doNotContact` is set; emit an SLA follow-up task record when a
   `lead_captured` sequence's acknowledgment isn't confirmed in time.
   MVP scheduling = computed plan + manual/cron invocation; real
   Twilio/SendGrid adapters are documented swap points, not dependencies.
3. Profiles carry `sequences?: SequenceSpec[]` (field landed in Packet 00).

## Spec — 04b: Dental sequence pack (data in `src/lib/verticals/dental.ts`)

Four `SequenceSpec`s:
1. **Booking capture** (`lead_captured`): notify front desk immediately;
   auto-acknowledge patient ("we'll call within {X} business hours"); SLA
   follow-up task if unconfirmed.
2. **Appointment reminders** (`appointment_scheduled`): T-7d email, T-2d
   SMS, T-3h SMS. Date/time + practice contact only — a reminder naming a
   procedure is a PHI leak on a lock screen, and the closed placeholder set
   makes it unrepresentable.
3. **Recall/reactivation** (`lapsed_customer`, default 7 months): day-0
   gentle email, day-14 SMS, day-45 final email with booking link.
4. **Review request** (`visit_completed`): single message with review link;
   once per visit; honors `doNotContact`.

## Documentation

`docs/dental/automation-runbook.md` — per sequence: trigger, step table,
verbatim template text, adapter swap instructions, data-minimization rules.
Quality Review checks builds against this runbook.

## Out of scope

PMS integrations (BAA conversation, separate proposal). Live provider
wiring. Any second vertical's sequences.

## Acceptance criteria

- `npm run build` passes.
- Verification script runs all four dental specs plus a synthetic fixture
  spec through the engine with dev adapters: correct offsets, rendering,
  `doNotContact` short-circuit, SLA task emission.
- Type-level check: a step input carrying a `procedure` or free-text field
  fails to compile; template with an unknown placeholder fails validation.
- `grep -ri dental src/lib/sequences` returns nothing (engine is
  industry-free; dental lives in the profile).
- Runbook matches implemented templates verbatim.

---

## Execution Verification (Overseer)

**Constitution compliance:** PASS. Engine (04a) is industry-free and
grep-enforced; dental sequences (04b) are data in the profile; the closed
placeholder set makes the compliance posture *unrepresentable* rather than
merely documented — the strongest form of the data-minimization rule.

**Frameworks Before Features:** PASS — the review's clearest engine case.
Fixture sequence spec in the verification script proves industry
independence.

**Engine purity:** grep criterion above.

**Loop Contract:** the Sequence Engine is NOT a loop and must not be
disguised as one — it has no DB writes in MVP beyond emitting an SLA
follow-up task record, which must go through the existing `follow_ups` /
`tasks` write paths if persisted. If Sonnet finds the SLA task needs
persistence, it uses the existing table + logs sales activity via the
existing helper — no new harness, no new activity feeds.

**Backward compatibility:** purely additive (`src/lib/sequences/` is new;
profile gains an optional field). Golden harness must diff empty across
the board — no existing endpoint changes behavior.

**Dependencies:** Packet 00 (profile `sequences` field + types), Packet 01
(the dental profile module to attach specs to). Pairs with Packet 03's
form at delivery time but has no build-time dependency on it. If run in
parallel with 05, merge 04 first (both edit `dental.ts`).

**Regression plan:** golden harness diff empty (no API surface changes);
sequence verification script output (offsets, rendering, doNotContact, SLA
emission) committed as evidence; type-level negative test present
(uncompilable health-field example, kept as a type-error fixture or
documented compile-failure check).

**Success criteria:** acceptance criteria + verification script evidence +
runbook/template verbatim match.

**Rollback criteria:** revert if golden diff is non-empty, if any template
placeholder outside the closed set exists, or if the engine imports
anything from `src/lib/verticals/` (dependency direction must be
profile → engine types, never engine → profiles). Packet 05 does not
depend on 04; it reverts freely unless 05 was merged with references to
04's types in `dental.ts` — in that case revert 05's `dental.ts` hunk first.
