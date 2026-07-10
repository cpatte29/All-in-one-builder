import fs from "node:fs";
import path from "node:path";

export interface LeadRequest {
  name: string;
  phone: string;
  email: string;
  preferredTimes: string[];
  patientStatus: "new" | "existing";
  submittedAt: string;
}

/**
 * Storage adapter for booking-request submissions. MVP: append to a local
 * JSON-lines file. Swap point for a real deployment: implement the same
 * `save()` signature against email (e.g. Resend/SendGrid) or a webhook
 * (e.g. forward to the practice's CRM) — no caller code changes.
 */
export interface LeadStoreAdapter {
  save(lead: LeadRequest): void | Promise<void>;
}

const LEADS_FILE = path.join(process.cwd(), "leads.json");

export const localFileLeadStore: LeadStoreAdapter = {
  save(lead) {
    fs.appendFileSync(LEADS_FILE, JSON.stringify(lead) + "\n");
  },
};

export function readAllLeads(): LeadRequest[] {
  if (!fs.existsSync(LEADS_FILE)) return [];
  return fs
    .readFileSync(LEADS_FILE, "utf-8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as LeadRequest);
}
