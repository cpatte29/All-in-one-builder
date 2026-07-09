"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = [
  {
    label: "Operations",
    items: [
      { href: "/", label: "Dashboard", icon: "◆", exact: true },
      { href: "/clients", label: "Clients", icon: "●" },
      { href: "/clients/new", label: "New Intake", icon: "+" },
      { href: "/projects", label: "Projects", icon: "▣" },
      { href: "/tasks", label: "Tasks", icon: "☑" },
      { href: "/loops", label: "Loops", icon: "↻" },
    ],
  },
  {
    label: "Sales",
    items: [
      { href: "/field", label: "Field Mode", icon: "⚡", exact: true },
      { href: "/leads", label: "Leads", icon: "●" },
      { href: "/leads/new", label: "New Lead", icon: "+" },
      { href: "/proposals", label: "Proposals", icon: "▣" },
      { href: "/follow-ups", label: "Follow-Ups", icon: "↷" },
    ],
  },
  {
    label: "System",
    items: [{ href: "/settings", label: "Settings", icon: "⚙" }],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col overflow-y-auto border-r border-ink-700 bg-ink-900">
      <div className="flex items-center gap-2 border-b border-ink-700 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
          F5
        </div>
        <div>
          <div className="text-sm font-semibold leading-tight text-ink-100">FABLE 5</div>
          <div className="text-[11px] leading-tight text-ink-400">Operations System</div>
        </div>
      </div>
      <nav className="flex-1 space-y-5 px-3 py-4">
        {SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
              {section.label}
            </div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
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
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-ink-700 px-5 py-4 text-[11px] text-ink-500">
        Loop system, not a chatbot.
      </div>
    </aside>
  );
}
