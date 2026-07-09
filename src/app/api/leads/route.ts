import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runLeadCaptureLoop } from "@/lib/loops";
import type { Lead } from "@/lib/types";

export async function GET() {
  const leads = db.prepare("SELECT * FROM leads ORDER BY created_at DESC").all() as Lead[];
  return NextResponse.json({ leads });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.businessName || !body.contactName) {
    return NextResponse.json({ error: "businessName and contactName are required" }, { status: 400 });
  }

  const { output } = runLeadCaptureLoop(body);
  return NextResponse.json({ leadId: output.leadId }, { status: 201 });
}
