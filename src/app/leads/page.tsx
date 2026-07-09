import Link from "next/link";
import Topbar from "@/components/Topbar";
import StatusBadge from "@/components/StatusBadge";
import { db } from "@/lib/db";
import type { Lead } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function LeadsPage() {
  const leads = db.prepare("SELECT * FROM leads ORDER BY created_at DESC").all() as Lead[];

  return (
    <div>
      <Topbar title="Leads" subtitle={`${leads.length} lead${leads.length === 1 ? "" : "s"} in the pipeline.`} />
      <div className="p-8">
        <div className="mb-4 flex justify-end">
          <Link href="/leads/new" className="btn-primary">
            + New Lead
          </Link>
        </div>
        <div className="card overflow-hidden !p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-700 text-left text-xs uppercase tracking-wide text-ink-400">
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Urgency</th>
                <th className="px-4 py-3">Close %</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-b border-ink-800 last:border-0 hover:bg-ink-800/50">
                  <td className="px-4 py-3">
                    <Link href={`/leads/${l.id}`} className="font-medium text-ink-100 hover:text-brand-300">
                      {l.business_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-300">{l.contact_name}</td>
                  <td className="px-4 py-3 text-ink-400">{l.source.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-ink-400">{l.urgency}</td>
                  <td className="px-4 py-3">
                    {l.close_probability != null ? (
                      <span className={l.close_probability >= 70 ? "font-semibold text-emerald-300" : "text-ink-300"}>
                        {l.close_probability}
                        {l.close_probability >= 70 ? " 🔥" : ""}
                      </span>
                    ) : (
                      <span className="text-ink-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={l.status} />
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-500">
                    No leads yet. Start with New Lead.
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
