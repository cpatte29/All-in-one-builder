import Link from "next/link";
import Topbar from "@/components/Topbar";
import StatusBadge from "@/components/StatusBadge";
import { db } from "@/lib/db";
import type { Client } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function ClientsPage() {
  const clients = db.prepare("SELECT * FROM clients ORDER BY created_at DESC").all() as Client[];

  return (
    <div>
      <Topbar title="Clients" subtitle={`${clients.length} client${clients.length === 1 ? "" : "s"} in the pipeline.`} />
      <div className="p-8">
        <div className="mb-4 flex justify-end">
          <Link href="/clients/new" className="btn-primary">
            + New Intake
          </Link>
        </div>
        <div className="card overflow-hidden !p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-700 text-left text-xs uppercase tracking-wide text-ink-400">
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Industry</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-ink-800 last:border-0 hover:bg-ink-800/50">
                  <td className="px-4 py-3">
                    <Link href={`/clients/${c.id}`} className="font-medium text-ink-100 hover:text-brand-300">
                      {c.business_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-300">{c.contact_name}</td>
                  <td className="px-4 py-3 text-ink-400">{c.industry || "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3 text-ink-500">{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-ink-500">
                    No clients yet.
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
