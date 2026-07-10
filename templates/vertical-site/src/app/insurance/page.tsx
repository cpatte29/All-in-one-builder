import siteConfig from "../../../site.config";
import { packFor } from "@/packs/registry";
import { pageMetadata } from "@/lib/seo";

export function generateMetadata() {
  const pack = packFor(siteConfig.packId);
  return pageMetadata(siteConfig, "Insurance & Financing", pack.copy.insuranceIntro(siteConfig));
}

export default function InsurancePage() {
  const pack = packFor(siteConfig.packId);
  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">Insurance & Financing</h1>
      <p className="mt-4 text-gray-600">{pack.copy.insuranceIntro(siteConfig)}</p>
      <p className="mt-4 text-sm text-gray-500">
        Call {siteConfig.phone} to confirm your specific plan — we&apos;re happy to check before your visit.
      </p>
      {pack.copy.membershipPlanNote && (
        <details className="mt-6 rounded-lg border border-gray-200 p-4">
          <summary className="cursor-pointer font-medium">No insurance? Ask about our membership plan.</summary>
          <p className="mt-2 text-sm text-gray-600">{pack.copy.membershipPlanNote(siteConfig)}</p>
        </details>
      )}
    </section>
  );
}
