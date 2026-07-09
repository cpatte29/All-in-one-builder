export default function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="border-b border-ink-700 bg-ink-950/80 px-8 py-6 backdrop-blur">
      <h1 className="text-xl font-semibold text-ink-100">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-ink-400">{subtitle}</p>}
    </header>
  );
}
