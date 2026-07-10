import siteConfig from "../../../site.config";
import { pageMetadata } from "@/lib/seo";
import LeadForm from "@/components/LeadForm";
import LocationBlock from "@/components/LocationBlock";

export function generateMetadata() {
  return pageMetadata(siteConfig, "Contact", `Request an appointment with ${siteConfig.businessName}.`);
}

export default function ContactPage() {
  return (
    <section className="mx-auto grid max-w-4xl grid-cols-1 gap-8 px-4 py-12 md:grid-cols-2">
      <div>
        <h1 className="text-2xl font-bold">Request an Appointment</h1>
        <div className="mt-6">
          <LeadForm />
        </div>
      </div>
      <div>
        <LocationBlock config={siteConfig} />
      </div>
    </section>
  );
}
