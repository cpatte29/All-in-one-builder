import { NextRequest, NextResponse } from "next/server";
import { db, nowIso } from "@/lib/db";
import { logSalesActivity } from "@/lib/loops/engine";
import type { Proposal } from "@/lib/types";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const proposal = db.prepare("SELECT * FROM proposals WHERE id = ?").get(params.id) as Proposal | undefined;
  if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });

  db.prepare("UPDATE proposals SET status = 'sent', sent_at = ?, updated_at = ? WHERE id = ?").run(
    nowIso(),
    nowIso(),
    params.id
  );
  db.prepare("UPDATE leads SET status = 'proposal_sent', updated_at = ? WHERE id = ?").run(
    nowIso(),
    proposal.lead_id
  );

  logSalesActivity("proposal", params.id, "proposal_sent", `Proposal "${proposal.package_name}" sent.`);

  return NextResponse.json({ status: "sent" });
}
