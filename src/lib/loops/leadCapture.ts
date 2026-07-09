import { db, newId, nowIso } from "@/lib/db";
import { executeSalesLoop, logSalesActivity } from "./engine";
import type { Lead, LeadUrgency, LeadSource } from "@/lib/types";

export interface LeadCaptureInput {
  businessName: string;
  contactName: string;
  email?: string;
  phone?: string;
  businessType?: string;
  painPoints?: string;
  requestedService?: string;
  budgetRange?: string;
  urgency?: LeadUrgency;
  source?: LeadSource;
  notes?: string;
}

export interface LeadCaptureOutput {
  leadId: string;
  normalizedLead: {
    businessName: string;
    contactName: string;
    urgency: LeadUrgency;
    source: LeadSource;
  };
}

/**
 * Loop 1 (Sales): Lead Capture Loop.
 * Turns a raw in-person conversation, email reply, referral, or cold
 * outreach note into a structured lead record — the entry point to the
 * sales pipeline, mirroring the Client Profile Loop on the ops side.
 */
export function runLeadCaptureLoop(input: LeadCaptureInput) {
  return executeSalesLoop<LeadCaptureInput, LeadCaptureOutput>(
    {
      type: "lead_capture",
      run: (raw) => {
        const leadId = newId("lead");
        const businessName = raw.businessName.trim();
        const contactName = raw.contactName.trim();
        const urgency: LeadUrgency = raw.urgency ?? "medium";
        const source: LeadSource = raw.source ?? "other";

        db.prepare(
          `INSERT INTO leads
            (id, business_name, contact_name, email, phone, business_type, pain_points,
             requested_service, budget_range, urgency, source, notes, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)`
        ).run(
          leadId,
          businessName,
          contactName,
          raw.email?.trim() || null,
          raw.phone?.trim() || null,
          raw.businessType?.trim() || null,
          raw.painPoints?.trim() || null,
          raw.requestedService?.trim() || null,
          raw.budgetRange?.trim() || null,
          urgency,
          source,
          raw.notes?.trim() || null,
          nowIso(),
          nowIso()
        );

        logSalesActivity("lead", leadId, "lead_captured", `Lead "${businessName}" captured via ${source.replace(/_/g, " ")}.`);

        return {
          output: { leadId, normalizedLead: { businessName, contactName, urgency, source } },
          context: { leadId },
        };
      },
    },
    input
  );
}

export function getLead(leadId: string): Lead | undefined {
  return db.prepare("SELECT * FROM leads WHERE id = ?").get(leadId) as Lead | undefined;
}
