# Packet 01 — Dental Classification + Package Catalog

**Executor:** Sonnet · **Depends on:** nothing · **Unblocks:** Packets 02–05

## Context

FABLE 5 is a Next.js/TypeScript/SQLite ops dashboard. Business
classification lives in `src/lib/classify.ts` (keyword heuristics), the
package catalog in `src/lib/packages.ts`, seeded into the `packages` table
by `db/seed.ts`. The Business Diagnosis Loop (ops) and Business Pain Loop
(sales) both call `classifyBusiness()`; the Package Recommendation and
Offer Match loops pick from the catalog via `packageForScore()`.

Today "dental" maps to the generic Health & Wellness industry and generic
packages. This packet teaches the platform dentistry.

## Spec

1. **`src/lib/classify.ts`**
   - Add a `Dental` industry entry to `INDUSTRY_KEYWORDS`, checked *before*
     Health & Wellness (order matters — first match wins). Keywords:
     `dental`, `dentist`, `dds`, `dmd`, `orthodont`, `endodont`,
     `periodont`, `oral surg`, `implant`, `invisalign`, `hygien`.
   - In `classifyBusiness()`, when industry is `Dental`, extend detected
     pain points from text signals: `no-show`/`no show` → "No-show and
     open-slot leakage"; `recall`/`reactivat`/`haven't been back` →
     "Recall / reactivation lapse"; `insurance`/`ppo` → "Insurance
     confusion deflecting patients"; `review` → "Weak review presence";
     plus the existing generic detections.
   - When industry is `Dental`, `recommendedFocus` must include
     "New-patient conversion website" and "Recall + reminder automation".

2. **`src/lib/packages.ts`**
   - Add to `PACKAGE_CATALOG`:
     - `pkg_dental_practice` — name "Dental Practice Package", tier
       `"growth"`, price_range `"$6,000 - $12,000"`, timeline_weeks 5,
       deliverables: "Dental practice website (from dental template)",
       "Online booking-request capture", "Appointment reminder automation",
       "Recall / reactivation sequence", "Post-visit review-request
       automation", "Local SEO + Google Business Profile setup".
     - `pkg_dental_care_plan` — name "Dental Care Plan", tier `"starter"`,
       price_range `"$300 - $600 / month"`, timeline_weeks 0, deliverables:
       "Hosting + monitoring", "Monthly content update", "Automation
       monitoring + tuning", "Monthly performance report".
   - Give both a `fitsFor` range that never wins `packageForScore()` by
     score alone (e.g. `{ minScore: -1, maxScore: -1 }`) — they are selected
     by industry, not score. Adjust `packageForScore` typing if needed;
     do not change generic behavior.
   - Export `packageForIndustry(industry: string, score: number)`: returns
     `pkg_dental_practice` when industry is `Dental`, otherwise falls back
     to `packageForScore(score)`.

3. **Wire industry-aware selection** into both
   `src/lib/loops/packageRecommendation.ts` and
   `src/lib/loops/offerMatch.ts`: use `packageForIndustry` with the
   diagnosed industry. Rationale strings must mention the industry when it
   drove the choice.

4. **`db/seed.ts`** — seeds all catalog entries already via
   `PACKAGE_CATALOG`; verify the two new packages land in the `packages`
   table on `npm run db:seed`.

## Out of scope

Website template code, task templates, proposal copy (Packets 02–05).

## Acceptance criteria

- `npm run build` passes; `npm run db:seed` seeds 6 packages.
- POST a Field Mode capture with businessType "dental practice": Business
  Pain Loop output has `industry: "Dental"`; Offer Match returns
  `pkg_dental_practice` with an industry-based rationale.
- A non-dental capture (e.g. HVAC) still returns exactly what it returns
  today (regression check against the generic tiers).
