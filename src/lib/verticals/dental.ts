import { registerProfile } from "./registry";
import type { VerticalProfile } from "./types";
import type { SequenceSpec } from "@/lib/sequences/types";

// Four sequences an appointment-driven business needs — the Sequence
// Engine (src/lib/sequences/) is industry-free; this is the dental
// vocabulary and timing layered on top of it. Every body/subject string
// uses only the engine's closed placeholder set: {firstName},
// {businessName}, {phone}, {link}, {dateTime}.
const dentalSequences: SequenceSpec[] = [
  {
    id: "dental_booking_capture",
    trigger: "lead_captured",
    slaHours: 4,
    steps: [
      {
        offset: { unit: "minutes", value: 0 },
        channel: "email",
        audience: "business",
        template: {
          subject: "New booking request — {firstName}",
          body: "New booking request from {firstName} for {businessName}. Please follow up.",
        },
      },
      {
        offset: { unit: "minutes", value: 1 },
        channel: "sms",
        audience: "customer",
        template: {
          body: "Hi {firstName}, thanks for reaching out to {businessName} — we'll call you within a few business hours to get you scheduled. Questions? Call {phone}.",
        },
      },
    ],
  },
  {
    id: "dental_appointment_reminders",
    trigger: "appointment_scheduled",
    steps: [
      {
        offset: { unit: "days", value: -7 },
        channel: "email",
        audience: "customer",
        template: {
          subject: "Appointment reminder — {businessName}",
          body: "Hi {firstName}, this is a reminder of your upcoming appointment with {businessName} on {dateTime}. Call {phone} if you need to reschedule.",
        },
      },
      {
        offset: { unit: "days", value: -2 },
        channel: "sms",
        audience: "customer",
        template: {
          body: "Hi {firstName}, reminder: you have an appointment with {businessName} on {dateTime}. Reply to confirm or call {phone}.",
        },
      },
      {
        offset: { unit: "hours", value: -3 },
        channel: "sms",
        audience: "customer",
        template: {
          body: "Hi {firstName}, see you soon! Your {businessName} appointment is at {dateTime}. Call {phone} with questions.",
        },
      },
    ],
  },
  {
    id: "dental_recall_reactivation",
    trigger: "lapsed_customer",
    steps: [
      {
        offset: { unit: "days", value: 0 },
        channel: "email",
        audience: "customer",
        template: {
          subject: "We miss you at {businessName}",
          body: "Hi {firstName}, it's been a while since your last visit to {businessName}. We'd love to see you again — call {phone} to schedule.",
        },
      },
      {
        offset: { unit: "days", value: 14 },
        channel: "sms",
        audience: "customer",
        template: {
          body: "Hi {firstName}, just checking in — {businessName} has openings if you're due for a visit. Call {phone} anytime.",
        },
      },
      {
        offset: { unit: "days", value: 45 },
        channel: "email",
        audience: "customer",
        template: {
          subject: "Ready when you are — {businessName}",
          body: "Hi {firstName}, whenever you're ready to come back to {businessName}, request an appointment here: {link}. Call {phone} with questions.",
        },
      },
    ],
  },
  {
    id: "dental_review_request",
    trigger: "visit_completed",
    steps: [
      {
        offset: { unit: "hours", value: 2 },
        channel: "sms",
        audience: "customer",
        template: {
          body: "Hi {firstName}, thanks for visiting {businessName} today! If you have a moment, we'd love a review: {link}",
        },
      },
    ],
  },
];

/**
 * Dental Profile v1. Pure data — see Packet 00 (src/lib/verticals/{types,
 * registry}.ts) for the engine that consults this. If reading this module
 * requires editing anything under src/lib/loops/ or src/lib/classify.ts to
 * work, the engine is wrong; fix it there, not here.
 *
 * proposalFraming is intentionally left unset here — it's Packet 05's
 * dedicated deliverable, kept as its own reviewable, revertible unit of
 * change (Platform Constitution, Article XI).
 */
const dentalProfile: VerticalProfile = {
  id: "dental",
  version: 1,
  industryLabel: "Dental",
  classification: {
    keywords: [
      "dental",
      "dentist",
      "dds",
      "dmd",
      "orthodont",
      "endodont",
      "periodont",
      "oral surg",
      "implant",
      "invisalign",
      "hygien",
    ],
    painSignals: [
      { pattern: "no-show", label: "No-show and open-slot leakage", weight: 20 },
      { pattern: "no show", label: "No-show and open-slot leakage", weight: 20 },
      { pattern: "recall", label: "Recall / reactivation lapse", weight: 20 },
      { pattern: "reactivat", label: "Recall / reactivation lapse", weight: 20 },
      { pattern: "haven't been back", label: "Recall / reactivation lapse", weight: 20 },
      // Note: a standalone "ppo" pattern was dropped — it's a substring of
      // "appointments," a word dental pain text uses constantly, and
      // produced false-positive "insurance" matches on text never
      // mentioning insurance at all. "insurance" alone covers the signal.
      { pattern: "insurance", label: "Insurance confusion deflecting patients", weight: 15 },
      { pattern: "review", label: "Weak review presence", weight: 15 },
      { pattern: "front desk", label: "Front-desk overload", weight: 15 },
      { pattern: "phones", label: "Front-desk overload", weight: 15 },
    ],
    recommendedFocus: ["New-patient conversion website", "Recall + reminder automation", "Review growth"],
  },
  packages: {
    buildPackageId: "pkg_dental_practice",
    recurringPackageId: "pkg_dental_care_plan",
  },
  // Order is the checklist sequence a dental engagement always needs
  // before build starts (Packet 02).
  onboardingTasks: [
    {
      title: "Collect practice basics",
      description: "Practice name as it should appear, address, hours, phone, and emergency policy.",
      priority: "high",
    },
    {
      title: "Identify practice management system",
      description:
        "Dentrix / Eaglesoft / Open Dental / other. A PMS integration request is out of standard scope — flag for a BAA conversation.",
      priority: "high",
    },
    {
      title: "Confirm service lines to promote",
      description: "Implants, aligners, cosmetic, sedation — drives which service pages the site builds.",
      priority: "high",
    },
    {
      title: "Collect insurance + financing list",
      description: "Accepted plans, in-house membership plan, and financing partners.",
      priority: "medium",
    },
    {
      title: "Confirm booking policy",
      description: "How requests reach the front desk, response SLA, and after-hours handling.",
      priority: "high",
    },
    {
      title: "Review platform audit",
      description: "Current Google review count/rating and where review requests should point.",
      priority: "medium",
    },
    {
      title: "Photo + copy approval process",
      description: "Who approves copy; confirm before/after photo policy per state advertising rules.",
      priority: "medium",
    },
    {
      title: "Data-handling briefing",
      description:
        "Walk the client through the data-minimization posture: contact info and scheduling preference only — no health details in any FABLE-built form or message.",
      priority: "high",
    },
  ],
  sequences: dentalSequences,
};

registerProfile(dentalProfile);

export default dentalProfile;
