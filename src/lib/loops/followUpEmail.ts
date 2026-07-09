import { db, newId, nowIso } from "@/lib/db";
import { executeSalesLoop, logSalesActivity } from "./engine";
import { getLead } from "./leadCapture";
import type { FollowUpChannel, LeadStatus, Proposal } from "@/lib/types";

export interface FollowUpEmailInput {
  leadId: string;
  channel?: FollowUpChannel;
}

export interface FollowUpEmailOutput {
  followUpId: string;
  dueAt: string;
  subject: string;
  body: string;
}

const URGENCY_DELAY_DAYS: Record<string, number> = { high: 1, medium: 3, low: 7 };

function draftEmail(
  businessName: string,
  contactName: string,
  status: LeadStatus,
  proposal?: Proposal
): { subject: string; body: string } {
  switch (status) {
    case "proposal_ready":
    case "proposal_sent":
      return {
        subject: `Following up on your ${businessName} proposal`,
        body: `Hi ${contactName},\n\nWanted to follow up on the proposal we put together for ${businessName}${
          proposal ? ` (${proposal.package_name}, ${proposal.price_range}, ${proposal.timeline_weeks} weeks)` : ""
        }. Happy to walk through any part of it or answer questions.\n\n${
          proposal?.next_step ?? "Let me know a good time this week to connect."
        }\n\nBest,\nFABLE 5 Team`,
      };
    case "negotiating":
      return {
        subject: `Checking in — ${businessName}`,
        body: `Hi ${contactName},\n\nChecking in on where things stand with the proposal for ${businessName}. If there's anything we can adjust on scope, price, or timeline to make this an easy yes, I'd love to hear it.\n\nBest,\nFABLE 5 Team`,
      };
    case "diagnosed":
    case "matched":
      return {
        subject: `Next steps for ${businessName}`,
        body: `Hi ${contactName},\n\nGreat talking with you about ${businessName}. Based on what you shared, we think we can help — I'll have a proposal over shortly. In the meantime, let me know if anything changes on your end.\n\nBest,\nFABLE 5 Team`,
      };
    default:
      return {
        subject: `Great connecting, ${contactName}`,
        body: `Hi ${contactName},\n\nThanks for taking the time to talk about ${businessName}. I'd love to learn a bit more about what's slowing you down right now so we can put together the right plan.\n\nBest,\nFABLE 5 Team`,
      };
  }
}

/**
 * Loop 5 (Sales): Follow-Up Email Loop.
 * Generates a ready-to-send follow-up email based on the lead's current
 * status and schedules it as a due follow-up — the CEO copies it out (or
 * a future integration sends it), this system doesn't send email itself.
 */
export function runFollowUpEmailLoop(input: FollowUpEmailInput) {
  return executeSalesLoop<FollowUpEmailInput, FollowUpEmailOutput>(
    {
      type: "follow_up_email",
      run: ({ leadId, channel }) => {
        const lead = getLead(leadId);
        if (!lead) throw new Error(`Lead ${leadId} not found`);

        const proposal = db
          .prepare("SELECT * FROM proposals WHERE lead_id = ? ORDER BY created_at DESC LIMIT 1")
          .get(leadId) as Proposal | undefined;

        const { subject, body } = draftEmail(lead.business_name, lead.contact_name, lead.status, proposal);
        const delayDays = URGENCY_DELAY_DAYS[lead.urgency] ?? 3;
        const dueAt = new Date(Date.now() + delayDays * 24 * 60 * 60 * 1000).toISOString();

        const followUpId = newId("fu");
        db.prepare(
          `INSERT INTO follow_ups (id, lead_id, proposal_id, channel, due_at, status, email_subject, email_body, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`
        ).run(
          followUpId,
          leadId,
          proposal?.id ?? null,
          channel ?? "email",
          dueAt,
          subject,
          body,
          nowIso(),
          nowIso()
        );

        logSalesActivity("lead", leadId, "follow_up_drafted", `Follow-up email drafted, due ${new Date(dueAt).toLocaleDateString()}.`);

        return { output: { followUpId, dueAt, subject, body }, context: { leadId, proposalId: proposal?.id } };
      },
    },
    input
  );
}
