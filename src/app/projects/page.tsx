import Link from "next/link";
import Topbar from "@/components/Topbar";
import StatusBadge from "@/components/StatusBadge";
import { db } from "@/lib/db";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function ProjectsPage() {
  const projects = db
    .prepare(
      `SELECT p.*, c.business_name as client_name
       FROM projects p JOIN clients c ON c.id = p.client_id
       ORDER BY p.created_at DESC`
    )
    .all() as (Project & { client_name: string })[];

  return (
    <div>
      <Topbar title="Projects" subtitle={`${projects.length} project${projects.length === 1 ? "" : "s"}.`} />
      <div className="p-8">
        <div className="card overflow-hidden !p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-700 text-left text-xs uppercase tracking-wide text-ink-400">
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Timeline</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-b border-ink-800 last:border-0 hover:bg-ink-800/50">
                  <td className="px-4 py-3">
                    <Link href={`/projects/${p.id}`} className="font-medium text-ink-100 hover:text-brand-300">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-300">{p.client_name}</td>
                  <td className="px-4 py-3 text-ink-400">{p.price_quote || "—"}</td>
                  <td className="px-4 py-3 text-ink-400">{p.timeline_weeks ? `${p.timeline_weeks} wks` : "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-ink-500">
                    No projects yet — projects are created by the Project Scope Loop.
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
