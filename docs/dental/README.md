# Dental Vertical — Executive Directive Packet

**Directive 1:** FABLE begins serving dentists. Success criteria: a
repeatable onboarding process, a standard proposal, a website template, and
an automation package.

**Directive 2 (platform review):** before forwarding to Sonnet, convert
industry-specific implementations into reusable platform capabilities where
warranted. Verdict and rationale: `03-platform-review.md`. All five packets
were revised around one new capability — the **Vertical Profile Engine** —
so that dental is the first *profile*, not a special case, and future
verticals require zero engine edits.

**Directive 3 (execution package):** the packets are now execution-ready.
`packets/EXECUTION-ORDER.md` is the master sheet — constitution baseline,
verification findings (two defects found and resolved: F1 proof-point
seed mismatch, F2 grep-guardrail ordering), dependency graph, golden-
baseline regression harness, global success criteria, and rollback policy.
Every packet carries an **Execution Verification (Overseer)** section:
constitution compliance, loop-contract check, backward compatibility,
dependencies, regression plan, success criteria, rollback criteria.

| File | Purpose |
|------|---------|
| `00-analysis.md` | Market analysis: what dental practices buy, why, from whom |
| `01-what-atlas-must-learn.md` | Gap assessment (original; gaps still valid, remedies now engine+profile) |
| `02-operational-plan.md` | 90-day lead-to-delivery operating plan |
| `03-platform-review.md` | Engine-vs-one-off review: the three questions answered per packet |
| `packets/EXECUTION-ORDER.md` | **Master execution sheet** — order, harness, rollback policy |
| `packets/packet-00-vertical-profile-engine.md` | **Engine** — vertical profiles as data, generic wiring into 4 loops |
| `packets/packet-01-dental-knowledge.md` | Profile data — dental classification signals + package catalog entries (+ F1/F2 fixes) |
| `packets/packet-02-dental-onboarding.md` | Profile data — dental onboarding checklist + intake copy |
| `packets/packet-03-dental-website-template.md` | Engine + pack — vertical site base + dental content pack |
| `packets/packet-04-dental-automation.md` | Engine + pack — Sequence Engine + dental sequence specs |
| `packets/packet-05-dental-proposal.md` | Engine + pack — Proposal Framing Engine + dental framing |

**Execution order:** golden baseline → 00 → 01 → (02, 04, 05 sequenced on
`dental.ts`; 03 fully parallel). Each packet is one reviewable, revertible
commit, self-contained for a Sonnet executor.

**Guardrails on every packet** (from the platform review):
1. No industry names inside engines — grep-enforced.
2. One real profile (dental) + synthetic fixtures only; no speculative verticals.
3. Generic behavior frozen — regression criteria in every packet.
4. Profiles are versioned data so the Overseer can correlate outcomes with
   profile revisions.

**Division of labor:** the Overseer observes, evaluates, and specifies.
Sonnet builds. Nothing in this folder is implementation.
