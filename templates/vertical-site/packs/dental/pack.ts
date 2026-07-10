import { registerPack } from "../../src/packs/registry";
import type { PackManifest } from "../../src/packs/types";

/**
 * The dental content pack: copy, schema type, and default service lines
 * for a dental practice. Copy is deliberately conservative — no outcome
 * guarantees, no "painless," no before/after photos by default, per state
 * dental-advertising rules. This is the only place in the template that
 * knows what a dental practice is; the base (src/) never does.
 */
const dentalPack: PackManifest = {
  id: "dental",
  schemaType: "Dentist",
  defaultServiceLines: [
    {
      slug: "implants",
      name: "Dental Implants",
      summary: "A permanent option for replacing missing teeth. We'll walk you through whether you're a candidate.",
    },
    {
      slug: "clear-aligners",
      name: "Clear Aligners",
      summary: "Straighten your smile with a discreet, removable aligner system.",
    },
    {
      slug: "cosmetic-dentistry",
      name: "Cosmetic Dentistry",
      summary: "Whitening, bonding, and veneer options to help you feel confident in your smile.",
    },
    {
      slug: "general-hygiene",
      name: "General & Preventive Care",
      summary: "Routine cleanings, exams, and preventive care to keep your smile healthy.",
    },
  ],
  copy: {
    heroHeadline: (config) => `Your smile, taken care of — right here in ${config.city}`,
    heroSubhead: () => "New patients welcome. Most insurance accepted. Same-week appointments often available.",
    newPatientsIntro: (config) =>
      `We know starting with a new dental practice can feel like a big step. At ${config.businessName}, our team will walk you through what to expect, help you understand your coverage, and get you scheduled at a time that works for you.`,
    insuranceIntro: (config) =>
      `${config.businessName} works with most major dental insurance plans and offers financing options for treatment not fully covered by insurance.`,
    membershipPlanNote: (config) =>
      `If you don't have dental insurance, ${config.businessName} offers an in-house membership plan covering routine cleanings and exams at a flat annual rate — ask our front desk for details.`,
    aboutIntro: (config) => `${config.businessName} has been serving the ${config.city} community with modern, patient-focused dental care.`,
  },
};

registerPack(dentalPack);

export default dentalPack;
