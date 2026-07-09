import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runClientProfileLoop } from "@/lib/loops";
import type { Client } from "@/lib/types";

export async function GET() {
  const clients = db.prepare("SELECT * FROM clients ORDER BY created_at DESC").all() as Client[];
  return NextResponse.json({ clients });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.businessName || !body.contactName || !body.email) {
    return NextResponse.json(
      { error: "businessName, contactName, and email are required" },
      { status: 400 }
    );
  }

  const { output } = runClientProfileLoop(body);
  return NextResponse.json({ clientId: output.clientId }, { status: 201 });
}
