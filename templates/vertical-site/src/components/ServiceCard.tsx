import Link from "next/link";
import type { ServiceLine } from "@/config/types";

export default function ServiceCard({ service }: { service: ServiceLine }) {
  return (
    <Link
      href={`/services/${service.slug}`}
      className="block rounded-lg border border-gray-200 p-5 hover:border-brand-primary"
    >
      <h3 className="font-semibold">{service.name}</h3>
      <p className="mt-1 text-sm text-gray-600">{service.summary}</p>
    </Link>
  );
}
