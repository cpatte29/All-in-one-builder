# Packet 02 — Dental Onboarding Data (profile data)

**Executor:** Sonnet · **Depends on:** Packets 00, 01
**Revised by 03-platform-review.md:** was "onboarding preset + taskGeneration
conditional"; the task-generation hook is now generic in Packet 00 — this
packet is the dental onboarding *data* plus intake copy.

## Context

Packet 00's engine prepends `profile.onboardingTasks` during task
generation for any project whose package belongs to a registered profile.
This packet fills the dental profile's `onboardingTasks` with the facts a
dental engagement always needs before build starts.

## Spec

1. **`src/lib/verticals/dental.ts`** — populate `onboardingTasks` (order
   matters; this is the checklist sequence):
   1. "Collect practice basics" — name as it should appear, address, hours,
      phone, emergency policy (high)
   2. "Identify practice management system" — Dentrix / Eaglesoft / Open
      Dental / other; PMS integration desire = out of standard scope → flag
      for BAA conversation (high)
   3. "Confirm service lines to promote" — implants, aligners, cosmetic,
      sedation; drives site service pages (high)
   4. "Collect insurance + financing list" — accepted plans, membership
      plan, financing partners (medium)
   5. "Confirm booking policy" — request handling, response SLA,
      after-hours flow (high)
   6. "Review platform audit" — current Google review count/rating, review
      destination link (medium)
   7. "Photo + copy approval process" — approver; before/after photo policy
      per state advertising rules (medium)
   8. "Data-handling briefing" — walk client through data-minimization
      posture: contact + scheduling preference only, no health details in
      any FABLE-built form or message (high)

2. **`src/components/QuickCaptureForm.tsx`** — placeholder copy only:
   extend the "What They Said" placeholder with a dental example ("e.g.
   front desk can't keep up, patients not coming back for recall"). No
   structural changes.

## Out of scope

Engine edits of any kind. New tables. Task Generation Loop code.

## Acceptance criteria

- `npm run build` passes.
- Dental client → scope → Task Generation: the 8 tasks appear first, in
  order, category "Onboarding", then deliverable-derived tasks.
- Generic project task output unchanged (regression).
- Diff touches only `src/lib/verticals/dental.ts` and the form placeholder.
