import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Task } from "@/lib/types";

export async function GET() {
  const tasks = db
    .prepare(
      `SELECT t.*, p.name as project_name, c.business_name as client_name
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       JOIN clients c ON c.id = p.client_id
       ORDER BY t.created_at DESC`
    )
    .all() as (Task & { project_name: string; client_name: string })[];
  return NextResponse.json({ tasks });
}
