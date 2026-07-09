import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Package } from "@/lib/types";

export async function GET() {
  const packages = db.prepare("SELECT * FROM packages ORDER BY timeline_weeks ASC").all() as Package[];
  return NextResponse.json({ packages });
}
