# FABLE 5 / Atlas — Platform Constitution

**Status:** consolidated from already-ratified sources. No rule in this
document is new; each article cites where it was first established. This
file exists because `docs/dental/packets/EXECUTION-ORDER.md` required a
constitution baseline and none existed as a standalone artifact — see that
file's opening section for the prior inline version.

**Authority:** binding on every packet, every engine, every vertical.
Changing an article here is an architectural act and belongs to the
Overseer, not to an implementation packet.

---

## Article I — Not a Chatbot

FABLE 5 is an operations dashboard. The AI is a step inside a pipeline
(a loop), never the interface. No feature may introduce a conversational
interaction model as the primary way of getting work done.

*Source: original build directive ("Do not build this as a chatbot. Build
it as an operations dashboard. The AI is not the product interface. The
loop system is."); reaffirmed for Overseer Mode ("No AI chat interface.
This is an intelligence dashboard.").*

## Article II — The Loop Contract

Every loop accepts structured input, produces structured output, persists
that output to the database, updates the relevant entity's status, and
logs the action — all through the shared harness
(`executeLoop` for Operations Mode, `executeSalesLoop` for Sales Mode in
`src/lib/loops/engine.ts`). No loop bypasses the harness. No loop writes to
the database outside its declared side effects.

*Source: README.md, "The Loop System".*

## Article III — Frameworks Before Features

When a capability is needed for one case but the pattern generalizes, build
the general capability (an engine) and express the specific case as data
(a profile), not as a conditional branch inside the engine. A one-off
feature is acceptable only when the reviewing party (the Overseer)
determines the capability does not generalize.

*Source: docs/dental/03-platform-review.md, verdict summary.*

## Article IV — Engine Purity

An engine — code that implements a platform capability — may not contain
industry-specific (or otherwise case-specific) knowledge. Case-specific
knowledge lives exclusively in data modules (e.g. `src/lib/verticals/*`).
This is mechanically checked, not merely reviewed: engines are subject to
grep-enforced absence of case-specific identifiers.

*Source: docs/dental/03-platform-review.md, guardrail 1.*

## Article V — No Speculative Build

Build for the case that is real. A framework is validated by one real
instance plus synthetic test fixtures — never by shipping a second,
speculative instance (e.g. a second industry) before the business has
committed to it.

*Source: docs/dental/03-platform-review.md, guardrail 2.*

## Article VI — Backward Compatibility Is Non-Negotiable

Existing behavior — every loop's output, every page's rendering, every API
response — must remain byte-identical for inputs that don't invoke new
functionality, unless a directive explicitly authorizes changing that
behavior. This is verified by regression testing, not asserted by
inspection.

*Source: docs/dental/03-platform-review.md, guardrail 3; elevated to a
constitutional article because every implementation packet since has
depended on it.*

## Article VII — The Overseer Never Performs Work

Overseer Mode observes, evaluates, prioritizes, and recommends. It never
generates code, never runs a loop, and never writes to
clients/projects/tasks/leads/proposals/follow_ups. Its only permitted write
is its own observation history (`overseer_snapshots`).

*Source: Overseer Mode directive; README.md, "Overseer Mode".*

## Article VIII — Local-First, Cloud-Ready Data

The database schema is written in Postgres-compatible SQL from the start,
even though the running database is local SQLite. Moving to Supabase must
be a driver swap (`src/lib/db.ts`) plus running the same schema against
Postgres — never a data-model rewrite.

*Source: original build directive ("SQLite or Supabase-ready database
structure"); README.md, "Roadmap to Supabase".*

## Article IX — Extensions Are Versioned

Data modules that extend platform behavior for a specific case (vertical
profiles, and by extension the packages/sequences/framing they carry) must
declare a version. This is what lets the Overseer later correlate business
outcomes (win rate, delivery time) with a specific revision of a profile.

*Source: docs/dental/03-platform-review.md, guardrail 4.*

## Article X — Auditability

Every mutation the platform makes on the CEO's behalf is logged: ops
actions to `activity_log`, sales actions to `sales_activity`, every loop
run to the shared `loops` table with its full input/output JSON. Nothing
mutates silently.

*Source: README.md, "The Loop System" and "Sales Mode" (dedicated activity
feed rationale).*

## Article XI — Change Discipline

Implementation proceeds one packet at a time. Each packet is one
reviewable, revertible unit of change with acceptance criteria and rollback
criteria defined *before* implementation begins, not discovered afterward.
Verification (regression tests, constitution compliance, acceptance
criteria) happens after each packet and is reported before the next packet
begins.

*Source: docs/dental/packets/EXECUTION-ORDER.md, "Global rollback policy";
Head Developer directive, this session.*

---

## Amendment process

Only the Overseer amends this document, and only in response to an
executive directive or a defect found during implementation that cannot be
resolved without changing a rule (as opposed to correcting data, which any
packet may do). An implementer who believes a rule is blocking correct
implementation escalates rather than deviating.
