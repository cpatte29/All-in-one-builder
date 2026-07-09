# 01 — What Atlas Must Learn

Gap assessment: current platform capability vs. what serving dentists
repeatably requires. "Learn" here means encoded knowledge in the loop
system — not prose in a wiki. Each gap maps to an implementation packet.

## Gap 1 — Classification treats dentists as generic "Health & Wellness"

`src/lib/classify.ts` currently buckets "dental" under Health & Wellness
alongside spas and gyms. The Business Diagnosis and Business Pain loops
therefore produce generic pain points and focus areas for a dentist.

**Atlas must learn:** a distinct `Dental` industry with its own keyword set
(practice, DDS, implant, ortho, hygiene, recall, PPO, fee-for-service...),
dental-specific pain-point detection (no-shows, recall lapse, insurance
questions, review gap, new-patient flow), and dental-specific recommended
focus areas.
→ **Packet 01**

## Gap 2 — No dental package in the catalog

`src/lib/packages.ts` has four generic tiers. The Offer Match and Package
Recommendation loops can only recommend generic packages, which undercuts
the "repeatable proposal" success criterion.

**Atlas must learn:** a `Dental Practice Package` (build) and a
`Dental Care Plan` (recurring) with fixed deliverables, price ranges, and
timelines, plus offer-match logic that prefers the dental package when the
industry is Dental.
→ **Packet 01**

## Gap 3 — Onboarding is generic; dental onboarding has known unknowns

The Task Generation Loop derives tasks from package deliverables generically.
A dental engagement always needs the same intake facts: practice management
system, booking policy, insurance list, service lines to promote, review
platform status, before/after photo policy, who approves copy.

**Atlas must learn:** a dental onboarding checklist (as seedable task
templates keyed to the dental package) and a dental intake preset for the
New Client Intake / Field Mode forms so the CEO captures the right facts on
day one.
→ **Packet 02**

## Gap 4 — No website template exists (for any vertical)

Success criteria require a website template. Nothing in the repo ships
client-facing site code today.

**Atlas must learn:** a `templates/dental-site/` reference implementation —
the standard dental practice site (home, services, new patients, insurance
& financing, about, contact/booking-request) with conversion-focused
components and conservative default copy, cloneable per client.
→ **Packet 03**

## Gap 5 — "Automation package" is a deliverable string, not a spec

Deliverables like "CRM + lead intake automation" have no concrete definition,
so every build re-decides what automation means.

**Atlas must learn:** the standard dental automation stack as structured
specs the Claude Build Loop can hand to a developer: (a) booking-request
capture → notification → auto-acknowledgment, (b) appointment reminder
sequence, (c) recall/reactivation sequence, (d) post-visit review request.
Each with explicit data-minimization rules (Gap 7).
→ **Packet 04**

## Gap 6 — Proposal Generation knows nothing about dentistry

Proposals currently read as generic package summaries. A dentist should see
their own vocabulary: chairs filled, recall, new-patient flow, case
acceptance.

**Atlas must learn:** dental-aware proposal generation — when the lead's
industry is Dental, the proposal pulls dental framing, the Riverside Family
Dental proof point, and the care-plan upsell into `scope_json` and
`next_step`.
→ **Packet 05**

## Gap 7 — No compliance posture encoded anywhere

HIPAA adjacency (see 00-analysis) is both a real constraint and a sales
objection. Nothing in the platform records or enforces our posture.

**Atlas must learn:** a standard, written data-handling posture: forms
collect contact info + appointment preference only, never health details;
no PHI stored in FABLE tables; PMS integrations are out of scope for the
standard package and trigger a BAA conversation. Encoded as template-form
constraints (Packet 03), automation spec constraints (Packet 04), and a
proposal FAQ block (Packet 05).

## Gap 8 — Overseer can't segment by vertical yet

The Overseer reports on the whole company. Once dental clients arrive, the
CEO needs to know whether *the vertical* is working (dental win rate, dental
revenue share, time-to-delivery vs. generic clients).

**Atlas must learn (deferred):** per-industry slicing in the Overseer
engine. Not packetized yet — it needs real dental rows in the database
before the metrics mean anything. Revisit after 3 dental clients.

## Summary table

| # | Gap | Packet | Blocking? |
|---|-----|--------|-----------|
| 1 | Generic classification | 01 | Yes — everything reads industry |
| 2 | No dental package | 01 | Yes — offer match, proposals depend on it |
| 3 | Generic onboarding | 02 | No, but required for "repeatable onboarding" |
| 4 | No website template | 03 | No, but required for "website template" |
| 5 | Automation undefined | 04 | No, but required for "automation package" |
| 6 | Generic proposals | 05 | No, but required for "proposal" |
| 7 | No compliance posture | woven into 03/04/05 | Yes for credibility |
| 8 | No vertical analytics | deferred | No |
