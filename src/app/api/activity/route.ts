import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { ActivityLogEntry } from "@/lib/types";

export async function GET() {
  const activity = db
    .prepare("SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 100")
    .all() as ActivityLogEntry[];
  return NextResponse.json({ activity });
}
