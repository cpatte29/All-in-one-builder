# 03 — Platform Review: Engines vs. One-Offs

**Directive:** before forwarding to Sonnet, determine which packets should
become reusable platform capabilities. For each: can it become a platform
engine? Can it support additional industries without modification? Should
configuration replace custom code?

## Verdict summary

All five packets shared one flaw: dental knowledge hard-coded into loop
code (`if (industry === "Dental")` branches in classify, offer match, task
generation, proposal generation). Five such branches today means N branches
per future vertical — the platform would accrete industry conditionals in
every engine. **All five packets are revised** around a single new
capability:

> **The Vertical Profile Engine (new Packet 00):** one registry at
> `src/lib/verticals/` where an industry is a *data module* — keywords,
> pain signals, packages, onboarding tasks, proposal framing, automation
> sequences, site content. Engines look up the active profile; they never
> mention an industry by name. Dental becomes the first profile, not a
> special case.

Entering a new vertical (med spa, chiropractic, law, HVAC...) then means
writing one profile module + one site content pack — zero engine edits.
That is the framework-over-feature outcome the directive asks for.

## Packet-by-packet answers

### Packet 01 — Dental classification + packages

| Question | Answer |
|---|---|
| Platform engine? | **Yes.** Classification-by-profile and package-selection-by-profile are engine concerns. |
| Other industries without modification? | As written, **no** — keywords and package picks were to be wired into `classify.ts` and two loops with dental conditionals. |
| Config over code? | **Yes.** Keywords, pain signals, focus areas, and package definitions are pure data. |

**Revision:** split into **Packet 00** (Vertical Profile Engine: types,
registry, resolution, generic wiring into the four loops) and a slimmer
**Packet 01** (the dental profile: pure data + catalog entries).

### Packet 02 — Dental onboarding

| Question | Answer |
|---|---|
| Platform engine? | **Yes** — "prepend profile onboarding tasks during task generation" is generic. |
| Other industries without modification? | As written **no** (a `pkg_dental_practice` conditional in `taskGeneration.ts`). |
| Config over code? | **Yes.** The 8 onboarding tasks are a data array. |

**Revision:** the task-generation hook moves into Packet 00 (engine reads
`profile.onboardingTasks`). Packet 02 shrinks to the dental onboarding data
inside the dental profile, plus form placeholder copy.

### Packet 03 — Dental website template

| Question | Answer |
|---|---|
| Platform engine? | **Partially.** The shell — config loader, page scaffolding, lead-capture form with data-minimization enforcement, SEO/JSON-LD machinery — is reusable. Page copy, page set, and schema type are genuinely vertical. |
| Other industries without modification? | The shell, yes. The content, no — and shouldn't be forced to be. |
| Config over code? | Already config-first (`site.config.ts`); revision pushes the split further: base + content pack. |

**Revision:** `templates/vertical-site/` = reusable base (components,
form + storage adapter, SEO engine) + `packs/dental/` content pack (pages,
copy defaults, `Dentist` JSON-LD type, service-line seeds). A second
vertical is a new pack. **Caution honored:** we do not build speculative
packs; dental is the only pack until a second vertical is real.

### Packet 04 — Dental automation

| Question | Answer |
|---|---|
| Platform engine? | **Yes — the clearest case of the five.** Timed sequences, channel adapters, opt-out handling, SLA follow-up tasks are industry-agnostic. |
| Other industries without modification? | Reminder/recall/review-request sequences translate to any appointment business by swapping message templates and offsets. |
| Config over code? | **Yes.** Sequences = data (offsets, channels, templates). Only the engine is code. |

**Revision:** **Sequence Engine** (generic: `SequenceSpec`,
`ChannelAdapter`, scheduler semantics, `doNotContact`, type-level
no-health-fields enforcement) + dental sequence pack (four sequence specs
as data in the dental profile). Engine work goes to Packet 04a, dental
specs to 04b (one packet, two deliverables — engine is written once).

### Packet 05 — Dental proposal framing

| Question | Answer |
|---|---|
| Platform engine? | **Yes.** "Merge profile framing sections into scope_json + render known section shapes" is generic. |
| Other industries without modification? | As written **no** (`pkg_dental_practice` conditional + dental helper). |
| Config over code? | Mostly. Positioning/nextStep need light templating over captured pain points — that templating function lives in the profile, the merge/render engine stays generic. |

**Revision:** **Proposal Framing Engine** (generic section merge in the
loop + generic section renderer on Proposal Detail) + dental framing
functions/data in the dental profile.

## Revised packet map

| Packet | Type | Content |
|--------|------|---------|
| **00** (new) | Engine | Vertical Profile Engine: types, registry, wiring into classification, offer match/package recommendation, task generation, proposal generation |
| **01** (revised) | Profile data | Dental profile v1: keywords, pain signals, focus areas, packages |
| **02** (revised) | Profile data | Dental onboarding tasks + intake placeholder copy |
| **03** (revised) | Engine + pack | Vertical site template base + dental content pack |
| **04** (revised) | Engine + pack | Sequence Engine + dental sequence specs |
| **05** (revised) | Engine + pack | Proposal Framing Engine + dental framing pack |

Execution order: 00 → 01 → (02, 03, 04, 05 in parallel).

## Guardrails imposed on Sonnet (apply to every packet)

1. **No industry names inside engines.** Grep-enforced: `dental|Dental`
   must not appear under `src/lib/loops/`, `src/lib/classify.ts`, or any
   engine module — only under `src/lib/verticals/` and template packs.
2. **One real profile only.** The framework is validated by dental plus a
   minimal synthetic fixture profile used in verification scripts — no
   speculative second industry.
3. **Generic behavior is frozen.** Leads/clients with no matching profile
   must produce byte-identical outputs to today. Every packet carries this
   regression criterion.
4. **The profile is versioned data.** Profiles carry a `version` field so
   the Overseer can later correlate outcomes (win rate, delivery time) with
   profile revisions.
