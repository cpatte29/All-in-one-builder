"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Dashboard", icon: "◆" },
  { href: "/clients", label: "Clients", icon: "●" },
  { href: "/clients/new", label: "New Intake", icon: "+" },
  { href: "/projects", label: "Projects", icon: "▣" },
  { href: "/tasks", label: "Tasks", icon: "☑" },
  { href: "/loops", label: "Loops", icon: "↻" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-ink-700 bg-ink-900">
      <div className="flex items-center gap-2 border-b border-ink-700 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
          F5
        </div>
        <div>
          <div className="text-sm font-semibold leading-tight text-ink-100">FABLE 5</div>
          <div className="text-[11px] leading-tight text-ink-400">Operations System</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-brand-500/15 text-brand-300"
                  : "text-ink-300 hover:bg-ink-800 hover:text-ink-100"
              }`}
            >
              <span className="w-4 text-center text-xs">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-ink-700 px-5 py-4 text-[11px] text-ink-500">
        Loop system, not a chatbot.
      </div>
    </aside>
  );
}
