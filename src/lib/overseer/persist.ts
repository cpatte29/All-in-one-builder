import { db, newId } from "@/lib/db";
import type { OverseerSnapshot, OverseerSnapshotRow } from "./types";

/**
 * The only write the Overseer ever performs: recording its own observation
 * for history. This never touches clients/projects/tasks/leads/proposals.
 */
export function saveSnapshot(snapshot: OverseerSnapshot): string {
  const id = newId("ovsr");
  db.prepare(
    `INSERT INTO overseer_snapshots (id, health_score, headline, snapshot_json, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, snapshot.healthScore, snapshot.brief.headline, JSON.stringify(snapshot), snapshot.generatedAt);
  return id;
}

export function listSnapshotHistory(limit = 20): OverseerSnapshotRow[] {
  return db
    .prepare("SELECT * FROM overseer_snapshots ORDER BY created_at DESC LIMIT ?")
    .all(limit) as OverseerSnapshotRow[];
}
