# Dental Automation Runbook

Implements Packet 04's dental sequence pack (`src/lib/verticals/dental.ts`,
`dentalSequences`), running on the generic Sequence Engine
(`src/lib/sequences/`). This is what Quality Review checks a build against.

**Data-minimization rules (apply to every sequence below, no exceptions):**
- Every template uses only the engine's closed placeholder set:
  `{firstName}`, `{businessName}`, `{phone}`, `{link}`, `{dateTime}`.
- `{phone}` is always the **practice's** contact number, never the
  patient's own — it tells the recipient how to respond, never repeats
  their own number back to them.
- No template names a procedure, diagnosis, symptom, or any other health
  detail — the closed placeholder set makes this unrepresentable, not just
  a style guideline.
- Every sequence honors `doNotContact` — the engine skips it entirely
  before any step is dispatched.

## 1. Booking Capture — `dental_booking_capture`

**Trigger:** `lead_captured` (a booking-request form submission). **SLA:** 4 hours.

| Step | Offset | Channel | Audience | Template |
|------|--------|---------|----------|----------|
| 1 | 0 min | email | business (front desk) | Subject: `New booking request — {firstName}`<br>Body: `New booking request from {firstName} for {businessName}. Please follow up.` |
| 2 | +1 min | sms | customer | `Hi {firstName}, thanks for reaching out to {businessName} — we'll call you within a few business hours to get you scheduled. Questions? Call {phone}.` |

If the lead is not marked confirmed within 4 hours, the engine returns a
`slaFollowUpDueAt` timestamp. A caller persists that via
`persistSlaFollowUp()` (`src/lib/sequences/persist.ts`), which writes to
the existing `follow_ups` table and logs to `sales_activity` — no new
table, no new activity feed.

## 2. Appointment Reminders — `dental_appointment_reminders`

**Trigger:** `appointment_scheduled`.

| Step | Offset | Channel | Template |
|------|--------|---------|----------|
| 1 | T-7 days | email | Subject: `Appointment reminder — {businessName}`<br>Body: `Hi {firstName}, this is a reminder of your upcoming appointment with {businessName} on {dateTime}. Call {phone} if you need to reschedule.` |
| 2 | T-2 days | sms | `Hi {firstName}, reminder: you have an appointment with {businessName} on {dateTime}. Reply to confirm or call {phone}.` |
| 3 | T-3 hours | sms | `Hi {firstName}, see you soon! Your {businessName} appointment is at {dateTime}. Call {phone} with questions.` |

None of the three steps name what the appointment is for — a reminder that
named a procedure would be a PHI leak the moment it appears on a lock
screen.

## 3. Recall / Reactivation — `dental_recall_reactivation`

**Trigger:** `lapsed_customer` (default: 7 months since last visit — the
caller decides when to fire this, the sequence just defines the cadence
once fired).

| Step | Offset | Channel | Template |
|------|--------|---------|----------|
| 1 | Day 0 | email | Subject: `We miss you at {businessName}`<br>Body: `Hi {firstName}, it's been a while since your last visit to {businessName}. We'd love to see you again — call {phone} to schedule.` |
| 2 | Day 14 | sms | `Hi {firstName}, just checking in — {businessName} has openings if you're due for a visit. Call {phone} anytime.` |
| 3 | Day 45 | email | Subject: `Ready when you are — {businessName}`<br>Body: `Hi {firstName}, whenever you're ready to come back to {businessName}, request an appointment here: {link}. Call {phone} with questions.` |

## 4. Review Request — `dental_review_request`

**Trigger:** `visit_completed`. Fires once per visit.

| Step | Offset | Channel | Template |
|------|--------|---------|----------|
| 1 | +2 hours | sms | `Hi {firstName}, thanks for visiting {businessName} today! If you have a moment, we'd love a review: {link}` |

## Adapter swap point

All four sequences run today through `consoleAdapter`/`fileAdapter`
(`src/lib/sequences/adapters.ts`) — logging only. Wiring a real provider is
implementing `ChannelAdapter.send()` against Twilio (SMS) and SendGrid
(email) and passing that adapter to `runSequence()` instead; no sequence
spec or engine code changes.
