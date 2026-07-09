import { NextRequest, NextResponse } from "next/server";
import { db, nowIso } from "@/lib/db";
import { logSalesActivity } from "@/lib/loops/engine";
import type { FollowUp, FollowUpStatus } from "@/lib/types";

const ALLOWED: FollowUpStatus[] = ["sent", "done", "skipped"];

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const status = body.status as FollowUpStatus;
  if (!ALLOWED.includes(status)) {
    return NextResponse.json({ error: `status must be one of: ${ALLOWED.join(", ")}` }, { status: 400 });
  }

  const followUp = db.prepare("SELECT * FROM follow_ups WHERE id = ?").get(params.id) as FollowUp | undefined;
  if (!followUp) return NextResponse.json({ error: "Follow-up not found" }, { status: 404 });

  db.prepare("UPDATE follow_ups SET status = ?, updated_at = ? WHERE id = ?").run(status, nowIso(), params.id);
  logSalesActivity("lead", followUp.lead_id, "follow_up_" + status, `Follow-up marked ${status}.`);

  return NextResponse.json({ status });
}
