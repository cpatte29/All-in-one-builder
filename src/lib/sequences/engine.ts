import type { ChannelAdapter, MessageTemplate, SequenceSpec, SequenceStep, SequenceTriggerInput } from "./types";
import { ALLOWED_PLACEHOLDERS } from "./types";

const PLACEHOLDER_PATTERN = /\{(\w+)\}/g;
const ALLOWED_SET = new Set<string>(ALLOWED_PLACEHOLDERS);

/**
 * Runtime half of data minimization: a template's placeholders must all be
 * in the closed set, whatever the profile author typed. Throws — sequences
 * fail loudly at build/verification time, not silently in production.
 */
export function validateTemplate(template: MessageTemplate): void {
  const text = `${template.subject ?? ""} ${template.body}`;
  for (const match of text.matchAll(PLACEHOLDER_PATTERN)) {
    if (!ALLOWED_SET.has(match[1])) {
      throw new Error(
        `Template uses disallowed placeholder "{${match[1]}}". Allowed: ${ALLOWED_PLACEHOLDERS.join(", ")}.`
      );
    }
  }
}

function offsetMs(step: SequenceStep): number {
  const unitMs = step.offset.unit === "minutes" ? 60_000 : step.offset.unit === "hours" ? 3_600_000 : 86_400_000;
  return step.offset.value * unitMs;
}

function triggerTimestamp(input: SequenceTriggerInput): string {
  switch (input.kind) {
    case "lead_captured":
      return input.capturedAt;
    case "appointment_scheduled":
      return input.appointmentAt;
    case "lapsed_customer":
      return input.lastVisitAt;
    case "visit_completed":
      return input.visitAt;
  }
}

function renderTemplate(template: MessageTemplate, values: Record<string, string>): {
  subject?: string;
  body: string;
} {
  const fill = (s: string) => s.replace(PLACEHOLDER_PATTERN, (_match, key: string) => values[key] ?? "");
  return { subject: template.subject ? fill(template.subject) : undefined, body: fill(template.body) };
}

export interface PlannedStep {
  sendAt: string;
  channel: string;
  audience: string;
  subject?: string;
  body: string;
}

export interface SequenceRunResult {
  skipped: boolean;
  reason?: string;
  steps: PlannedStep[];
  /** Set when this is a lead_captured sequence with an SLA and the lead isn't yet confirmed. */
  slaFollowUpDueAt?: string;
}

/**
 * Resolves a spec against a trigger record: computes each step's send
 * time, renders its template, and dispatches through the given adapter.
 * Not a loop (Platform Constitution, Article II applies to
 * executeLoop/executeSalesLoop call sites, not this) — it has no side
 * effects of its own beyond the adapter call; see persist.ts for the one
 * DB write a caller may choose to make from the result.
 */
export function runSequence(
  spec: SequenceSpec,
  input: SequenceTriggerInput,
  adapter: ChannelAdapter
): SequenceRunResult {
  if (input.doNotContact) {
    return { skipped: true, reason: "doNotContact", steps: [] };
  }

  for (const step of spec.steps) validateTemplate(step.template);

  const triggerAt = new Date(triggerTimestamp(input)).getTime();
  const values: Record<string, string> = {
    firstName: input.firstName,
    businessName: input.businessName,
    phone: input.businessContact ?? "",
    link: input.link ?? "",
    dateTime: input.kind === "appointment_scheduled" ? new Date(input.appointmentAt).toLocaleString() : "",
  };

  const steps: PlannedStep[] = spec.steps.map((step) => {
    const sendAt = new Date(triggerAt + offsetMs(step)).toISOString();
    const rendered = renderTemplate(step.template, values);
    const to = step.audience === "business" ? input.businessContact ?? input.contact : input.contact;
    adapter.send({ channel: step.channel, to, subject: rendered.subject, body: rendered.body });
    return { sendAt, channel: step.channel, audience: step.audience, subject: rendered.subject, body: rendered.body };
  });

  let slaFollowUpDueAt: string | undefined;
  if (input.kind === "lead_captured" && spec.slaHours != null && !input.confirmed) {
    slaFollowUpDueAt = new Date(triggerAt + spec.slaHours * 3_600_000).toISOString();
  }

  return { skipped: false, steps, slaFollowUpDueAt };
}
