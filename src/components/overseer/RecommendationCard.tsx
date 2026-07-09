import type { Recommendation } from "@/lib/overseer/types";

const CONFIDENCE_STYLE: Record<Recommendation["confidence"], string> = {
  High: "bg-emerald-500/15 text-emerald-300",
  Medium: "bg-amber-500/15 text-amber-300",
  Low: "bg-ink-700 text-ink-300",
};

const CATEGORY_STYLE: Record<Recommendation["category"], string> = {
  risk: "bg-rose-500/15 text-rose-300",
  opportunity: "bg-emerald-500/15 text-emerald-300",
  sales: "bg-violet-500/15 text-violet-300",
  ops: "bg-sky-500/15 text-sky-300",
};

export default function RecommendationCard({ rec }: { rec: Recommendation }) {
  return (
    <div className="rounded-lg border border-ink-700 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink-100">{rec.title}</h3>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${CATEGORY_STYLE[rec.category]}`}>
            {rec.category}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${CONFIDENCE_STYLE[rec.confidence]}`}>
            {rec.confidence} confidence
          </span>
        </div>
      </div>

      <div className="mt-3 text-xs text-ink-500">Reason</div>
      <p className="text-sm text-ink-200">{rec.reason}</p>

      <div className="mt-3 text-xs text-ink-500">Supporting Data</div>
      <ul className="ml-4 list-disc text-sm text-ink-300">
        {rec.supportingData.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>

      <div className="mt-3 rounded-lg bg-ink-800 p-3">
        <div className="text-xs text-ink-500">Suggested CEO Action</div>
        <p className="text-sm text-ink-100">{rec.suggestedAction}</p>
      </div>
    </div>
  );
}
