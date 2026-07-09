"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LeadForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create lead");
      }
      const { leadId } = await res.json();
      router.push(`/leads/${leadId}`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card max-w-3xl space-y-5">
      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Business Name *</label>
          <input name="businessName" required className="input" placeholder="Acme Plumbing Co." />
        </div>
        <div>
          <label className="label">Contact Name *</label>
          <input name="contactName" required className="input" placeholder="Jane Doe" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Email</label>
          <input name="email" type="email" className="input" placeholder="jane@acmeplumbing.com" />
        </div>
        <div>
          <label className="label">Phone</label>
          <input name="phone" className="input" placeholder="(555) 555-1234" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Business Type</label>
          <input name="businessType" className="input" placeholder="Residential plumbing contractor" />
        </div>
        <div>
          <label className="label">Requested Service</label>
          <input name="requestedService" className="input" placeholder="New website, CRM automation, ..." />
        </div>
      </div>

      <div>
        <label className="label">Pain Points</label>
        <textarea
          name="painPoints"
          className="input min-h-20"
          placeholder="What did they say is slowing them down? (from the conversation)"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Budget Range</label>
          <select name="budgetRange" className="input">
            <option value="">Select a range</option>
            <option value="$1,500 - $3,000">$1,500 - $3,000</option>
            <option value="$4,000 - $8,000">$4,000 - $8,000</option>
            <option value="$9,000 - $18,000">$9,000 - $18,000</option>
            <option value="$20,000+">$20,000+</option>
          </select>
        </div>
        <div>
          <label className="label">Urgency</label>
          <select name="urgency" className="input" defaultValue="medium">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div>
          <label className="label">Source</label>
          <select name="source" className="input" defaultValue="other">
            <option value="referral">Referral</option>
            <option value="cold_outreach">Cold outreach</option>
            <option value="in_person">In person</option>
            <option value="email_reply">Email reply</option>
            <option value="website">Website</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea name="notes" className="input min-h-20" placeholder="Anything else worth remembering about this conversation." />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Capturing..." : "Run Lead Capture Loop"}
        </button>
      </div>
    </form>
  );
}
