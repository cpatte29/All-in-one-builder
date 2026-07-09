import Link from "next/link";
import Topbar from "@/components/Topbar";
import StatusBadge from "@/components/StatusBadge";
import LoopActionButton from "@/components/LoopActionButton";
import { db } from "@/lib/db";
import type { FollowUp } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function FollowUpsPage() {
  const followUps = db
    .prepare(
      `SELECT f.*, l.business_name as lead_name, l.id as lead_id
       FROM follow_ups f JOIN leads l ON l.id = f.lead_id
       ORDER BY f.due_at ASC`
    )
    .all() as (FollowUp & { lead_name: string; lead_id: string })[];

  const now = Date.now();
  const due = followUps.filter((f) => f.status === "pending" && new Date(f.due_at).getTime() <= now);
  const upcoming = followUps.filter((f) => f.status === "pending" && new Date(f.due_at).getTime() > now);
  const resolved = followUps.filter((f) => f.status !== "pending");

  const Section = ({ title, items }: { title: string; items: typeof followUps }) => (
    <div className="card">
      <h2 className="mb-3 text-sm font-semibold text-ink-100">
        {title} <span className="text-ink-500">({items.length})</span>
      </h2>
      <div className="space-y-3">
        {items.length === 0 && <p className="text-sm text-ink-500">Nothing here.</p>}
        {items.map((f) => (
          <div key={f.id} className="rounded-lg border border-ink-700 px-3 py-3">
            <div className="flex items-center justify-between">
              <div>
                <Link href={`/leads/${f.lead_id}`} className="text-sm font-medium text-ink-100 hover:text-brand-300">
                  {f.lead_name}
                </Link>
                <div className="text-xs text-ink-500">
                  {f.channel} · due {new Date(f.due_at).toLocaleDateString()}
                </div>
              </div>
              <StatusBadge status={f.status} />
            </div>
            {f.email_subject && <div className="mt-2 text-sm text-ink-200">{f.email_subject}</div>}
            {f.email_body && <div className="mt-1 whitespace-pre-line text-xs text-ink-400">{f.email_body}</div>}
            {f.status === "pending" && (
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
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <Topbar title="Follow-Ups" subtitle={`${due.length} due now, ${upcoming.length} upcoming.`} />
      <div className="space-y-6 p-8">
        <Section title="Due Now" items={due} />
        <Section title="Upcoming" items={upcoming} />
        <Section title="Resolved" items={resolved} />
      </div>
    </div>
  );
}
