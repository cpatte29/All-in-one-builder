import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Project, Task, Client } from "@/lib/types";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(params.id) as Project | undefined;
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const client = db.prepare("SELECT * FROM clients WHERE id = ?").get(project.client_id) as Client;
  const tasks = db
    .prepare("SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at ASC")
    .all(params.id) as Task[];

  return NextResponse.json({ project, client, tasks });
}
