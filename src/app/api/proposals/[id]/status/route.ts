import { NextRequest, NextResponse } from "next/server";
import { db, nowIso } from "@/lib/db";
import { logSalesActivity } from "@/lib/loops/engine";
import type { Proposal, ProposalStatus } from "@/lib/types";

const ALLOWED: ProposalStatus[] = ["accepted", "declined"];

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const status = body.status as ProposalStatus;
  if (!ALLOWED.includes(status)) {
    return NextResponse.json({ error: `status must be one of: ${ALLOWED.join(", ")}` }, { status: 400 });
  }

  const proposal = db.prepare("SELECT * FROM proposals WHERE id = ?").get(params.id) as Proposal | undefined;
  if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });

  db.prepare("UPDATE proposals SET status = ?, updated_at = ? WHERE id = ?").run(status, nowIso(), params.id);
  db.prepare("UPDATE leads SET status = ?, updated_at = ? WHERE id = ?").run(
    status === "accepted" ? "negotiating" : "lost",
    nowIso(),
    proposal.lead_id
  );

  logSalesActivity("proposal", params.id, "proposal_" + status, `Proposal "${proposal.package_name}" ${status}.`);

  return NextResponse.json({ status });
}
