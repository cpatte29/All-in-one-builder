"use client";

import { useState } from "react";

const PREFERRED_TIMES = ["Weekday mornings", "Weekday afternoons", "Weekday evenings", "Weekends"];

/**
 * The site's conversion core. Exactly these fields — a content pack
 * cannot add to this form (Platform Constitution, Article IV applied to
 * this template: no pack may reintroduce a health-soliciting field here).
 * The data-minimization note below is fixed, not pack-configurable copy.
 */
export default function LeadForm() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const preferredTimes = PREFERRED_TIMES.filter((t) => form.get(t) === "on");
    const payload = {
      name: form.get("name"),
      phone: form.get("phone"),
      email: form.get("email"),
      preferredTimes,
      patientStatus: form.get("patientStatus"),
    };

    try {
      const res = await fetch("/api/lead-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Something went wrong. Please call us instead.");
      setSubmitted(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-brand-primary/30 bg-brand-primary/5 p-6 text-center">
        <p className="font-medium">Thanks — we got your request.</p>
        <p className="mt-1 text-sm text-gray-600">We&apos;ll call you back shortly to confirm a time.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 p-6">
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="name">
          Name
        </label>
        <input id="name" name="name" required className="w-full rounded-md border border-gray-300 px-3 py-2" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="phone">
            Phone
          </label>
          <input id="phone" name="phone" type="tel" required className="w-full rounded-md border border-gray-300 px-3 py-2" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input id="email" name="email" type="email" className="w-full rounded-md border border-gray-300 px-3 py-2" />
        </div>
      </div>
      <div>
        <span className="mb-1 block text-sm font-medium">Preferred days/times</span>
        <div className="grid grid-cols-2 gap-2">
          {PREFERRED_TIMES.map((t) => (
            <label key={t} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name={t} />
              {t}
            </label>
          ))}
        </div>
      </div>
      <div>
        <span className="mb-1 block text-sm font-medium">Are you a new or existing patient?</span>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name="patientStatus" value="new" defaultChecked /> New
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="patientStatus" value="existing" /> Existing
          </label>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Please don&apos;t include medical or personal details in this form — we&apos;ll discuss your needs by phone.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-brand-primary px-4 py-3 font-medium text-white disabled:opacity-50"
      >
        {submitting ? "Sending..." : "Request an Appointment"}
      </button>
    </form>
  );
}
