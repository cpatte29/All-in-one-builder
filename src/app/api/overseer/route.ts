import { NextResponse } from "next/server";
import { computeOverseerSnapshot } from "@/lib/overseer/engine";

export async function GET() {
  return NextResponse.json(computeOverseerSnapshot());
}
