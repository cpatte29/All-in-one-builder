import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Lead, Conversation, Proposal, FollowUp, SalesActivityEntry, LoopRun } from "@/lib/types";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(params.id) as Lead | undefined;
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const conversations = db
    .prepare("SELECT * FROM conversations WHERE lead_id = ? ORDER BY occurred_at DESC")
    .all(params.id) as Conversation[];
  const proposals = db
    .prepare("SELECT * FROM proposals WHERE lead_id = ? ORDER BY created_at DESC")
    .all(params.id) as Proposal[];
  const followUps = db
    .prepare("SELECT * FROM follow_ups WHERE lead_id = ? ORDER BY due_at ASC")
    .all(params.id) as FollowUp[];
  const activity = db
    .prepare("SELECT * FROM sales_activity WHERE entity_id IN (?, " + (proposals.map(() => "?").join(",") || "''") + ") ORDER BY created_at DESC LIMIT 50")
    .all(params.id, ...proposals.map((p) => p.id)) as SalesActivityEntry[];
  const loops = db
    .prepare("SELECT * FROM loops WHERE lead_id = ? ORDER BY created_at DESC")
    .all(params.id) as LoopRun[];

  return NextResponse.json({ lead, conversations, proposals, followUps, activity, loops });
}
