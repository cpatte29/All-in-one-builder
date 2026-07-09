import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Client, Project, Note, ActivityLogEntry, LoopRun } from "@/lib/types";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const client = db.prepare("SELECT * FROM clients WHERE id = ?").get(params.id) as Client | undefined;
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const projects = db
    .prepare("SELECT * FROM projects WHERE client_id = ? ORDER BY created_at DESC")
    .all(params.id) as Project[];
  const notes = db
    .prepare("SELECT * FROM notes WHERE client_id = ? ORDER BY created_at DESC")
    .all(params.id) as Note[];
  const activity = db
    .prepare("SELECT * FROM activity_log WHERE entity_id IN (?, " + (projects.map(() => "?").join(",") || "''") + ") ORDER BY created_at DESC LIMIT 50")
    .all(params.id, ...projects.map((p) => p.id)) as ActivityLogEntry[];
  const loops = db
    .prepare("SELECT * FROM loops WHERE client_id = ? ORDER BY created_at DESC")
    .all(params.id) as LoopRun[];

  return NextResponse.json({ client, projects, notes, activity, loops });
}
