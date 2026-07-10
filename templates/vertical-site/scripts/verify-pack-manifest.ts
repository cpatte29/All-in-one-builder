/**
 * Verification script for Packet 03 (Vertical Site Template base + dental pack).
 *
 * Proves: a synthetic fixture pack satisfies PackManifest and works
 * through the registry with zero base edits (the framework claim), the
 * real dental pack is correctly registered, and the leadStore adapter
 * round-trips a submission.
 *
 * Run: tsx scripts/verify-pack-manifest.ts
 */
import fs from "node:fs";
import path from "node:path";

let failures = 0;
function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  PASS  ${message}`);
  } else {
    console.error(`  FAIL  ${message}`);
    failures += 1;
  }
}

async function main() {
  const { registerPack, packFor, __resetPackRegistryForTests } = await import("../src/packs/registry");
  const dentalModule = await import("../packs/dental/pack");

  console.log("Real dental pack:");
  const dental = dentalModule.default;
  assert(dental.id === "dental", `dental pack id is "dental" (got "${dental.id}")`);
  assert(dental.schemaType === "Dentist", `dental pack schemaType is "Dentist" (got "${dental.schemaType}")`);
  assert(dental.defaultServiceLines.length > 0, "dental pack declares default service lines");
  assert(packFor("dental") === dental, "dental pack is registered and retrievable via packFor()");

  console.log("\nSynthetic fixture pack (proves a new vertical needs zero base edits):");
  __resetPackRegistryForTests();
  const fixturePack = {
    id: "fixture-vertical",
    schemaType: "LocalBusiness",
    defaultServiceLines: [{ slug: "fixture-service", name: "Fixture Service", summary: "A fixture service." }],
    copy: {
      heroHeadline: () => "Fixture headline",
      heroSubhead: () => "Fixture subhead",
      newPatientsIntro: () => "Fixture new-patient intro",
      insuranceIntro: () => "Fixture insurance intro",
      aboutIntro: () => "Fixture about intro",
    },
  };
  registerPack(fixturePack);
  assert(packFor("fixture-vertical") === fixturePack, "a synthetic pack satisfying PackManifest registers and resolves through the same registry");
  assert(
    packFor("fixture-vertical").copy.heroHeadline({} as never) === "Fixture headline",
    "fixture pack's copy functions execute through the generic contract"
  );

  console.log("\nLead store adapter round-trip:");
  const { localFileLeadStore, readAllLeads } = await import("../src/lib/leadStore");
  const leadsFile = path.join(process.cwd(), "leads.json");
  if (fs.existsSync(leadsFile)) fs.rmSync(leadsFile);

  await localFileLeadStore.save({
    name: "Verify Fixture",
    phone: "555-0100",
    email: "fixture@example.test",
    preferredTimes: ["Weekday mornings"],
    patientStatus: "new",
    submittedAt: new Date().toISOString(),
  });
  const leads = readAllLeads();
  assert(leads.length === 1 && leads[0].name === "Verify Fixture", "a saved lead round-trips through the local file adapter");
  assert(
    !("healthNotes" in leads[0]) && !("procedure" in leads[0]),
    "the persisted lead record carries no health-related field (only the LeadRequest shape exists to write)"
  );
  fs.rmSync(leadsFile);

  console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
