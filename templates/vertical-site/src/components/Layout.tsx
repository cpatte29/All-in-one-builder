import Link from "next/link";
import type { SiteConfig } from "@/config/types";
import ClickToCall from "./ClickToCall";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/new-patients", label: "New Patients" },
  { href: "/insurance", label: "Insurance & Financing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Layout({ config, children }: { config: SiteConfig; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="text-lg font-semibold">
            {config.businessName}
          </Link>
          <nav className="flex flex-wrap gap-4 text-sm">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-brand-primary">
                {item.label}
              </Link>
            ))}
          </nav>
          <ClickToCall phone={config.phone} />
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-gray-200 py-6 text-center text-sm text-gray-500">
        <p>
          {config.businessName} · {config.address} · <ClickToCall phone={config.phone} />
        </p>
        <p className="mt-1">{config.hours}</p>
      </footer>
    </div>
  );
}
