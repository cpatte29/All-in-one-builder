"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ConversationForm({ leadId }: { leadId: string }) {
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
      const res = await fetch(`/api/leads/${leadId}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to log conversation");
      }
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {error && <div className="text-xs text-rose-400">{error}</div>}
      <div className="flex gap-2">
        <select name="channel" className="input w-40" defaultValue="in_person">
          <option value="in_person">In person</option>
          <option value="email">Email</option>
          <option value="call">Call</option>
          <option value="referral">Referral</option>
          <option value="other">Other</option>
        </select>
        <input name="summary" required className="input flex-1" placeholder="What happened in this touchpoint?" />
        <button type="submit" disabled={submitting} className="btn-secondary shrink-0">
          {submitting ? "Logging..." : "Log"}
        </button>
      </div>
    </form>
  );
}
