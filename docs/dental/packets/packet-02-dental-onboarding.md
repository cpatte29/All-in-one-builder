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

---

## Execution Verification (Overseer)

**Constitution compliance:** PASS. Data-only packet: an ordered task array
in the dental profile plus placeholder copy. Zero engine surface.

**Frameworks Before Features:** PASS — relies entirely on Packet 00's
generic onboarding-prepend hook; any temptation to touch
`taskGeneration.ts` here means the hook is defective in 00.

**Engine purity:** trivially maintained (no engine files in the diff —
enforced by the diff-scope acceptance criterion).

**Loop Contract:** Task Generation Loop continues through `executeLoop`
unchanged: input `{ projectId }`, structured task-list output, tasks
persisted, project status → `tasks_generated`, activity logged. The
onboarding tasks ride the existing side-effect path.

**Backward compatibility:** generic projects get the generic setup tasks
exactly as today (golden scenario (b) covers this). Dental projects gain
the 8-task checklist — new behavior, new baseline.

**Dependencies:** Packets 00 and 01 merged and green.

**Regression plan:** golden harness — generic scenarios diff empty; extend
the dental scenario through scope → task generation and commit the
baseline showing the 8 onboarding tasks first, in order, category
"Onboarding".

**Success criteria:** acceptance criteria + dental task baseline committed.

**Rollback criteria:** revert if generic task output changes, if the diff
exceeds the two files, or if onboarding tasks appear on non-dental
projects. No packets depend on 02; it reverts freely.
