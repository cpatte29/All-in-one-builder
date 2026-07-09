import Link from "next/link";
import Topbar from "@/components/Topbar";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { db } from "@/lib/db";
import type { Client, Task, ActivityLogEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const clientCount = (db.prepare("SELECT COUNT(*) as n FROM clients").get() as { n: number }).n;
  const projectCount = (db.prepare("SELECT COUNT(*) as n FROM projects").get() as { n: number }).n;
  const openTasks = (
    db.prepare("SELECT COUNT(*) as n FROM tasks WHERE status != 'done'").get() as { n: number }
  ).n;
  const doneTasks = (
    db.prepare("SELECT COUNT(*) as n FROM tasks WHERE status = 'done'").get() as { n: number }
  ).n;

  const recentClients = db
    .prepare("SELECT * FROM clients ORDER BY created_at DESC LIMIT 5")
    .all() as Client[];
  const recentActivity = db
    .prepare("SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 8")
    .all() as ActivityLogEntry[];

  return (
    <div>
      <Topbar title="Dashboard" subtitle="Pipeline health at a glance." />
      <div className="space-y-6 p-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Clients" value={clientCount} />
          <StatCard label="Projects" value={projectCount} />
          <StatCard label="Open Tasks" value={openTasks} />
          <StatCard label="Completed Tasks" value={doneTasks} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink-100">Recent Clients</h2>
              <Link href="/clients" className="text-xs text-brand-300 hover:underline">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {recentClients.length === 0 && (
                <p className="text-sm text-ink-500">No clients yet. Start with New Intake.</p>
              )}
              {recentClients.map((c) => (
                <Link
                  key={c.id}
                  href={`/clients/${c.id}`}
                  className="flex items-center justify-between rounded-lg border border-ink-700 px-3 py-2 hover:border-ink-500"
                >
                  <div>
                    <div className="text-sm font-medium text-ink-100">{c.business_name}</div>
                    <div className="text-xs text-ink-500">{c.contact_name}</div>
                  </div>
                  <StatusBadge status={c.status} />
                </Link>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="mb-4 text-sm font-semibold text-ink-100">Recent Activity</h2>
            <div className="space-y-3">
              {recentActivity.length === 0 && <p className="text-sm text-ink-500">No activity yet.</p>}
              {recentActivity.map((a) => (
                <div key={a.id} className="border-l-2 border-brand-500/50 pl-3 text-sm">
                  <div className="text-ink-200">{a.message}</div>
                  <div className="text-xs text-ink-500">{new Date(a.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
