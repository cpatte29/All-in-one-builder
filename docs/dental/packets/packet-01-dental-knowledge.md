# Packet 01 — Dental Profile v1 (profile data)

**Executor:** Sonnet · **Depends on:** Packet 00 · **Unblocks:** 02, 05
**Revised by 03-platform-review.md:** was "dental classification + catalog
wired into loops"; now pure profile data — the engine work moved to Packet 00.

## Context

Packet 00 provides the Vertical Profile Engine. This packet supplies the
first real profile: dentistry as data. No loop or classify code is touched
here — if this packet needs an engine edit, the engine (Packet 00) is
wrong; stop and fix it there.

## Spec

1. **`src/lib/verticals/dental.ts` (new)** — `VerticalProfile` with:
   - `id: "dental"`, `version: 1`, `industryLabel: "Dental"`.
   - `classification.keywords`: `dental`, `dentist`, `dds`, `dmd`,
     `orthodont`, `endodont`, `periodont`, `oral surg`, `implant`,
     `invisalign`, `hygien`.
   - `classification.painSignals`: `no-show`/`no show` → "No-show and
     open-slot leakage" (20); `recall`/`reactivat`/`haven't been back` →
     "Recall / reactivation lapse" (20); `insurance`/`ppo` → "Insurance
     confusion deflecting patients" (15); `review` → "Weak review
     presence" (15); `front desk`/`phones` → "Front-desk overload" (15).
   - `classification.recommendedFocus`: "New-patient conversion website",
     "Recall + reminder automation", "Review growth".
   - `packages`: `{ buildPackageId: "pkg_dental_practice", recurringPackageId: "pkg_dental_care_plan" }`.
   - `onboardingTasks`: the 8 tasks specified in Packet 02.
   - `proposalFraming`: deferred to Packet 05 (add the field there).
   - Register in `src/lib/verticals/index.ts`.

2. **`src/lib/packages.ts`** — add the two catalog entries (data only,
   selection logic already generic via Packet 00):
   - `pkg_dental_practice` — "Dental Practice Package", tier `growth`,
     `"$6,000 - $12,000"`, 5 weeks, deliverables: "Dental practice website
     (from vertical site template)", "Online booking-request capture",
     "Appointment reminder automation", "Recall / reactivation sequence",
     "Post-visit review-request automation", "Local SEO + Google Business
     Profile setup".
   - `pkg_dental_care_plan` — "Dental Care Plan", tier `starter`,
     `"$300 - $600 / month"`, 0 weeks, deliverables: "Hosting + monitoring",
     "Monthly content update", "Automation monitoring + tuning",
     "Monthly performance report".
   - Both marked so score-based selection never picks them (profile-selected
     only), per the mechanism Packet 00 established.

## Out of scope

Any edit under `src/lib/loops/`, `src/lib/classify.ts`, or
`src/lib/verticals/{types,registry}.ts`.

## Acceptance criteria

- `npm run build` passes; `npm run db:seed` seeds 6 packages.
- Field Mode capture with businessType "dental practice": diagnosis
  `industry: "Dental"` with profile pain points; Offer Match returns
  `pkg_dental_practice` citing the industry.
- HVAC capture output unchanged from today (regression).
- `git diff` for this packet touches only `src/lib/verticals/dental.ts`,
  `src/lib/verticals/index.ts`, `src/lib/packages.ts`, `src/lib/classify.ts`
  (one-line keyword removal, F2), and `db/seed.ts` (industry correction, F1).

## Verification findings folded into this packet (from EXECUTION-ORDER.md)

- **F1:** update `db/seed.ts` so Riverside Family Dental's `industry` (and
  the industry inside its `diagnosis_json`) is `"Dental"` — otherwise
  Packet 05's proof-point query finds nothing. Data correction to sample
  data; no migration.
- **F2:** remove the `"dental"` keyword from the generic Health & Wellness
  map in `src/lib/classify.ts` — it moves into this profile. This is a
  data move, not an engine edit; it is the one permitted `classify.ts`
  touch in this packet.

---

## Execution Verification (Overseer)

**Constitution compliance:** PASS. Pure profile data + catalog entries.
The two engine-adjacent touches (F1 seed line, F2 keyword removal) are data
corrections mandated by findings, itemized above, and limited to single
lines. If anything else in an engine file needs editing to make this packet
work, **stop — that is a Packet 00 defect; fix it there, do not widen this
packet.**

**Frameworks Before Features:** PASS — this packet is the proof: dentistry
enters the platform without a single engine branch.

**Engine purity:** from this packet's completion, the full-tree grep is
binding: `grep -ri dental src/lib/loops src/lib/classify.ts` → no matches
(`src/lib/verticals/` is the sanctioned home).

**Loop Contract:** not applicable directly (no loop code); indirectly
verified because profile-driven diagnosis/offer-match outputs still flow
through the standard harness — covered by the dental scenario added to the
golden harness in this packet.

**Backward compatibility:** the only intentional behavior change is that
dental-keyword businesses now classify as "Dental" instead of "Health &
Wellness" — this is the directive's purpose, affects newly-run loops only,
and never rewrites existing rows. Generic (non-dental-keyword) scenarios
must diff empty.

**Dependencies:** Packet 00 merged and green.

**Regression plan:** golden harness — generic scenarios diff empty; add
dental capture scenario (businessType "dental practice") and commit its
baseline; verify 6 packages seeded; verify Riverside surfaces with
industry "Dental" after re-seed.

**Success criteria:** acceptance criteria + F1/F2 verified + dental golden
baseline committed.

**Rollback criteria:** revert if generic golden diff is non-empty, if the
diff touches files beyond the five listed, or if grep purity fails. 02/04/05
must not merge until 01 is green.
