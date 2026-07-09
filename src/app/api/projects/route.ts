import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Project, Client } from "@/lib/types";

export async function GET() {
  const projects = db
    .prepare(
      `SELECT p.*, c.business_name as client_name
       FROM projects p JOIN clients c ON c.id = p.client_id
       ORDER BY p.created_at DESC`
    )
    .all() as (Project & { client_name: string })[];
  return NextResponse.json({ projects });
}
