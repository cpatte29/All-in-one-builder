import siteConfig from "../../site.config";
import { packFor } from "@/packs/registry";
import { businessJsonLd, pageMetadata } from "@/lib/seo";
import Hero from "@/components/Hero";
import TrustStrip from "@/components/TrustStrip";
import ServiceCard from "@/components/ServiceCard";
import LocationBlock from "@/components/LocationBlock";

export function generateMetadata() {
  const pack = packFor(siteConfig.packId);
  return pageMetadata(siteConfig, "Home", pack.copy.heroSubhead(siteConfig));
}

export default function HomePage() {
  const pack = packFor(siteConfig.packId);
  const services = siteConfig.serviceLines.length > 0 ? siteConfig.serviceLines : pack.defaultServiceLines;

  return (
    <div>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: businessJsonLd(siteConfig, pack) }} />
      <Hero headline={pack.copy.heroHeadline(siteConfig)} subhead={pack.copy.heroSubhead(siteConfig)} />
      <TrustStrip items={siteConfig.trustItems} />
      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="text-xl font-semibold">Services</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <ServiceCard key={s.slug} service={s} />
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-4 pb-12">
        <LocationBlock config={siteConfig} />
      </section>
    </div>
  );
}
