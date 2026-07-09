import Link from "next/link";
import Topbar from "@/components/Topbar";
import StatusBadge from "@/components/StatusBadge";
import { db } from "@/lib/db";
import type { Proposal } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function ProposalsPage() {
  const proposals = db
    .prepare(
      `SELECT p.*, l.business_name as lead_name
       FROM proposals p JOIN leads l ON l.id = p.lead_id
       ORDER BY p.created_at DESC`
    )
    .all() as (Proposal & { lead_name: string })[];

  return (
    <div>
      <Topbar title="Proposals" subtitle={`${proposals.length} proposal${proposals.length === 1 ? "" : "s"}.`} />
      <div className="p-8">
        <div className="card overflow-hidden !p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-700 text-left text-xs uppercase tracking-wide text-ink-400">
                <th className="px-4 py-3">Lead</th>
                <th className="px-4 py-3">Package</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Timeline</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {proposals.map((p) => (
                <tr key={p.id} className="border-b border-ink-800 last:border-0 hover:bg-ink-800/50">
                  <td className="px-4 py-3">
                    <Link href={`/proposals/${p.id}`} className="font-medium text-ink-100 hover:text-brand-300">
                      {p.lead_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-300">{p.package_name}</td>
                  <td className="px-4 py-3 text-ink-400">{p.price_range || "—"}</td>
                  <td className="px-4 py-3 text-ink-400">{p.timeline_weeks ? `${p.timeline_weeks} wks` : "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
              {proposals.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-ink-500">
                    No proposals yet — proposals are created by the Proposal Generation Loop.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
