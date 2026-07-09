import Link from "next/link";
import { notFound } from "next/navigation";
import Topbar from "@/components/Topbar";
import StatusBadge from "@/components/StatusBadge";
import LoopActionButton from "@/components/LoopActionButton";
import { db } from "@/lib/db";
import type { Project, Client, Task } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(params.id) as Project | undefined;
  if (!project) notFound();

  const client = db.prepare("SELECT * FROM clients WHERE id = ?").get(project.client_id) as Client;
  const tasks = db
    .prepare("SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at ASC")
    .all(params.id) as Task[];
  const scope = project.scope_json ? JSON.parse(project.scope_json) : null;

  return (
    <div>
      <Topbar title={project.name} subtitle={`Client: ${client.business_name}`} />
      <div className="space-y-6 p-8">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={project.status} />
          <span className="text-sm text-ink-400">{project.price_quote}</span>
          <span className="text-sm text-ink-400">{project.timeline_weeks} weeks</span>
          <Link href={`/clients/${client.id}`} className="text-sm text-brand-300 hover:underline">
            View client →
          </Link>
        </div>

        <div className="card">
          <h2 className="mb-4 text-sm font-semibold text-ink-100">Project Loop Pipeline</h2>
          <div className="flex flex-wrap gap-3">
            <LoopActionButton endpoint={`/api/projects/${project.id}/generate-tasks`} label="Run Task Generation Loop" />
            <LoopActionButton
              endpoint={`/api/projects/${project.id}/update`}
              label="Run Client Update Loop"
              variant="secondary"
            />
          </div>
        </div>

        {scope && (
          <div className="card">
            <h2 className="mb-3 text-sm font-semibold text-ink-100">Scope</h2>
            <ul className="ml-4 list-disc space-y-1 text-sm text-ink-200">
              {scope.deliverables.map((d: string) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-100">Tasks ({tasks.length})</h2>
            <Link href="/tasks" className="text-xs text-brand-300 hover:underline">
              View all tasks
            </Link>
          </div>
          <div className="space-y-2">
            {tasks.map((t) => (
              <div key={t.id} className="rounded-lg border border-ink-700 px-3 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-ink-100">{t.title}</div>
                    <div className="text-xs text-ink-500">
                      {t.category} · priority: {t.priority}
                    </div>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <LoopActionButton
                    endpoint={`/api/tasks/${t.id}/build`}
                    label="Run Claude Build Loop"
                    variant="secondary"
                  />
                  <LoopActionButton
                    endpoint={`/api/tasks/${t.id}/review`}
                    label="Mark Reviewed: Pass"
                    variant="secondary"
                    body={{ passed: true }}
                  />
                  <LoopActionButton
                    endpoint={`/api/tasks/${t.id}/review`}
                    label="Mark Reviewed: Fail"
                    variant="secondary"
                    body={{ passed: false, reviewerNotes: "Needs revision." }}
                  />
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <p className="text-sm text-ink-500">No tasks yet — run the Task Generation Loop.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
