import Link from "next/link";
import { notFound } from "next/navigation";
import Topbar from "@/components/Topbar";
import StatusBadge from "@/components/StatusBadge";
import LoopActionButton from "@/components/LoopActionButton";
import ConversationForm from "@/components/ConversationForm";
import { db } from "@/lib/db";
import type { Lead, Conversation, Proposal, FollowUp, SalesActivityEntry, LoopRun } from "@/lib/types";
import { loopLabel } from "@/lib/loops";

export const dynamic = "force-dynamic";

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(params.id) as Lead | undefined;
  if (!lead) notFound();

  const conversations = db
    .prepare("SELECT * FROM conversations WHERE lead_id = ? ORDER BY occurred_at DESC")
    .all(params.id) as Conversation[];
  const proposals = db
    .prepare("SELECT * FROM proposals WHERE lead_id = ? ORDER BY created_at DESC")
    .all(params.id) as Proposal[];
  const followUps = db
    .prepare("SELECT * FROM follow_ups WHERE lead_id = ? ORDER BY due_at ASC")
    .all(params.id) as FollowUp[];
  const loops = db
    .prepare("SELECT * FROM loops WHERE lead_id = ? ORDER BY created_at DESC")
    .all(params.id) as LoopRun[];

  const proposalIds = proposals.map((p) => p.id);
  const activity =
    proposalIds.length > 0
      ? (db
          .prepare(
            `SELECT * FROM sales_activity WHERE entity_id IN (?, ${proposalIds.map(() => "?").join(",")}) ORDER BY created_at DESC LIMIT 30`
          )
          .all(params.id, ...proposalIds) as SalesActivityEntry[])
      : (db
          .prepare(`SELECT * FROM sales_activity WHERE entity_id = ? ORDER BY created_at DESC LIMIT 30`)
          .all(params.id) as SalesActivityEntry[]);

  const diagnosis = lead.diagnosis_json ? JSON.parse(lead.diagnosis_json) : null;
  const offerMatch = lead.offer_match_json ? JSON.parse(lead.offer_match_json) : null;
  const closeScore = lead.close_probability_json ? JSON.parse(lead.close_probability_json) : null;

  return (
    <div>
      <Topbar title={lead.business_name} subtitle={lead.contact_name} />
      <div className="space-y-6 p-8">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={lead.status} />
          {lead.close_probability != null && (
            <span
              className={`text-sm font-semibold ${lead.close_probability >= 70 ? "text-emerald-300" : "text-ink-300"}`}
            >
              {lead.close_probability}/100 close probability{lead.close_probability >= 70 ? " 🔥" : ""}
            </span>
          )}
          {lead.email && <span className="text-sm text-ink-400">{lead.email}</span>}
          {lead.client_id && (
            <Link href={`/clients/${lead.client_id}`} className="text-sm text-brand-300 hover:underline">
              View converted client →
            </Link>
          )}
        </div>

        <div className="card">
          <h2 className="mb-4 text-sm font-semibold text-ink-100">Sales Loop Pipeline</h2>
          <div className="flex flex-wrap gap-3">
            <LoopActionButton endpoint={`/api/leads/${lead.id}/diagnose`} label="Run Business Pain Loop" />
            <LoopActionButton endpoint={`/api/leads/${lead.id}/match`} label="Run Offer Match Loop" variant="secondary" />
            <LoopActionButton
              endpoint={`/api/leads/${lead.id}/proposal`}
              label="Run Proposal Generation Loop"
              variant="secondary"
            />
            <LoopActionButton
              endpoint={`/api/leads/${lead.id}/follow-up`}
              label="Run Follow-Up Email Loop"
              variant="secondary"
            />
            <LoopActionButton endpoint={`/api/leads/${lead.id}/score`} label="Run Close Probability Loop" variant="secondary" />
          </div>
          <p className="mt-3 text-xs text-ink-500">
            Run in order: Business Pain → Offer Match → Proposal Generation. Follow-Up Email and Close
            Probability can be run any time after Business Pain.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 border-t border-ink-700 pt-4">
            <LoopActionButton
              endpoint={`/api/leads/${lead.id}/convert`}
              label="Convert to Client"
              variant="secondary"
            />
            <LoopActionButton
              endpoint={`/api/leads/${lead.id}/status`}
              label="Mark Negotiating"
              variant="secondary"
              body={{ status: "negotiating" }}
            />
            <LoopActionButton
              endpoint={`/api/leads/${lead.id}/status`}
              label="Mark Lost"
              variant="secondary"
              body={{ status: "lost" }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card">
            <h2 className="mb-3 text-sm font-semibold text-ink-100">Lead Details</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-400">Business type</dt>
                <dd className="text-ink-100">{lead.business_type || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-400">Requested service</dt>
                <dd className="text-ink-100">{lead.requested_service || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-400">Budget</dt>
                <dd className="text-ink-100">{lead.budget_range || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-400">Urgency</dt>
                <dd className="text-ink-100">{lead.urgency}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-400">Source</dt>
                <dd className="text-ink-100">{lead.source.replace(/_/g, " ")}</dd>
              </div>
              {lead.pain_points && (
                <div>
                  <dt className="text-ink-400">Pain points</dt>
                  <dd className="mt-1 text-ink-200">{lead.pain_points}</dd>
                </div>
              )}
              {lead.notes && (
                <div>
                  <dt className="text-ink-400">Notes</dt>
                  <dd className="mt-1 text-ink-200">{lead.notes}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="space-y-6">
            <div className="card">
              <h2 className="mb-3 text-sm font-semibold text-ink-100">Business Pain Diagnosis</h2>
              {diagnosis ? (
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-ink-400">Industry:</span> <span className="text-ink-100">{diagnosis.industry}</span>
                  </div>
                  <div>
                    <span className="text-ink-400">Pain score:</span>{" "}
                    <span className="text-ink-100">{diagnosis.painScore}/100</span>
                  </div>
                  <div>
                    <span className="text-ink-400">Opportunity score:</span>{" "}
                    <span className="text-ink-100">{diagnosis.opportunityScore}/100</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-ink-500">Not yet diagnosed.</p>
              )}
            </div>

            <div className="card">
              <h2 className="mb-3 text-sm font-semibold text-ink-100">Offer Match</h2>
              {offerMatch ? (
                <div className="space-y-1 text-sm">
                  <div className="font-medium text-ink-100">{offerMatch.packageName}</div>
                  <div className="text-ink-400">Fit score: {offerMatch.fitScore}/100</div>
                  <p className="mt-1 text-ink-300">{offerMatch.rationale}</p>
                </div>
              ) : (
                <p className="text-sm text-ink-500">No offer matched yet.</p>
              )}
            </div>

            {closeScore && (
              <div className="card">
                <h2 className="mb-3 text-sm font-semibold text-ink-100">Close Probability Breakdown</h2>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-ink-400">Urgency</div>
                  <div className="text-right text-ink-100">{closeScore.breakdown.urgency}</div>
                  <div className="text-ink-400">Budget</div>
                  <div className="text-right text-ink-100">{closeScore.breakdown.budget}</div>
                  <div className="text-ink-400">Fit</div>
                  <div className="text-right text-ink-100">{closeScore.breakdown.fit}</div>
                  <div className="text-ink-400">Responsiveness</div>
                  <div className="text-right text-ink-100">{closeScore.breakdown.responsiveness}</div>
                  <div className="text-ink-400">Pain level</div>
                  <div className="text-right text-ink-100">{closeScore.breakdown.painLevel}</div>
                </div>
                <p className="mt-2 text-xs text-ink-500">{closeScore.summary}</p>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="mb-3 text-sm font-semibold text-ink-100">Conversations</h2>
          <ConversationForm leadId={lead.id} />
          <div className="mt-4 space-y-3">
            {conversations.length === 0 && <p className="text-sm text-ink-500">No conversations logged yet.</p>}
            {conversations.map((c) => (
              <div key={c.id} className="border-l-2 border-ink-600 pl-3 text-sm">
                <div className="text-ink-200">{c.summary}</div>
                <div className="text-xs text-ink-500">
                  {c.channel.replace(/_/g, " ")} · {new Date(c.occurred_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="mb-3 text-sm font-semibold text-ink-100">Proposals</h2>
          <div className="space-y-2">
            {proposals.length === 0 && (
              <p className="text-sm text-ink-500">No proposals yet — run the Proposal Generation Loop.</p>
            )}
            {proposals.map((p) => (
              <Link
                key={p.id}
                href={`/proposals/${p.id}`}
                className="flex items-center justify-between rounded-lg border border-ink-700 px-3 py-2 hover:border-ink-500"
              >
                <div>
                  <div className="text-sm font-medium text-ink-100">{p.package_name}</div>
                  <div className="text-xs text-ink-500">
                    {p.price_range} · {p.timeline_weeks} weeks
                  </div>
                </div>
                <StatusBadge status={p.status} />
              </Link>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="mb-3 text-sm font-semibold text-ink-100">Follow-Ups</h2>
          <div className="space-y-2">
            {followUps.length === 0 && (
              <p className="text-sm text-ink-500">No follow-ups yet — run the Follow-Up Email Loop.</p>
            )}
            {followUps.map((f) => (
              <div key={f.id} className="rounded-lg border border-ink-700 px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-ink-100">{f.email_subject}</div>
                  <StatusBadge status={f.status} />
                </div>
                <div className="mt-1 whitespace-pre-line text-xs text-ink-400">{f.email_body}</div>
                <div className="mt-1 text-xs text-ink-500">Due {new Date(f.due_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card">
            <h2 className="mb-3 text-sm font-semibold text-ink-100">Sales Activity</h2>
            <div className="space-y-3">
              {activity.length === 0 && <p className="text-sm text-ink-500">No activity yet.</p>}
              {activity.map((a) => (
                <div key={a.id} className="border-l-2 border-brand-500/50 pl-3 text-sm">
                  <div className="text-ink-200">{a.message}</div>
                  <div className="text-xs text-ink-500">{new Date(a.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="mb-3 text-sm font-semibold text-ink-100">Loop Run History</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-700 text-left text-xs uppercase tracking-wide text-ink-400">
                  <th className="py-2">Loop</th>
                  <th className="py-2">Ran</th>
                </tr>
              </thead>
              <tbody>
                {loops.map((l) => (
                  <tr key={l.id} className="border-b border-ink-800 last:border-0">
                    <td className="py-2 text-ink-200">{loopLabel(l.loop_type)}</td>
                    <td className="py-2 text-ink-500">{new Date(l.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {loops.length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-4 text-center text-ink-500">
                      No loops run yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
