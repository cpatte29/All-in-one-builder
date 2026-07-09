import Topbar from "@/components/Topbar";
import { db } from "@/lib/db";
import type { Package } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const packages = db.prepare("SELECT * FROM packages ORDER BY timeline_weeks ASC").all() as Package[];

  return (
    <div>
      <Topbar title="Settings" subtitle="Service package catalog used by the Package Recommendation Loop." />
      <div className="space-y-6 p-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {packages.map((p) => {
            const deliverables: string[] = JSON.parse(p.deliverables_json || "[]");
            return (
              <div key={p.id} className="card">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-ink-100">{p.name}</h3>
                  <span className="rounded-full bg-ink-700 px-2 py-0.5 text-xs text-ink-300">{p.tier}</span>
                </div>
                <p className="mt-2 text-sm text-ink-400">{p.description}</p>
                <div className="mt-3 text-xs text-ink-500">
                  {p.price_range} · {p.timeline_weeks} weeks
                </div>
                <ul className="ml-4 mt-3 list-disc space-y-1 text-sm text-ink-300">
                  {deliverables.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="card">
          <h2 className="mb-2 text-sm font-semibold text-ink-100">About FABLE 5</h2>
          <p className="text-sm text-ink-400">
            FABLE 5 is a local-first operations dashboard. Package definitions live in{" "}
            <code className="rounded bg-ink-800 px-1 py-0.5 text-xs">src/lib/packages.ts</code> and are seeded into
            the <code className="rounded bg-ink-800 px-1 py-0.5 text-xs">packages</code> table via{" "}
            <code className="rounded bg-ink-800 px-1 py-0.5 text-xs">db/seed.ts</code>. To move to Supabase, point{" "}
            <code className="rounded bg-ink-800 px-1 py-0.5 text-xs">src/lib/db.ts</code> at a Postgres connection —
            the schema is Postgres-compatible as-is.
          </p>
        </div>
      </div>
    </div>
  );
}
