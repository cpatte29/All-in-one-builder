// Sequence Engine — the contract. Any appointment-driven business needs the
// same machinery (notify on lead capture, remind before appointments,
// reactivate lapsed customers, request reviews); only templates, offsets,
// and vocabulary differ, and those live in a vertical profile's `sequences`
// data, never here (Platform Constitution, Article IV — Engine Purity).

export type SequenceTrigger = "lead_captured" | "appointment_scheduled" | "lapsed_customer" | "visit_completed";
export type SequenceChannel = "email" | "sms";
export type SequenceAudience = "customer" | "business";

/**
 * Closed placeholder set. Deliberately does not include anything for a
 * procedure, diagnosis, or free-text note — a template cannot represent
 * health information even if someone tried to write one that did.
 */
export const ALLOWED_PLACEHOLDERS = ["firstName", "businessName", "phone", "link", "dateTime"] as const;
export type MessagePlaceholder = (typeof ALLOWED_PLACEHOLDERS)[number];

export interface MessageTemplate {
  subject?: string;
  body: string;
}

export interface SequenceStep {
  /** Relative to the trigger event. Negative values fire before it (e.g. an appointment reminder). */
  offset: { unit: "minutes" | "hours" | "days"; value: number };
  channel: SequenceChannel;
  audience: SequenceAudience;
  template: MessageTemplate;
}

export interface SequenceSpec {
  id: string;
  trigger: SequenceTrigger;
  steps: SequenceStep[];
  /** lead_captured sequences only: emit an SLA follow-up if not confirmed within this many hours. */
  slaHours?: number;
}

/**
 * Trigger input records. Each is a closed, typed shape — no free-text or
 * procedure/health field can be added to it (TypeScript's excess-property
 * check rejects it on a literal; see __typetests__/negative.ts). This is
 * the type-level half of data minimization; validateTemplate() below is
 * the runtime half, guarding the message text itself.
 */
interface BaseTriggerInput {
  firstName: string;
  /** Phone or email the customer-audience steps are sent to. */
  contact: string;
  businessName: string;
  /** The business's own contact info, used to fill {phone} so recipients know how to respond — never the reverse. */
  businessContact?: string;
  /** URL relevant to this message (a booking-request link, a review link, ...). */
  link?: string;
  doNotContact?: boolean;
}

export interface LeadCapturedInput extends BaseTriggerInput {
  kind: "lead_captured";
  capturedAt: string;
  confirmed?: boolean;
}

export interface AppointmentScheduledInput extends BaseTriggerInput {
  kind: "appointment_scheduled";
  appointmentAt: string;
}

export interface LapsedCustomerInput extends BaseTriggerInput {
  kind: "lapsed_customer";
  lastVisitAt: string;
}

export interface VisitCompletedInput extends BaseTriggerInput {
  kind: "visit_completed";
  visitAt: string;
}

export type SequenceTriggerInput =
  | LeadCapturedInput
  | AppointmentScheduledInput
  | LapsedCustomerInput
  | VisitCompletedInput;

export interface ChannelAdapter {
  send(message: { channel: SequenceChannel; to: string; subject?: string; body: string }): void;
}
