import Link from "next/link";
import Topbar from "@/components/Topbar";
import StatusBadge from "@/components/StatusBadge";
import LoopActionButton from "@/components/LoopActionButton";
import QuickCaptureForm from "@/components/QuickCaptureForm";
import { db } from "@/lib/db";
import type { Lead, FollowUp } from "@/lib/types";
import { BOARD_COLUMNS, BOARD_COLORS, boardColumnForLead } from "@/lib/leadBoard";

export const dynamic = "force-dynamic";

export default function FieldModePage() {
  const leads = db.prepare("SELECT * FROM leads ORDER BY created_at DESC").all() as Lead[];

  const columns = Object.fromEntries(BOARD_COLUMNS.map((c) => [c, [] as Lead[]])) as Record<string, Lead[]>;
  for (const lead of leads) columns[boardColumnForLead(lead)].push(lead);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const todaysFollowUps = db
    .prepare(
      `SELECT f.*, l.business_name as lead_name, l.id as lead_id
       FROM follow_ups f JOIN leads l ON l.id = f.lead_id
       WHERE f.status = 'pending' AND f.due_at <= ?
       ORDER BY f.due_at ASC`
    )
    .all(todayEnd.toISOString()) as (FollowUp & { lead_name: string; lead_id: string })[];

  return (
    <div>
      <Topbar
        title="CEO Field Mode"
        subtitle="Capture a conversation, run every sales loop in one tap, and see what to do next."
      />
      <div className="space-y-8 p-4 sm:p-8">
        <QuickCaptureForm />

        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-500">Pipeline Board</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {BOARD_COLUMNS.map((col) => (
              <div key={col} className={`rounded-xl border p-3 ${BOARD_COLORS[col]}`}>
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs font-semibold text-ink-100">{col}</div>
                  <div className="text-xs text-ink-400">{columns[col].length}</div>
                </div>
                <div className="max-h-72 space-y-2 overflow-y-auto">
                  {columns[col].map((l) => (
                    <Link
                      key={l.id}
                      href={`/leads/${l.id}`}
                      className="block rounded-lg bg-ink-900/60 px-2 py-2 text-xs hover:bg-ink-900"
                    >
                      <div className="font-medium text-ink-100">{l.business_name}</div>
                      <div className="text-ink-500">
                        {l.close_probability != null ? `${l.close_probability}/100` : l.urgency}
                      </div>
                    </Link>
                  ))}
                  {columns[col].length === 0 && <div className="text-xs text-ink-600">Empty</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="mb-3 text-sm font-semibold text-ink-100">
            Today&apos;s Follow-Ups <span className="text-ink-500">({todaysFollowUps.length})</span>
          </h2>
          <div className="space-y-3">
            {todaysFollowUps.length === 0 && <p className="text-sm text-ink-500">Nothing due today.</p>}
            {todaysFollowUps.map((f) => (
              <div key={f.id} className="rounded-lg border border-ink-700 px-3 py-3">
                <div className="flex items-center justify-between">
                  <Link href={`/leads/${f.lead_id}`} className="text-sm font-medium text-ink-100 hover:text-brand-300">
                    {f.lead_name}
                  </Link>
                  <StatusBadge status={f.status} />
                </div>
                {f.email_subject && <div className="mt-1 text-sm text-ink-200">{f.email_subject}</div>}
                <div className="mt-1 text-xs text-ink-500">
                  {f.channel} · due {new Date(f.due_at).toLocaleString()}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <LoopActionButton
                    endpoint={`/api/follow-ups/${f.id}`}
                    label="Mark Sent"
                    variant="secondary"
                    body={{ status: "sent" }}
                  />
                  <LoopActionButton
                    endpoint={`/api/follow-ups/${f.id}`}
                    label="Mark Done"
                    variant="secondary"
                    body={{ status: "done" }}
                  />
                  <LoopActionButton
                    endpoint={`/api/follow-ups/${f.id}`}
                    label="Skip"
                    variant="secondary"
                    body={{ status: "skipped" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
