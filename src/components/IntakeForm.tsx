"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function IntakeForm() {
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
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to create client");
      }
      const { clientId } = await res.json();
      router.push(`/clients/${clientId}`);
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
          <label className="label">Email *</label>
          <input name="email" type="email" required className="input" placeholder="jane@acmeplumbing.com" />
        </div>
        <div>
          <label className="label">Phone</label>
          <input name="phone" className="input" placeholder="(555) 555-1234" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Existing Website (leave blank if none)</label>
          <input name="website" className="input" placeholder="https://..." />
        </div>
        <div>
          <label className="label">Business Type / Industry</label>
          <input name="businessType" className="input" placeholder="Residential plumbing contractor" />
        </div>
      </div>

      <div>
        <label className="label">Goals</label>
        <textarea name="goals" className="input min-h-20" placeholder="What is this business trying to achieve?" />
      </div>

      <div>
        <label className="label">Pain Points</label>
        <textarea
          name="painPoints"
          className="input min-h-20"
          placeholder="What's slowing them down today? (e.g. missed leads, manual scheduling)"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
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
          <label className="label">Lead Source</label>
          <input name="source" className="input" placeholder="Referral, cold outreach, website, ..." />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Creating..." : "Run Client Profile Loop"}
        </button>
      </div>
    </form>
  );
}
