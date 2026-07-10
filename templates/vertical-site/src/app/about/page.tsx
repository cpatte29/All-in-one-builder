import siteConfig from "../../../site.config";
import { packFor } from "@/packs/registry";
import { pageMetadata } from "@/lib/seo";

export function generateMetadata() {
  const pack = packFor(siteConfig.packId);
  return pageMetadata(siteConfig, "About", pack.copy.aboutIntro(siteConfig));
}

export default function AboutPage() {
  const pack = packFor(siteConfig.packId);
  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">About {siteConfig.businessName}</h1>
      <p className="mt-4 text-gray-600">{pack.copy.aboutIntro(siteConfig)}</p>
      <div className="mt-8 space-y-6">
        {siteConfig.people.map((person) => (
          <div key={person.name}>
            <div className="font-semibold">
              {person.name} — {person.role}
            </div>
            <p className="mt-1 text-sm text-gray-600">{person.bio}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
