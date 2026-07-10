# Execution Package — Master Sheet

**Prepared by:** the Overseer · **Executor:** Claude Sonnet
**Scope:** Packets 00–05. One packet = one commit = one reviewable, revertible change.

## The Platform Constitution (binding on every packet)

No single constitution file predates this package; the constitution is the
set of already-ratified principles, cited here as the compliance baseline:

1. **Loop Contract** (README.md, "The Loop System"): every loop accepts
   structured input, produces structured output, saves output to the
   database, updates entity status, and logs activity through the shared
   harness (`executeLoop`/`executeSalesLoop`). No loop bypasses the harness.
2. **Frameworks Before Features** (docs/dental/03-platform-review.md):
   engines are industry-free; industries are versioned data modules.
3. **Grep-enforced engine purity** (03-platform-review.md guardrail 1).
4. **No speculative verticals** (guardrail 2): dental + synthetic fixtures only.
5. **Generic behavior frozen** (guardrail 3): regression-checked per packet.
6. **Versioned profiles** (guardrail 4).
7. **Overseer boundary** (README.md, Overseer Mode): observation modules
   never mutate business data. (No packet touches the Overseer; noted for
   completeness.)

## Verification findings (critical review, pre-execution)

Two defects found and resolved during verification — both data-level, no
architecture change:

- **F1 — Proof-point mismatch.** `db/seed.ts` stores Riverside Family
  Dental with industry `"Health & Wellness"`; Packet 05's
  `proofPointQuery: { industryLabel: "Dental" }` would find nothing.
  **Resolution:** Packet 01 updates the seeded industry (and its
  diagnosis_json industry field) to `"Dental"`. Seed is sample data;
  this is a data correction, not a migration.
- **F2 — Guardrail ordering.** `src/lib/classify.ts` already contains the
  keyword `"dental"` in the generic Health & Wellness map, so Packet 00's
  grep criterion would fail before dental work begins. **Resolution:** the
  keyword moves to the dental profile in Packet 01 (removed from the
  generic map there — a data move, not an engine edit). Packet 00's grep
  criterion applies to code Packet 00 *adds/modifies*; the full-tree grep
  becomes binding at Packet 01 completion.

## Dependency graph and implementation order

```
00 Vertical Profile Engine        (no deps)
└─ 01 Dental Profile v1           (00)
   ├─ 02 Dental Onboarding Data   (00, 01)
   ├─ 04 Sequence Engine + pack   (00; dental pack needs 01's profile module)
   └─ 05 Framing Engine + pack    (00, 01)
03 Vertical Site Template          (independent; naming from 00 only)
```

**Order:** 00 → 01 → {02, 03, 04, 05 in any order or parallel}.
03 may start alongside 00/01 (separate workspace, no shared files).
04 and 05 both edit `src/lib/verticals/dental.ts`; if run in parallel,
sequence their merges (04 then 05) to avoid conflicts.

## Global regression testing plan (applies to every packet)

**Golden-baseline harness — Sonnet builds this FIRST, before Packet 00:**

1. `scripts/golden.ts` (dev-only): resets DB (`npm run db:seed`), boots the
   app, executes a fixed API scenario set, normalizes responses (strip ids,
   timestamps, ports), writes JSON to `tests/golden/`.
   Scenario set: (a) generic Field Mode capture (HVAC) through all 6 sales
   loops; (b) generic ops chain — intake → diagnose → recommend → scope →
   generate tasks → build brief → review pass → client update; (c) proposal
   send + follow-up status change; (d) GET /api/overseer.
2. Baseline is captured once on the pre-Packet-00 commit and committed.
3. Every packet's definition of done includes: re-run harness → diff
   against baseline → **empty diff for all generic scenarios**. Packets
   01/02/05 add dental scenarios to the harness as they land (new files,
   never edits to generic baselines).
4. `npm run build` and `npm run db:seed` must pass at every packet boundary.

## Global success criteria (the package is done when)

- All six packets merged in order, each satisfying its own acceptance
  criteria and the golden harness.
- End-to-end dental flow works: Field Mode capture with businessType
  "dental practice" → industry "Dental" → dental packages recommended →
  dental proposal with all five framing sections → dental onboarding tasks
  on scope → four dental sequences run in the verification script.
- End-to-end generic flow byte-identical to the pre-00 baseline.
- Grep guardrail clean: `grep -ri dental src/lib/loops src/lib/sequences
  src/lib/proposals src/lib/classify.ts` → no matches (binding from
  Packet 01 onward).
- Riverside Family Dental surfaces as the proof point in a dental proposal.

## Global rollback policy

- **Unit of rollback = the packet's single commit** (`git revert`).
- Rollback triggers (any one): root or template build fails post-merge;
  golden diff non-empty on a generic scenario; grep guardrail regression;
  a later packet reveals an engine change is required inside a
  data-only packet (constitution violation — revert and fix the engine
  packet instead).
- Order-aware: reverting 00 or 01 requires first reverting dependents
  already merged (02/04/05). 03 reverts independently.
- No schema rollbacks needed: no packet alters existing tables (00–05 add
  no migrations; catalog/seed changes re-run idempotently via db:seed).

## Per-packet verification

Each packet file now carries an **Execution Verification (Overseer)**
section: constitution compliance, loop-contract check, backward
compatibility, dependencies, packet-level regression plan, success
criteria, and rollback criteria. The packet files are the authoritative
work orders; this sheet is the index.
