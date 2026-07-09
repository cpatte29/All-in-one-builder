import Link from "next/link";
import { notFound } from "next/navigation";
import Topbar from "@/components/Topbar";
import StatusBadge from "@/components/StatusBadge";
import LoopActionButton from "@/components/LoopActionButton";
import { db } from "@/lib/db";
import type { Client, Project, Note, ActivityLogEntry, LoopRun, Package } from "@/lib/types";
import { loopLabel } from "@/lib/loops";

export const dynamic = "force-dynamic";

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const client = db.prepare("SELECT * FROM clients WHERE id = ?").get(params.id) as Client | undefined;
  if (!client) notFound();

  const projects = db
    .prepare("SELECT * FROM projects WHERE client_id = ? ORDER BY created_at DESC")
    .all(params.id) as Project[];
  const notes = db
    .prepare("SELECT * FROM notes WHERE client_id = ? ORDER BY created_at DESC")
    .all(params.id) as Note[];
  const loops = db
    .prepare("SELECT * FROM loops WHERE client_id = ? ORDER BY created_at DESC")
    .all(params.id) as LoopRun[];
  const pkg = client.recommended_package_id
    ? (db.prepare("SELECT * FROM packages WHERE id = ?").get(client.recommended_package_id) as Package)
    : undefined;

  const diagnosis = client.diagnosis_json ? JSON.parse(client.diagnosis_json) : null;

  const projectIds = projects.map((p) => p.id);
  const activity =
    projectIds.length > 0
      ? (db
          .prepare(
            `SELECT * FROM activity_log WHERE entity_id IN (?, ${projectIds.map(() => "?").join(",")}) ORDER BY created_at DESC LIMIT 30`
          )
          .all(params.id, ...projectIds) as ActivityLogEntry[])
      : (db
          .prepare(`SELECT * FROM activity_log WHERE entity_id = ? ORDER BY created_at DESC LIMIT 30`)
          .all(params.id) as ActivityLogEntry[]);

  return (
    <div>
      <Topbar title={client.business_name} subtitle={client.contact_name} />
      <div className="space-y-6 p-8">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={client.status} />
          <span className="text-sm text-ink-400">{client.email}</span>
          {client.website && (
            <a href={client.website} target="_blank" className="text-sm text-brand-300 hover:underline">
              {client.website}
            </a>
          )}
        </div>

        {/* Loop pipeline controls */}
        <div className="card">
          <h2 className="mb-4 text-sm font-semibold text-ink-100">Client Loop Pipeline</h2>
          <div className="flex flex-wrap gap-3">
            <LoopActionButton
              endpoint={`/api/clients/${client.id}/diagnose`}
              label="Run Business Diagnosis Loop"
            />
            <LoopActionButton
              endpoint={`/api/clients/${client.id}/recommend`}
              label="Run Package Recommendation Loop"
              variant="secondary"
            />
            <LoopActionButton
              endpoint={`/api/clients/${client.id}/scope`}
              label="Run Project Scope Loop"
              variant="secondary"
            />
          </div>
          <p className="mt-3 text-xs text-ink-500">
            Run in order: Diagnosis → Package Recommendation → Project Scope. Each step requires the
            previous one to have completed.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card">
            <h2 className="mb-3 text-sm font-semibold text-ink-100">Business Diagnosis</h2>
            {diagnosis ? (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-ink-400">Industry:</span>{" "}
                  <span className="text-ink-100">{diagnosis.industry}</span>
                </div>
                <div>
                  <span className="text-ink-400">Opportunity score:</span>{" "}
                  <span className="text-ink-100">{diagnosis.opportunityScore}/100</span>
                </div>
                <div>
                  <span className="text-ink-400">Pain points:</span>
                  <ul className="ml-4 mt-1 list-disc text-ink-200">
                    {diagnosis.painPoints.map((p: string) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-sm text-ink-500">Not yet diagnosed.</p>
            )}
          </div>

          <div className="card">
            <h2 className="mb-3 text-sm font-semibold text-ink-100">Recommended Package</h2>
            {pkg ? (
              <div className="space-y-1 text-sm">
                <div className="font-medium text-ink-100">{pkg.name}</div>
                <div className="text-ink-400">
                  {pkg.tier} · {pkg.price_range} · {pkg.timeline_weeks} weeks
                </div>
                <p className="mt-2 text-ink-300">{pkg.description}</p>
              </div>
            ) : (
              <p className="text-sm text-ink-500">No package recommended yet.</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-100">Projects</h2>
          </div>
          <div className="space-y-2">
            {projects.length === 0 && <p className="text-sm text-ink-500">No projects yet — run the Project Scope Loop.</p>}
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="flex items-center justify-between rounded-lg border border-ink-700 px-3 py-2 hover:border-ink-500"
              >
                <div>
                  <div className="text-sm font-medium text-ink-100">{p.name}</div>
                  <div className="text-xs text-ink-500">
                    {p.price_quote} · {p.timeline_weeks} weeks
                  </div>
                </div>
                <StatusBadge status={p.status} />
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card">
            <h2 className="mb-3 text-sm font-semibold text-ink-100">Notes</h2>
            <div className="space-y-3">
              {notes.length === 0 && <p className="text-sm text-ink-500">No notes yet.</p>}
              {notes.map((n) => (
                <div key={n.id} className="border-l-2 border-ink-600 pl-3 text-sm">
                  <div className="text-ink-200">{n.body}</div>
                  <div className="text-xs text-ink-500">
                    {n.author} · {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="mb-3 text-sm font-semibold text-ink-100">Activity Log</h2>
            <div className="space-y-3">
              {activity.length === 0 && <p className="text-sm text-ink-500">No activity yet.</p>}
              {activity.map((a) => (
                <div key={a.id} className="border-l-2 border-brand-500/50 pl-3 text-sm">
                  <div className="text-ink-200">{a.message}</div>
                  <div className="text-xs text-ink-500">{new Date(a.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="mb-3 text-sm font-semibold text-ink-100">Loop Run History</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-700 text-left text-xs uppercase tracking-wide text-ink-400">
                <th className="py-2">Loop</th>
                <th className="py-2">Status</th>
                <th className="py-2">Ran</th>
              </tr>
            </thead>
            <tbody>
              {loops.map((l) => (
                <tr key={l.id} className="border-b border-ink-800 last:border-0">
                  <td className="py-2 text-ink-200">{loopLabel(l.loop_type)}</td>
                  <td className="py-2">
                    <StatusBadge status={l.status} />
                  </td>
                  <td className="py-2 text-ink-500">{new Date(l.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {loops.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-ink-500">
                    No loops run yet.
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
