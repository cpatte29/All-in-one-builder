export default function TrustStrip({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="border-b border-gray-200 bg-white px-4 py-4">
      <ul className="mx-auto flex max-w-4xl flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-gray-600">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
