import Topbar from "@/components/Topbar";
import StatusBadge from "@/components/StatusBadge";
import { db } from "@/lib/db";
import type { LoopRun, LoopType } from "@/lib/types";
import { loopLabel } from "@/lib/loops";

export const dynamic = "force-dynamic";

const LOOP_ORDER: LoopType[] = [
  "client_profile",
  "business_diagnosis",
  "package_recommendation",
  "project_scope",
  "task_generation",
  "claude_build",
  "quality_review",
  "client_update",
];

const LOOP_DESCRIPTIONS: Record<LoopType, string> = {
  client_profile: "Intake fields → normalized client record.",
  business_diagnosis: "Classifies industry/size and scores opportunity.",
  package_recommendation: "Opportunity score → recommended service package.",
  project_scope: "Package → concrete project with deliverables, timeline, price.",
  task_generation: "Scope deliverables → task cards.",
  claude_build: "Task → structured build brief for an AI developer.",
  quality_review: "Records pass/fail review, advances or reverts task status.",
  client_update: "Rolls task progress into a client-facing status note.",
};

export default function LoopsPage() {
  const loops = db.prepare("SELECT * FROM loops ORDER BY created_at DESC LIMIT 100").all() as LoopRun[];
  const counts = db
    .prepare("SELECT loop_type, COUNT(*) as n FROM loops GROUP BY loop_type")
    .all() as { loop_type: LoopType; n: number }[];
  const countMap = Object.fromEntries(counts.map((c) => [c.loop_type, c.n]));

  return (
    <div>
      <Topbar title="Loops" subtitle="The 8 build loops that move a lead from intake to delivery." />
      <div className="space-y-6 p-8">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {LOOP_ORDER.map((type, i) => (
            <div key={type} className="card flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-xs font-semibold text-brand-300">
                {i + 1}
              </div>
              <div>
                <div className="text-sm font-semibold text-ink-100">{loopLabel(type)}</div>
                <div className="text-xs text-ink-500">{LOOP_DESCRIPTIONS[type]}</div>
                <div className="mt-1 text-xs text-ink-400">Runs: {countMap[type] ?? 0}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h2 className="mb-3 text-sm font-semibold text-ink-100">Run History</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-700 text-left text-xs uppercase tracking-wide text-ink-400">
                <th className="px-2 py-2">Loop</th>
                <th className="px-2 py-2">Scope</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Ran</th>
              </tr>
            </thead>
            <tbody>
              {loops.map((l) => (
                <tr key={l.id} className="border-b border-ink-800 last:border-0">
                  <td className="px-2 py-2 text-ink-200">{loopLabel(l.loop_type)}</td>
                  <td className="px-2 py-2 text-ink-500">
                    {l.task_id ? "task" : l.project_id ? "project" : "client"}: {l.task_id || l.project_id || l.client_id}
                  </td>
                  <td className="px-2 py-2">
                    <StatusBadge status={l.status} />
                  </td>
                  <td className="px-2 py-2 text-ink-500">{new Date(l.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {loops.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-ink-500">
                    No loops have run yet.
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
