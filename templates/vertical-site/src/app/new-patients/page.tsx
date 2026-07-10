import siteConfig from "../../../site.config";
import { packFor } from "@/packs/registry";
import { pageMetadata } from "@/lib/seo";

export function generateMetadata() {
  const pack = packFor(siteConfig.packId);
  return pageMetadata(siteConfig, "New Patients", pack.copy.newPatientsIntro(siteConfig));
}

export default function NewPatientsPage() {
  const pack = packFor(siteConfig.packId);
  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">New Patients</h1>
      <p className="mt-4 text-gray-600">{pack.copy.newPatientsIntro(siteConfig)}</p>
      <p className="mt-4 text-sm text-gray-500">
        Have a question before your visit? Call us at {siteConfig.phone} — please don&apos;t send medical details by
        form or email.
      </p>
    </section>
  );
}
