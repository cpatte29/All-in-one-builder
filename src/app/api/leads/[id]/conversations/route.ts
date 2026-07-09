import { NextRequest, NextResponse } from "next/server";
import { db, newId, nowIso } from "@/lib/db";
import { logSalesActivity } from "@/lib/loops/engine";
import type { ConversationChannel } from "@/lib/types";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  if (!body.summary || typeof body.summary !== "string") {
    return NextResponse.json({ error: "summary is required" }, { status: 400 });
  }

  const lead = db.prepare("SELECT id, business_name FROM leads WHERE id = ?").get(params.id) as
    | { id: string; business_name: string }
    | undefined;
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const channel: ConversationChannel = body.channel ?? "other";
  const id = newId("conv");
  db.prepare(
    `INSERT INTO conversations (id, lead_id, channel, summary, occurred_at, created_at) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, params.id, channel, body.summary.trim(), nowIso(), nowIso());

  logSalesActivity("lead", params.id, "conversation_logged", `Logged a ${channel.replace(/_/g, " ")} conversation.`);

  return NextResponse.json({ conversationId: id }, { status: 201 });
}
