import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { LoopRun } from "@/lib/types";

export async function GET() {
  const loops = db.prepare("SELECT * FROM loops ORDER BY created_at DESC LIMIT 200").all() as LoopRun[];
  return NextResponse.json({ loops });
}
