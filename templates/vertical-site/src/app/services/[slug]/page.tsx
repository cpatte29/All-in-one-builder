import { notFound } from "next/navigation";
import siteConfig from "../../../../site.config";
import { packFor } from "@/packs/registry";
import { pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  const pack = packFor(siteConfig.packId);
  const services = siteConfig.serviceLines.length > 0 ? siteConfig.serviceLines : pack.defaultServiceLines;
  return services.map((s) => ({ slug: s.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const pack = packFor(siteConfig.packId);
  const services = siteConfig.serviceLines.length > 0 ? siteConfig.serviceLines : pack.defaultServiceLines;
  const service = services.find((s) => s.slug === params.slug);
  return pageMetadata(siteConfig, service?.name ?? "Service", service?.summary ?? "");
}

export default function ServiceDetailPage({ params }: { params: { slug: string } }) {
  const pack = packFor(siteConfig.packId);
  const services = siteConfig.serviceLines.length > 0 ? siteConfig.serviceLines : pack.defaultServiceLines;
  const service = services.find((s) => s.slug === params.slug);
  if (!service) notFound();

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">{service.name}</h1>
      <p className="mt-4 text-gray-600">{service.summary}</p>
    </section>
  );
}
