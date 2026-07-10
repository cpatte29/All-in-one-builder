/**
 * Verification script for Packet 05 (Proposal Framing Engine + dental
 * framing pack).
 *
 * Three scenarios, each run in its own fresh process (db.ts caches its
 * connection per-process via a global, and ESM's module cache can't be
 * reset mid-process — so "fresh DB" here means "fresh process", not just
 * a new file path):
 *   1. With a delivered dental client seeded -> all five framing sections
 *      present, proofPoint populated.
 *   2. With no delivered dental client -> proofPoint cleanly omitted.
 *   3. A synthetic fixture profile proving buildFraming() is
 *      industry-independent.
 *
 * Run: tsx scripts/verify-proposal-framing.ts
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(__dirname, "..");
const scenarioArg = process.argv.find((a) => a.startsWith("--scenario="));

let failures = 0;
function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  PASS  ${message}`);
  } else {
    console.error(`  FAIL  ${message}`);
    failures += 1;
  }
}

function resetDb(dbPath: string) {
  for (const f of [dbPath, `${dbPath}-shm`, `${dbPath}-wal`]) {
    if (fs.existsSync(f)) fs.rmSync(f);
  }
  process.env.DATABASE_FILE = dbPath;
}

async function seedPackages() {
  const { db } = await import("../src/lib/db");
  const { PACKAGE_CATALOG } = await import("../src/lib/packages");
  const insert = db.prepare(
    `INSERT INTO packages (id, name, tier, description, price_range, deliverables_json, timeline_weeks)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  for (const p of PACKAGE_CATALOG) {
    insert.run(p.id, p.name, p.tier, p.description, p.price_range, JSON.stringify(p.deliverables), p.timeline_weeks);
  }
}

async function runDentalLeadThroughProposal() {
  const { runLeadCaptureLoop, runBusinessPainLoop, runOfferMatchLoop, runProposalGenerationLoop } = await import(
    "../src/lib/loops"
  );
  const leadCapture = runLeadCaptureLoop({
    businessName: "Willow Creek Dental",
    contactName: "Dr. Pat Nguyen",
    businessType: "dental practice",
    painPoints: "We have a lot of no-show appointments and patients who haven't been back in years.",
    requestedService: "A new website and automated recall reminders",
    urgency: "high",
  });
  const leadId = leadCapture.output.leadId;
  runBusinessPainLoop({ leadId });
  runOfferMatchLoop({ leadId });
  return runProposalGenerationLoop({ leadId });
}

async function scenario1WithProofPoint() {
  console.log("Scenario 1: with a delivered dental client seeded (proof point should populate):");
  resetDb(path.join(ROOT, "tests", "golden", "framing-with-proof.db"));
  const { db, newId, nowIso } = await import("../src/lib/db");
  await seedPackages();

  const deliveredClientId = newId("client");
  db.prepare(
    `INSERT INTO clients (id, business_name, contact_name, email, industry, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'Dental', 'delivered', ?, ?)`
  ).run(deliveredClientId, "Proof Point Dental", "Dr. Proof Point", "proof@example.test", nowIso(), nowIso());

  const proposalGen = await runDentalLeadThroughProposal();
  const scope = proposalGen.output.scope;

  assert(typeof scope.positioning === "string" && (scope.positioning as string).length > 0, "scope.positioning is present");
  assert(
    /no-show|recall/i.test(scope.positioning as string),
    `scope.positioning interpolates a real captured pain point (got "${scope.positioning}")`
  );
  assert(
    scope.proofPoint === "We recently delivered a similar project for Proof Point Dental.",
    `scope.proofPoint cites the delivered dental client (got "${scope.proofPoint}")`
  );
  assert(
    !!scope.carePlan && (scope.carePlan as { name: string }).name === "Dental Care Plan",
    `scope.carePlan is the Dental Care Plan (got ${JSON.stringify(scope.carePlan)})`
  );
  assert(Array.isArray(scope.complianceFaq) && (scope.complianceFaq as string[]).length > 0, "scope.complianceFaq is present");
  assert(
    proposalGen.output.nextStep.includes("same-week"),
    `high-urgency lead gets the same-week next step (got "${proposalGen.output.nextStep}")`
  );

  const row = db.prepare("SELECT scope_json FROM proposals WHERE id = ?").get(proposalGen.output.proposalId) as {
    scope_json: string;
  };
  const persisted = JSON.parse(row.scope_json);
  assert(
    persisted.proofPoint === scope.proofPoint && !!persisted.carePlan && !!persisted.complianceFaq,
    "the persisted proposals row carries the same framing sections"
  );
}

async function scenario2WithoutProofPoint() {
  console.log("Scenario 2: with no delivered dental client (proof point should be cleanly omitted):");
  resetDb(path.join(ROOT, "tests", "golden", "framing-without-proof.db"));
  await seedPackages();
  const proposalGen = await runDentalLeadThroughProposal();
  const scope = proposalGen.output.scope;
  assert(
    scope.proofPoint === undefined,
    `scope.proofPoint is omitted when no delivered dental client exists (got ${JSON.stringify(scope.proofPoint)})`
  );
  assert(typeof scope.positioning === "string" && (scope.positioning as string).length > 0, "scope.positioning still renders");
  assert(!!scope.carePlan, "scope.carePlan still renders");
  assert(!!scope.complianceFaq, "scope.complianceFaq still renders");
}

async function scenario3FixtureProfile() {
  console.log("Scenario 3: synthetic fixture profile (buildFraming is industry-independent):");
  resetDb(path.join(ROOT, "tests", "golden", "framing-fixture.db"));
  await seedPackages();
  const { buildFraming, buildNextStep } = await import("../src/lib/proposals/framing");
  const fixtureProfile = {
    id: "fixture",
    version: 1,
    industryLabel: "Fixture Vertical",
    classification: { keywords: [], painSignals: [], recommendedFocus: [] },
    packages: { buildPackageId: "pkg_starter_site" },
    onboardingTasks: [],
    proposalFraming: {
      positioning: (ctx: { businessName: string }) => `Fixture positioning for ${ctx.businessName}.`,
      nextStep: (ctx: { contactName: string }) => `Fixture next step for ${ctx.contactName}.`,
      staticSections: { fixtureFaq: "Fixture static content." },
    },
  };
  const ctx = { businessName: "Fixture Co", contactName: "Fixture Contact", urgency: "medium", painPoints: [] as string[] };
  const sections = buildFraming(fixtureProfile as never, ctx);
  assert(sections.positioning === "Fixture positioning for Fixture Co.", "fixture positioning renders through the generic engine");
  assert(sections.fixtureFaq === "Fixture static content.", "fixture static section merges through the generic engine");
  assert(
    buildNextStep(fixtureProfile as never, ctx) === "Fixture next step for Fixture Contact.",
    "fixture nextStep renders through the generic engine"
  );
}

async function runAsChild() {
  if (scenarioArg === "--scenario=1") await scenario1WithProofPoint();
  else if (scenarioArg === "--scenario=2") await scenario2WithoutProofPoint();
  else if (scenarioArg === "--scenario=3") await scenario3FixtureProfile();
  process.exit(failures === 0 ? 0 : 1);
}

function runAsOrchestrator() {
  let anyFailed = false;
  for (const n of [1, 2, 3]) {
    try {
      execFileSync("npx", ["tsx", __filename, `--scenario=${n}`], { stdio: "inherit", cwd: ROOT });
    } catch {
      anyFailed = true;
    }
    console.log("");
  }
  console.log(anyFailed ? "SOME SCENARIOS FAILED" : "ALL CHECKS PASSED");
  process.exit(anyFailed ? 1 : 0);
}

if (scenarioArg) {
  runAsChild();
} else {
  runAsOrchestrator();
}
