import Topbar from "@/components/Topbar";
import LoopActionButton from "@/components/LoopActionButton";
import HealthScoreCard from "@/components/overseer/HealthScoreCard";
import AlertList from "@/components/overseer/AlertList";
import RecommendationCard from "@/components/overseer/RecommendationCard";
import { computeOverseerSnapshot } from "@/lib/overseer/engine";
import { listSnapshotHistory } from "@/lib/overseer/persist";
import { formatMoney } from "@/lib/overseer/money";

export const dynamic = "force-dynamic";

export default function OverseerPage() {
  const snapshot = computeOverseerSnapshot();
  const history = listSnapshotHistory(10);
  const { brief, alerts, risks, opportunities, recommendations, forecasts } = snapshot;

  return (
    <div>
      <Topbar
        title="Overseer"
        subtitle="Read-only intelligence layer. Observes, evaluates, and recommends — never performs work."
      />
      <div className="space-y-8 p-4 sm:p-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <HealthScoreCard score={snapshot.healthScore} label={snapshot.healthLabel} components={snapshot.healthComponents} />
          </div>
          <div className="card lg:col-span-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-ink-500">Daily Brief</div>
                <h2 className="mt-1 text-lg font-semibold text-ink-100">{brief.headline}</h2>
              </div>
              <LoopActionButton endpoint="/api/overseer/refresh" label="Log Snapshot" variant="secondary" />
            </div>
            <ul className="mt-4 space-y-2 text-sm text-ink-200">
              {brief.bullets.map((b) => (
                <li key={b} className="flex gap-2">
                  <span className="text-brand-400">•</span>
                  {b}
                </li>
              ))}
            </ul>
            <div className="mt-4 text-xs text-ink-500">
              Generated {new Date(snapshot.generatedAt).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="mb-3 text-sm font-semibold text-ink-100">
            Alerts <span className="text-ink-500">({alerts.length})</span>
          </h2>
          <AlertList alerts={alerts} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card">
            <h2 className="mb-3 text-sm font-semibold text-ink-100">
              Risk Detection <span className="text-ink-500">({risks.length})</span>
            </h2>
            <div className="space-y-2">
              {risks.length === 0 && <p className="text-sm text-ink-500">No systemic risks detected.</p>}
              {risks.map((r) => (
                <div key={r.title} className="rounded-lg border border-ink-700 px-3 py-2">
                  <div className="text-sm font-medium text-ink-100">{r.title}</div>
                  <div className="text-xs text-ink-400">{r.detail}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="mb-3 text-sm font-semibold text-ink-100">
              Opportunity Detection <span className="text-ink-500">({opportunities.length})</span>
            </h2>
            <div className="space-y-2">
              {opportunities.length === 0 && <p className="text-sm text-ink-500">No standout opportunities right now.</p>}
              {opportunities.map((o) => (
                <div key={o.title} className="rounded-lg border border-ink-700 px-3 py-2">
                  <div className="text-sm font-medium text-ink-100">{o.title}</div>
                  <div className="text-xs text-ink-400">{o.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-500">
            Recommendations ({recommendations.length})
          </h2>
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <RecommendationCard key={rec.title} rec={rec} />
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-500">Forecasts</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="card">
              <h3 className="text-sm font-semibold text-ink-100">Revenue Forecast</h3>
              <div className="mt-2 text-2xl font-bold text-emerald-300">
                {formatMoney(forecasts.revenue.next30DayEstimate)}
              </div>
              <div className="text-xs text-ink-500">Estimated next 30 days</div>
              <ul className="mt-3 space-y-1 text-xs text-ink-300">
                {forecasts.revenue.breakdown.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h3 className="text-sm font-semibold text-ink-100">Project Forecast</h3>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-xl font-bold text-emerald-300">{forecasts.projects.onTrack}</div>
                  <div className="text-xs text-ink-500">On track</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-rose-300">{forecasts.projects.behindSchedule}</div>
                  <div className="text-xs text-ink-500">Behind</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-sky-300">{forecasts.projects.nearingDelivery}</div>
                  <div className="text-xs text-ink-500">Nearing delivery</div>
                </div>
              </div>
              <ul className="mt-3 space-y-1 text-xs text-ink-300">
                {forecasts.projects.items.map((i) => (
                  <li key={i.projectId} className="flex justify-between">
                    <span>
                      {i.name} ({i.clientName})
                    </span>
                    <span className={i.behindSchedule ? "text-rose-300" : "text-ink-400"}>{i.percentDone}%</span>
                  </li>
                ))}
                {forecasts.projects.items.length === 0 && <li className="text-ink-500">No in-flight projects.</li>}
              </ul>
            </div>

            <div className="card">
              <h3 className="text-sm font-semibold text-ink-100">Lead Forecast</h3>
              <div className="mt-2 text-2xl font-bold text-violet-300">{forecasts.leads.expectedWinsThisMonth}</div>
              <div className="text-xs text-ink-500">Expected wins this month</div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <div className="font-semibold text-rose-300">{forecasts.leads.hotLeads}</div>
                  <div className="text-ink-500">Hot</div>
                </div>
                <div>
                  <div className="font-semibold text-amber-300">{forecasts.leads.warmLeads}</div>
                  <div className="text-ink-500">Warm</div>
                </div>
                <div>
                  <div className="font-semibold text-ink-300">{forecasts.leads.coldOrUnscored}</div>
                  <div className="text-ink-500">Cold/unscored</div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-sm font-semibold text-ink-100">Workload Forecast</h3>
              <div className="mt-2 text-2xl font-bold text-sky-300">
                {forecasts.workload.estDaysToClearBacklog != null ? `${forecasts.workload.estDaysToClearBacklog}d` : "—"}
              </div>
              <div className="text-xs text-ink-500">Estimated days to clear backlog</div>
              <ul className="mt-3 space-y-1 text-xs text-ink-300">
                <li>{forecasts.workload.openTasks} open tasks</li>
                <li>{forecasts.workload.weeklyVelocity} tasks completed in last 7 days</li>
                <li>{forecasts.workload.staleTaskCount} tasks open 14+ days</li>
              </ul>
            </div>
          </div>
        </div>

        {history.length > 0 && (
          <div className="card">
            <h2 className="mb-3 text-sm font-semibold text-ink-100">Health Score History</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-700 text-left text-xs uppercase tracking-wide text-ink-400">
                  <th className="px-2 py-2">Score</th>
                  <th className="px-2 py-2">Headline</th>
                  <th className="px-2 py-2">Logged</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-b border-ink-800 last:border-0">
                    <td className="px-2 py-2 font-semibold text-ink-100">{h.health_score}</td>
                    <td className="px-2 py-2 text-ink-300">{h.headline}</td>
                    <td className="px-2 py-2 text-ink-500">{new Date(h.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
