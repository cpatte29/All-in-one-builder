import type { Metadata } from "next";
import type { SiteConfig } from "@/config/types";
import type { PackManifest } from "@/packs/types";

/** Local-SEO-sensible page title: "{Service} in {city} — {business}". */
export function pageMetadata(config: SiteConfig, pageTitle: string, description: string): Metadata {
  return {
    title: `${pageTitle} in ${config.city} — ${config.businessName}`,
    description,
  };
}

/** JSON-LD for the home page, typed by the active pack's schemaType. */
export function businessJsonLd(config: SiteConfig, pack: PackManifest): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": pack.schemaType,
    name: config.businessName,
    address: config.address,
    telephone: config.phone,
    openingHours: config.hours,
  });
}
