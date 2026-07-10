// Every practice-specific fact the site needs lives in one config object of
// this shape (populated by site.config.ts at the template root). Nothing
// vertical-specific belongs here — that's the pack's job (src/packs/types.ts).

export interface Person {
  name: string;
  role: string;
  bio: string;
}

export interface ServiceLine {
  slug: string;
  name: string;
  summary: string;
}

export interface SiteConfig {
  /** Which pack (src/packs/registry.ts) supplies this site's copy, schema type, and default service lines. */
  packId: string;
  businessName: string;
  people: Person[];
  address: string;
  city: string;
  hours: string;
  phone: string;
  brandHues: { primary: string; secondary: string };
  /** Leave empty to use the pack's defaultServiceLines. */
  serviceLines: ServiceLine[];
  trustItems: string[];
  reviewUrl: string;
  /** Where the base's lead-capture form notifies on a new submission. */
  notifyEmail: string;
}
