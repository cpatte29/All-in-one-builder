import Link from "next/link";
import Topbar from "@/components/Topbar";
import StatusBadge from "@/components/StatusBadge";
import { db } from "@/lib/db";
import type { Task } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function TasksPage() {
  const tasks = db
    .prepare(
      `SELECT t.*, p.name as project_name, p.id as project_id, c.business_name as client_name
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       JOIN clients c ON c.id = p.client_id
       ORDER BY t.created_at DESC`
    )
    .all() as (Task & { project_name: string; project_id: string; client_name: string })[];

  return (
    <div>
      <Topbar title="Tasks" subtitle={`${tasks.length} task card${tasks.length === 1 ? "" : "s"} across all projects.`} />
      <div className="p-8">
        <div className="card overflow-hidden !p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-700 text-left text-xs uppercase tracking-wide text-ink-400">
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id} className="border-b border-ink-800 last:border-0 hover:bg-ink-800/50">
                  <td className="px-4 py-3 font-medium text-ink-100">{t.title}</td>
                  <td className="px-4 py-3 text-ink-300">
                    <Link href={`/projects/${t.project_id}`} className="hover:text-brand-300">
                      {t.project_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-400">{t.client_name}</td>
                  <td className="px-4 py-3 text-ink-400">{t.category}</td>
                  <td className="px-4 py-3 text-ink-400">{t.priority}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.status} />
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-500">
                    No tasks yet — tasks are created by the Task Generation Loop.
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
