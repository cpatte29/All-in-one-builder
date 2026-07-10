import type { SiteConfig } from "./src/config/types";

/**
 * The one file a new client deployment edits. Everything the site shows —
 * name, people, hours, brand colors, service lines, trust items, review
 * link, and which content pack drives the copy/schema — comes from here.
 */
const config: SiteConfig = {
  packId: "dental",
  businessName: "Example Family Dental",
  people: [
    { name: "Dr. Jordan Ellis", role: "Lead Dentist", bio: "15+ years serving the Example Falls community." },
  ],
  address: "123 Main St, Example Falls, ST 00000",
  city: "Example Falls",
  hours: "Mon–Fri 8am–5pm",
  phone: "(555) 555-0100",
  brandHues: { primary: "#2563eb", secondary: "#0891b2" },
  serviceLines: [], // empty -> pack.defaultServiceLines is used
  trustItems: ["20+ years in practice", "Most insurance accepted", "New patients welcome"],
  reviewUrl: "https://g.page/example-family-dental/review",
  notifyEmail: "front-desk@example-family-dental.test",
};

export default config;
