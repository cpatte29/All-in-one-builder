"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoopActionButton({
  endpoint,
  label,
  loadingLabel,
  variant = "primary",
  body,
}: {
  endpoint: string;
  label: string;
  loadingLabel?: string;
  variant?: "primary" | "secondary";
  body?: Record<string, unknown>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Loop failed");
      }
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button onClick={run} disabled={loading} className={variant === "primary" ? "btn-primary" : "btn-secondary"}>
        {loading ? loadingLabel || "Running..." : label}
      </button>
      {error && <span className="text-xs text-rose-400">{error}</span>}
    </div>
  );
}
