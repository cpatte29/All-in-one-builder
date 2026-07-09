import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { FollowUp } from "@/lib/types";

export async function GET() {
  const followUps = db
    .prepare(
      `SELECT f.*, l.business_name as lead_name, l.contact_name as lead_contact
       FROM follow_ups f JOIN leads l ON l.id = f.lead_id
       ORDER BY f.due_at ASC`
    )
    .all() as (FollowUp & { lead_name: string; lead_contact: string })[];
  return NextResponse.json({ followUps });
}
