import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Proposal } from "@/lib/types";

export async function GET() {
  const proposals = db
    .prepare(
      `SELECT p.*, l.business_name as lead_name, l.contact_name as lead_contact
       FROM proposals p JOIN leads l ON l.id = p.lead_id
       ORDER BY p.created_at DESC`
    )
    .all() as (Proposal & { lead_name: string; lead_contact: string })[];
  return NextResponse.json({ proposals });
}
