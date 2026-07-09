import { db, newId, nowIso } from "@/lib/db";
import { logActivity, logSalesActivity } from "./engine";
import { getLead } from "./leadCapture";

export interface ConvertLeadOutput {
  clientId: string;
}

/**
 * Not one of the 6 named sales loops — a lead becoming a client is a status
 * transition, not a generative step. Creates the client record from the
 * lead's captured data, links lead.client_id, and marks the lead won.
 */
export function convertLeadToClient(leadId: string): ConvertLeadOutput {
  const lead = getLead(leadId);
  if (!lead) throw new Error(`Lead ${leadId} not found`);
  if (lead.client_id) return { clientId: lead.client_id };
  if (!lead.email) throw new Error("Lead must have an email on file before converting to a client");

  const clientId = newId("client");
  db.prepare(
    `INSERT INTO clients
      (id, business_name, contact_name, email, phone, business_type, goals, pain_points,
       budget_range, source, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'profiled', ?, ?)`
  ).run(
    clientId,
    lead.business_name,
    lead.contact_name,
    lead.email,
    lead.phone,
    lead.business_type,
    lead.requested_service,
    lead.pain_points,
    lead.budget_range,
    `sales:${lead.source}`,
    nowIso(),
    nowIso()
  );

  db.prepare(`UPDATE leads SET client_id = ?, status = 'won', updated_at = ? WHERE id = ?`).run(
    clientId,
    nowIso(),
    leadId
  );

  logSalesActivity("lead", leadId, "converted", `Lead "${lead.business_name}" won and converted to a client.`);
  logActivity("client", clientId, "created_from_lead", `Client created from won lead "${lead.business_name}".`);

  return { clientId };
}
