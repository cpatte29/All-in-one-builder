import type { ServiceLine, SiteConfig } from "@/config/types";

/**
 * The contract a vertical content pack implements. This file is the
 * framework claim of Packet 03: a new vertical is a new module satisfying
 * this interface, never a base-code change. Nothing here or in
 * registry.ts may name a specific industry.
 */
export interface PackManifest {
  id: string;
  /** schema.org @type for the JSON-LD emitted on the home page (e.g. "Dentist", "MedicalBusiness"). */
  schemaType: string;
  /** Used when the active SiteConfig.serviceLines is empty. */
  defaultServiceLines: ServiceLine[];
  copy: {
    heroHeadline: (config: SiteConfig) => string;
    heroSubhead: (config: SiteConfig) => string;
    newPatientsIntro: (config: SiteConfig) => string;
    insuranceIntro: (config: SiteConfig) => string;
    /** Optional: an in-house membership/loyalty plan note, shown behind a toggle on the insurance page when present. */
    membershipPlanNote?: (config: SiteConfig) => string;
    aboutIntro: (config: SiteConfig) => string;
  };
}
