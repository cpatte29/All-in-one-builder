import type { HealthComponent } from "@/lib/overseer/types";

function bandColor(score: number) {
  if (score >= 85) return "text-emerald-300";
  if (score >= 70) return "text-sky-300";
  if (score >= 50) return "text-amber-300";
  return "text-rose-300";
}

function barColor(score: number) {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 70) return "bg-sky-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-rose-500";
}

export default function HealthScoreCard({
  score,
  label,
  components,
}: {
  score: number;
  label: string;
  components: HealthComponent[];
}) {
  return (
    <div className="card">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-500">Company Health Score</div>
          <div className={`mt-1 text-5xl font-bold ${bandColor(score)}`}>{score}</div>
          <div className="text-sm text-ink-400">{label}</div>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {components.map((c) => (
          <div key={c.label}>
            <div className="flex items-center justify-between text-xs text-ink-400">
              <span>{c.label}</span>
              <span>{c.score}/100</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink-800">
              <div className={`h-full rounded-full ${barColor(c.score)}`} style={{ width: `${c.score}%` }} />
            </div>
            <div className="mt-1 text-xs text-ink-500">{c.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
