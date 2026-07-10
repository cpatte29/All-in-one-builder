/**
 * Verification script for Packet 00 (Vertical Profile Engine).
 *
 * Registers the synthetic fixture profile (never used in production) and
 * proves all four generic hooks work for an arbitrary industry:
 *   1. detection routes classification to the profile
 *   2. the profile's package is selected (ops + sales paths)
 *   3. its onboarding tasks prepend during task generation
 *   4. its static proposal-framing sections merge into scope_json
 *
 * Run: tsx scripts/verify-vertical-engine.ts
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(__dirname, "..");
const FIXTURE_DB = path.join(ROOT, "tests", "golden", "fixture.db");

for (const f of [FIXTURE_DB, `${FIXTURE_DB}-shm`, `${FIXTURE_DB}-wal`]) {
  if (fs.existsSync(f)) fs.rmSync(f);
}
process.env.DATABASE_FILE = FIXTURE_DB;

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
  const { db } = await import("../src/lib/db");
  const { PACKAGE_CATALOG } = await import("../src/lib/packages");
  const { registerProfile, __resetRegistryForTests } = await import("../src/lib/verticals");
  const { createTestProfile } = await import("../src/lib/verticals/__fixtures__/testProfile");
  const {
    runClientProfileLoop,
    runBusinessDiagnosisLoop,
    runPackageRecommendationLoop,
    runProjectScopeLoop,
    runTaskGenerationLoop,
    runLeadCaptureLoop,
    runBusinessPainLoop,
    runOfferMatchLoop,
    runProposalGenerationLoop,
  } = await import("../src/lib/loops");

  // Seed the generic catalog plus one fixture package.
  const insertPackage = db.prepare(
    `INSERT INTO packages (id, name, tier, description, price_range, deliverables_json, timeline_weeks)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  for (const p of PACKAGE_CATALOG) {
    insertPackage.run(p.id, p.name, p.tier, p.description, p.price_range, JSON.stringify(p.deliverables), p.timeline_weeks);
  }
  insertPackage.run(
    "pkg_test_vertical_fixture",
    "Fixture Package",
    "growth",
    "Synthetic package for engine verification only.",
    "$1 - $1",
    JSON.stringify(["Fixture deliverable"]),
    1
  );

  __resetRegistryForTests();
  registerProfile(createTestProfile());

  console.log("Ops-side path (classification -> package recommendation -> onboarding tasks):");

  const clientProfile = runClientProfileLoop({
    businessName: "Zzzfixturekeyword Test Co",
    contactName: "Fixture Contact",
    email: "fixture@example.test",
    businessType: "zzzfixturekeyword operator",
    goals: "zzzpain everywhere",
    painPoints: "zzzpain everywhere",
  });
  const clientId = clientProfile.output.clientId;

  const diagnosis = runBusinessDiagnosisLoop({ clientId });
  assert(diagnosis.output.industry === "Test Vertical", `diagnosis.industry === "Test Vertical" (got ${diagnosis.output.industry})`);
  assert(
    diagnosis.output.painPoints.includes("Fixture pain signal"),
    `diagnosis.painPoints includes "Fixture pain signal" (got ${JSON.stringify(diagnosis.output.painPoints)})`
  );
  assert(
    diagnosis.output.recommendedFocus.includes("Fixture focus area"),
    `diagnosis.recommendedFocus includes "Fixture focus area" (got ${JSON.stringify(diagnosis.output.recommendedFocus)})`
  );

  const recommendation = runPackageRecommendationLoop({ clientId });
  assert(
    recommendation.output.packageId === "pkg_test_vertical_fixture",
    `recommendation.packageId === "pkg_test_vertical_fixture" (got ${recommendation.output.packageId})`
  );

  const scope = runProjectScopeLoop({ clientId });
  const taskGen = runTaskGenerationLoop({ projectId: scope.output.projectId });
  assert(
    taskGen.output.tasks[0]?.title === "Fixture onboarding task" && taskGen.output.tasks[0]?.category === "Onboarding",
    `first generated task is the fixture onboarding task (got ${JSON.stringify(taskGen.output.tasks[0])})`
  );
  // 1 onboarding task (replaces the generic 2-task setup default) + 1 task
  // derived from the fixture package's single deliverable.
  assert(taskGen.output.tasks.length === 2, `fixture onboarding task replaces the generic setup tasks (got ${taskGen.output.tasks.length} tasks)`);

  console.log("\nSales-side path (business pain -> offer match -> proposal framing):");

  const leadCapture = runLeadCaptureLoop({
    businessName: "Zzzfixturekeyword Leads Co",
    contactName: "Fixture Lead Contact",
    businessType: "zzzfixturekeyword operator",
    // businessPain.ts's own pain-scoring path (scorePain) detects the
    // profile from pain_points + requestedService specifically, not from
    // businessName/businessType — so the fixture keyword must appear here
    // too, not just in businessType.
    painPoints: "zzzfixturekeyword zzzpain constantly",
    requestedService: "zzzpain relief",
  });
  const leadId = leadCapture.output.leadId;

  const businessPain = runBusinessPainLoop({ leadId });
  assert(businessPain.output.industry === "Test Vertical", `businessPain.industry === "Test Vertical" (got ${businessPain.output.industry})`);
  assert(
    businessPain.output.painPoints.includes("Fixture pain signal"),
    `businessPain.painPoints includes "Fixture pain signal" (got ${JSON.stringify(businessPain.output.painPoints)})`
  );

  const offerMatch = runOfferMatchLoop({ leadId });
  assert(
    offerMatch.output.packageId === "pkg_test_vertical_fixture",
    `offerMatch.packageId === "pkg_test_vertical_fixture" (got ${offerMatch.output.packageId})`
  );

  const proposalGen = runProposalGenerationLoop({ leadId });
  assert(
    (proposalGen.output.scope as Record<string, unknown>).fixtureFaq === "Fixture static section content.",
    `proposal scope includes the fixture's static section (got ${JSON.stringify(proposalGen.output.scope)})`
  );

  console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
