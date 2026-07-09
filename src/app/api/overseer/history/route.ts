import { NextResponse } from "next/server";
import { listSnapshotHistory } from "@/lib/overseer/persist";

export async function GET() {
  return NextResponse.json({ history: listSnapshotHistory() });
}
