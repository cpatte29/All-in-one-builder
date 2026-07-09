import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Proposal, Lead } from "@/lib/types";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const proposal = db.prepare("SELECT * FROM proposals WHERE id = ?").get(params.id) as Proposal | undefined;
  if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });

  const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(proposal.lead_id) as Lead;
  return NextResponse.json({ proposal, lead });
}
