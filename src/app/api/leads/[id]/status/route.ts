import { NextRequest, NextResponse } from "next/server";
import { db, nowIso } from "@/lib/db";
import { logSalesActivity } from "@/lib/loops/engine";
import type { LeadStatus } from "@/lib/types";

const ALLOWED_MANUAL: LeadStatus[] = ["negotiating", "lost"];

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const status = body.status as LeadStatus;
  if (!ALLOWED_MANUAL.includes(status)) {
    return NextResponse.json({ error: `status must be one of: ${ALLOWED_MANUAL.join(", ")}` }, { status: 400 });
  }

  const lead = db.prepare("SELECT id FROM leads WHERE id = ?").get(params.id);
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  db.prepare("UPDATE leads SET status = ?, updated_at = ? WHERE id = ?").run(status, nowIso(), params.id);
  logSalesActivity("lead", params.id, "status_changed", `Lead marked ${status}.`);

  return NextResponse.json({ status });
}
