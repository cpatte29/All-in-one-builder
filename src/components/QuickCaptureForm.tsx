"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface CaptureResult {
  leadId: string;
  nextStep: string;
  diagnosis: { industry: string; painScore: number; opportunityScore: number; painPoints: string[] };
  match: { packageName: string; fitScore: number; rationale: string };
  proposal: { packageName: string; priceRange: string; timelineWeeks: number; deliverables: string[]; nextStep: string };
  followUp: { subject: string; body: string; dueAt: string };
  score: { score: number; summary: string };
}

const fieldClass = "input py-3 text-base";

export default function QuickCaptureForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CaptureResult | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());

    try {
      const res = await fetch("/api/field/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to run sales loops");
      setResult(json);
      form.reset();
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="card space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Business Name *</label>
            <input name="businessName" required className={fieldClass} placeholder="Acme Plumbing Co." />
          </div>
          <div>
            <label className="label">Business Type</label>
            <input name="businessType" className={fieldClass} placeholder="Residential plumbing contractor" />
          </div>
        </div>

        <div>
          <label className="label">Contact *</label>
          <input
            name="contact"
            required
            className={fieldClass}
            placeholder="Jane Doe, (555) 555-1234 or jane@acme.com"
          />
        </div>

        <div>
          <label className="label">What They Said (voice note / transcript)</label>
          <textarea
            name="whatTheySaid"
            className={`${fieldClass} min-h-28`}
            placeholder="Paste a voice-to-text transcript or jot down what they told you about their problem..."
          />
        </div>

        <div>
          <label className="label">What They Want</label>
          <textarea
            name="whatTheyWant"
            className={`${fieldClass} min-h-20`}
            placeholder="New website, automated booking, help catching up on leads..."
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Budget (if known)</label>
            <select name="budgetRange" className={fieldClass} defaultValue="">
              <option value="">Unknown</option>
              <option value="$1,500 - $3,000">$1,500 - $3,000</option>
              <option value="$4,000 - $8,000">$4,000 - $8,000</option>
              <option value="$9,000 - $18,000">$9,000 - $18,000</option>
              <option value="$20,000+">$20,000+</option>
            </select>
          </div>
          <div>
            <label className="label">Urgency</label>
            <select name="urgency" className={fieldClass} defaultValue="medium">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea name="notes" className={`${fieldClass} min-h-16`} placeholder="Anything else worth remembering." />
        </div>

        {error && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full py-4 text-base font-semibold sm:w-auto sm:px-8"
        >
          {submitting ? "Running Sales Loops..." : "Run Sales Loops"}
        </button>
      </form>

      {result && (
        <div className="card space-y-5 border-brand-400/40">
          <div className="rounded-lg bg-brand-500/10 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-brand-300">Next Step</div>
            <div className="mt-1 text-base text-ink-100">{result.nextStep}</div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-ink-700 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-ink-500">Pain Summary</div>
              <div className="mt-1 text-sm text-ink-100">{result.diagnosis.industry}</div>
              <div className="text-xs text-ink-400">
                Pain {result.diagnosis.painScore}/100 · Opportunity {result.diagnosis.opportunityScore}/100
              </div>
              <ul className="ml-4 mt-1 list-disc text-xs text-ink-300">
                {result.diagnosis.painPoints.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-ink-700 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-ink-500">Offer Match</div>
              <div className="mt-1 text-sm font-medium text-ink-100">{result.match.packageName}</div>
              <div className="text-xs text-ink-400">Fit {result.match.fitScore}/100</div>
              <p className="mt-1 text-xs text-ink-300">{result.match.rationale}</p>
            </div>

            <div className="rounded-lg border border-ink-700 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-ink-500">Proposal Draft</div>
              <div className="mt-1 text-sm text-ink-100">
                {result.proposal.packageName} · {result.proposal.priceRange} · {result.proposal.timelineWeeks} wks
              </div>
              <ul className="ml-4 mt-1 list-disc text-xs text-ink-300">
                {result.proposal.deliverables.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-ink-700 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-ink-500">Close Probability</div>
              <div
                className={`mt-1 text-lg font-semibold ${result.score.score >= 70 ? "text-emerald-300" : "text-ink-100"}`}
              >
                {result.score.score}/100
              </div>
              <div className="text-xs text-ink-400">{result.score.summary}</div>
            </div>
          </div>

          <div className="rounded-lg border border-ink-700 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-500">Follow-Up Email (ready to send)</div>
            <div className="mt-1 text-sm font-medium text-ink-100">{result.followUp.subject}</div>
            <div className="mt-1 whitespace-pre-line text-xs text-ink-300">{result.followUp.body}</div>
            <div className="mt-1 text-xs text-ink-500">Due {new Date(result.followUp.dueAt).toLocaleString()}</div>
          </div>

          <Link href={`/leads/${result.leadId}`} className="btn-secondary inline-block">
            View full lead →
          </Link>
        </div>
      )}
    </div>
  );
}
