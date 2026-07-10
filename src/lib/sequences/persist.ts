import { db, newId, nowIso } from "@/lib/db";
import { logSalesActivity } from "@/lib/loops/engine";

/**
 * The one DB write a caller may make from a sequence run's
 * `slaFollowUpDueAt`: an SLA follow-up task for an unconfirmed
 * lead_captured sequence. Deliberately not called from inside
 * runSequence() — the engine itself stays pure/DB-free. Uses the existing
 * follow_ups table and sales activity log; no new table, no new harness
 * (Platform Constitution, Article II — the Sequence Engine is not a loop
 * and must not invent a second write path).
 */
export function persistSlaFollowUp(leadId: string, dueAt: string, reason: string): string {
  const id = newId("fu");
  db.prepare(
    `INSERT INTO follow_ups (id, lead_id, channel, due_at, status, email_subject, email_body, created_at, updated_at)
     VALUES (?, ?, 'call', ?, 'pending', ?, ?, ?, ?)`
  ).run(id, leadId, dueAt, "SLA follow-up", reason, nowIso(), nowIso());
  logSalesActivity("lead", leadId, "sla_follow_up_created", reason);
  return id;
}
