import Link from "next/link";
import type { Alert } from "@/lib/overseer/types";

const SEVERITY_STYLE: Record<Alert["severity"], string> = {
  critical: "border-rose-500/40 bg-rose-500/10 text-rose-300",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  info: "border-sky-500/40 bg-sky-500/10 text-sky-300",
};

export default function AlertList({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) {
    return <p className="text-sm text-ink-500">No active alerts.</p>;
  }
  return (
    <div className="space-y-2">
      {alerts.map((a) => (
        <Link
          key={a.id}
          href={a.href}
          className={`block rounded-lg border px-3 py-2 text-sm hover:opacity-90 ${SEVERITY_STYLE[a.severity]}`}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium">{a.title}</span>
            <span className="shrink-0 text-[10px] uppercase tracking-wide opacity-80">{a.severity}</span>
          </div>
          <div className="mt-0.5 text-xs opacity-90">{a.detail}</div>
        </Link>
      ))}
    </div>
  );
}
