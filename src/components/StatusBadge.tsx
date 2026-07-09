const COLORS: Record<string, string> = {
  new: "bg-ink-700 text-ink-200",
  profiled: "bg-sky-500/15 text-sky-300",
  diagnosed: "bg-sky-500/15 text-sky-300",
  package_recommended: "bg-violet-500/15 text-violet-300",
  scoped: "bg-violet-500/15 text-violet-300",
  scoping: "bg-violet-500/15 text-violet-300",
  tasks_generated: "bg-amber-500/15 text-amber-300",
  in_build: "bg-amber-500/15 text-amber-300",
  in_progress: "bg-amber-500/15 text-amber-300",
  ready_for_build: "bg-amber-500/15 text-amber-300",
  in_review: "bg-fuchsia-500/15 text-fuchsia-300",
  needs_revision: "bg-rose-500/15 text-rose-300",
  backlog: "bg-ink-700 text-ink-300",
  delivered: "bg-emerald-500/15 text-emerald-300",
  done: "bg-emerald-500/15 text-emerald-300",
  // Sales Mode
  matched: "bg-violet-500/15 text-violet-300",
  proposal_ready: "bg-amber-500/15 text-amber-300",
  proposal_sent: "bg-amber-500/15 text-amber-300",
  negotiating: "bg-fuchsia-500/15 text-fuchsia-300",
  won: "bg-emerald-500/15 text-emerald-300",
  lost: "bg-rose-500/15 text-rose-300",
  draft: "bg-ink-700 text-ink-300",
  sent: "bg-amber-500/15 text-amber-300",
  accepted: "bg-emerald-500/15 text-emerald-300",
  declined: "bg-rose-500/15 text-rose-300",
  pending: "bg-ink-700 text-ink-300",
  skipped: "bg-ink-700 text-ink-400",
};

export default function StatusBadge({ status }: { status: string }) {
  const cls = COLORS[status] || "bg-ink-700 text-ink-200";
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
