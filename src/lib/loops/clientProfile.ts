import { db, newId, nowIso } from "@/lib/db";
import { executeLoop, logActivity } from "./engine";
import type { Client } from "@/lib/types";

export interface ClientProfileInput {
  businessName: string;
  contactName: string;
  email: string;
  phone?: string;
  website?: string;
  businessType?: string;
  teamSize?: string;
  goals?: string;
  painPoints?: string;
  budgetRange?: string;
  source?: string;
}

export interface ClientProfileOutput {
  clientId: string;
  normalizedProfile: {
    businessName: string;
    contactName: string;
    email: string;
    hasWebsite: boolean;
  };
}

/** Loop 1: Client Profile Loop — intake fields -> normalized client row. */
export function runClientProfileLoop(input: ClientProfileInput) {
  return executeLoop<ClientProfileInput, ClientProfileOutput>(
    {
      type: "client_profile",
      run: (raw) => {
        const clientId = newId("client");
        const businessName = raw.businessName.trim();
        const contactName = raw.contactName.trim();
        const email = raw.email.trim().toLowerCase();
        const website = raw.website?.trim() || null;

        db.prepare(
          `INSERT INTO clients
            (id, business_name, contact_name, email, phone, website, business_type,
             goals, pain_points, budget_range, source, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'profiled', ?, ?)`
        ).run(
          clientId,
          businessName,
          contactName,
          email,
          raw.phone?.trim() || null,
          website,
          raw.businessType?.trim() || null,
          raw.goals?.trim() || null,
          raw.painPoints?.trim() || null,
          raw.budgetRange?.trim() || null,
          raw.source?.trim() || "intake_form",
          nowIso(),
          nowIso()
        );

        logActivity("client", clientId, "client_created", `Client "${businessName}" created via intake and profiled.`);

        return {
          output: {
            clientId,
            normalizedProfile: { businessName, contactName, email, hasWebsite: !!website },
          },
          context: { clientId },
        };
      },
    },
    input
  );
}

export function getClient(clientId: string): Client | undefined {
  return db.prepare("SELECT * FROM clients WHERE id = ?").get(clientId) as Client | undefined;
}
