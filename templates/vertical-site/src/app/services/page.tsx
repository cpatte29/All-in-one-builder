import siteConfig from "../../../site.config";
import { packFor } from "@/packs/registry";
import { pageMetadata } from "@/lib/seo";
import ServiceCard from "@/components/ServiceCard";

export function generateMetadata() {
  return pageMetadata(siteConfig, "Services", `Services offered at ${siteConfig.businessName}.`);
}

export default function ServicesIndexPage() {
  const pack = packFor(siteConfig.packId);
  const services = siteConfig.serviceLines.length > 0 ? siteConfig.serviceLines : pack.defaultServiceLines;

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-bold">Services</h1>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <ServiceCard key={s.slug} service={s} />
        ))}
      </div>
    </section>
  );
}
