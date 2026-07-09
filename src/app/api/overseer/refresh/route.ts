import { NextResponse } from "next/server";
import { computeOverseerSnapshot } from "@/lib/overseer/engine";
import { saveSnapshot } from "@/lib/overseer/persist";

/**
 * Records the current assessment to history. This does not run any loop and
 * does not touch business data — it only logs the Overseer's own reading.
 */
export async function POST() {
  const snapshot = computeOverseerSnapshot();
  const id = saveSnapshot(snapshot);
  return NextResponse.json({ id, healthScore: snapshot.healthScore }, { status: 201 });
}
