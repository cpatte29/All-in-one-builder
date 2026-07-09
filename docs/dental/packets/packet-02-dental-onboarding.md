# Packet 02 — Dental Onboarding Preset + Task Templates

**Executor:** Sonnet · **Depends on:** Packet 01

## Context

The Task Generation Loop (`src/lib/loops/taskGeneration.ts`) turns a
project's scope deliverables into task cards via `tasksForDeliverable()`.
Dental engagements always require the same intake facts before build can
start; today nothing collects them. The success criterion is a
*repeatable onboarding process* — encoded as tasks, not a wiki page.

## Spec

1. **`src/lib/onboarding/dental.ts` (new)** — export
   `DENTAL_ONBOARDING_TASKS`: an ordered array of
   `{ title, description, category: "Onboarding", priority }`:
   - "Collect practice basics" — practice name as it should appear, address,
     hours, phone, emergency policy (high)
   - "Identify practice management system" — Dentrix / Eaglesoft / Open
     Dental / other; determines whether booking stays request-only
     (standard) or a PMS integration conversation is needed (out of
     standard scope → BAA discussion) (high)
   - "Confirm service lines to promote" — which high-margin services get
     dedicated pages: implants, aligners, cosmetic, sedation (high)
   - "Collect insurance + financing list" — accepted plans, membership
     plan, financing partners (medium)
   - "Confirm booking policy" — how requests reach the front desk, response
     SLA, after-hours handling (high)
   - "Review platform audit" — current Google review count/rating, where
     review requests should point (medium)
   - "Photo + copy approval process" — who approves; confirm before/after
     photo policy per state advertising rules (medium)
   - "Data-handling briefing" — walk client through the form
     data-minimization posture: contact info + appointment preference only,
     no health details in any FABLE-built form (high)

2. **`src/lib/loops/taskGeneration.ts`** — when the project's package is
   `pkg_dental_practice`, prepend `DENTAL_ONBOARDING_TASKS` (instead of the
   generic `CATEGORY_TEMPLATES.default` setup tasks) before the
   per-deliverable tasks. Non-dental projects unchanged.

3. **Field Mode hint (`src/components/QuickCaptureForm.tsx`)** — placeholder
   text only: extend the "What They Said" placeholder to include a dental
   example ("e.g. front desk can't keep up, patients not coming back for
   recall"). No structural form changes.

## Out of scope

Website/automation implementation (Packets 03–04). New DB tables — task
templates live in code, tasks land in the existing `tasks` table.

## Acceptance criteria

- `npm run build` passes.
- Create a dental client → scope with `pkg_dental_practice` → run Task
  Generation: the 8 onboarding tasks appear first, categorized
  "Onboarding", followed by deliverable-derived tasks.
- A generic project still generates its current task set (regression).
