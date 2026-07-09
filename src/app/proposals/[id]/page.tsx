import Link from "next/link";
import { notFound } from "next/navigation";
import Topbar from "@/components/Topbar";
import StatusBadge from "@/components/StatusBadge";
import LoopActionButton from "@/components/LoopActionButton";
import { db } from "@/lib/db";
import type { Proposal, Lead } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function ProposalDetailPage({ params }: { params: { id: string } }) {
  const proposal = db.prepare("SELECT * FROM proposals WHERE id = ?").get(params.id) as Proposal | undefined;
  if (!proposal) notFound();

  const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(proposal.lead_id) as Lead;
  const scope = proposal.scope_json ? JSON.parse(proposal.scope_json) : null;
  const deliverables: string[] = proposal.deliverables_json ? JSON.parse(proposal.deliverables_json) : [];

  return (
    <div>
      <Topbar title={`Proposal — ${lead.business_name}`} subtitle={proposal.package_name} />
      <div className="space-y-6 p-8">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={proposal.status} />
          <Link href={`/leads/${lead.id}`} className="text-sm text-brand-300 hover:underline">
            View lead →
          </Link>
        </div>

        <div className="card">
          <h2 className="mb-4 text-sm font-semibold text-ink-100">Actions</h2>
          <div className="flex flex-wrap gap-3">
            {proposal.status === "draft" && (
              <LoopActionButton endpoint={`/api/proposals/${proposal.id}/send`} label="Send Proposal" />
            )}
            {proposal.status === "sent" && (
              <>
                <LoopActionButton
                  endpoint={`/api/proposals/${proposal.id}/status`}
                  label="Mark Accepted"
                  variant="secondary"
                  body={{ status: "accepted" }}
                />
                <LoopActionButton
                  endpoint={`/api/proposals/${proposal.id}/status`}
                  label="Mark Declined"
                  variant="secondary"
                  body={{ status: "declined" }}
                />
              </>
            )}
            <LoopActionButton
              endpoint={`/api/leads/${lead.id}/follow-up`}
              label="Run Follow-Up Email Loop"
              variant="secondary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card">
            <h2 className="mb-3 text-sm font-semibold text-ink-100">Proposal Summary</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-400">Package</dt>
                <dd className="text-ink-100">{proposal.package_name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-400">Price range</dt>
                <dd className="text-ink-100">{proposal.price_range}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-400">Timeline</dt>
                <dd className="text-ink-100">{proposal.timeline_weeks} weeks</dd>
              </div>
              {proposal.sent_at && (
                <div className="flex justify-between">
                  <dt className="text-ink-400">Sent</dt>
                  <dd className="text-ink-100">{new Date(proposal.sent_at).toLocaleString()}</dd>
                </div>
              )}
            </dl>
            {proposal.next_step && (
              <div className="mt-3 rounded-lg bg-ink-800 p-3 text-sm text-ink-200">
                <span className="text-ink-400">Next step: </span>
                {proposal.next_step}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="mb-3 text-sm font-semibold text-ink-100">Scope & Deliverables</h2>
            <ul className="ml-4 list-disc space-y-1 text-sm text-ink-200">
              {deliverables.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            {scope?.focusAreas?.length > 0 && (
              <div className="mt-3 text-xs text-ink-500">Focus areas: {scope.focusAreas.join(", ")}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
