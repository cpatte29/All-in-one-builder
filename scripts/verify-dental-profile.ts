/**
 * Verification script for Packet 01 (Dental Profile v1).
 *
 * Exercises the real, production-registered dental profile end to end —
 * distinct from scripts/verify-vertical-engine.ts, which only proves the
 * engine with a synthetic fixture. Uses its own disposable database so it
 * never touches golden.ts's frozen generic baseline (Platform Constitution,
 * Article XI — "new files, never edits to generic baselines").
 *
 * Run: tsx scripts/verify-dental-profile.ts
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(__dirname, "..");
const DENTAL_DB = path.join(ROOT, "tests", "golden", "dental.db");

for (const f of [DENTAL_DB, `${DENTAL_DB}-shm`, `${DENTAL_DB}-wal`]) {
  if (fs.existsSync(f)) fs.rmSync(f);
}
process.env.DATABASE_FILE = DENTAL_DB;

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
  const { runLeadCaptureLoop, runBusinessPainLoop, runOfferMatchLoop } = await import("../src/lib/loops");

  const insertPackage = db.prepare(
    `INSERT INTO packages (id, name, tier, description, price_range, deliverables_json, timeline_weeks)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  for (const p of PACKAGE_CATALOG) {
    insertPackage.run(p.id, p.name, p.tier, p.description, p.price_range, JSON.stringify(p.deliverables), p.timeline_weeks);
  }

  console.log("Sales-side dental capture (Field Mode shape: businessType 'dental practice'):");

  const leadCapture = runLeadCaptureLoop({
    businessName: "Sunrise Family Dental",
    contactName: "Dr. Alex Rivera",
    email: "alex@sunrisefamilydental.test",
    businessType: "dental practice",
    painPoints: "We have a lot of no-show appointments and patients who haven't been back in years.",
    requestedService: "A new website and automated recall reminders",
    budgetRange: "$6,000 - $12,000",
    urgency: "medium",
    source: "in_person",
  });
  const leadId = leadCapture.output.leadId;

  const diagnosis = runBusinessPainLoop({ leadId });
  assert(diagnosis.output.industry === "Dental", `diagnosis.industry === "Dental" (got ${diagnosis.output.industry})`);
  assert(
    diagnosis.output.painPoints.includes("No-show and open-slot leakage"),
    `diagnosis.painPoints includes "No-show and open-slot leakage" (got ${JSON.stringify(diagnosis.output.painPoints)})`
  );
  assert(
    diagnosis.output.painPoints.includes("Recall / reactivation lapse"),
    `diagnosis.painPoints includes "Recall / reactivation lapse" (got ${JSON.stringify(diagnosis.output.painPoints)})`
  );
  assert(
    diagnosis.output.recommendedFocus.includes("New-patient conversion website"),
    `diagnosis.recommendedFocus includes "New-patient conversion website" (got ${JSON.stringify(diagnosis.output.recommendedFocus)})`
  );

  const offerMatch = runOfferMatchLoop({ leadId });
  assert(
    offerMatch.output.packageId === "pkg_dental_practice",
    `offerMatch.packageId === "pkg_dental_practice" (got ${offerMatch.output.packageId})`
  );
  assert(
    offerMatch.output.rationale.includes("Dental"),
    `offerMatch.rationale cites the industry (got "${offerMatch.output.rationale}")`
  );

  console.log("\nControl: a non-dental keyword must not match the dental profile:");
  const controlLead = runLeadCaptureLoop({
    businessName: "Golden Gate Roofing",
    contactName: "Sam Reyes",
    businessType: "Roofing contractor",
    painPoints: "We miss calls after hours.",
    requestedService: "New website",
    urgency: "medium",
  });
  const controlDiagnosis = runBusinessPainLoop({ leadId: controlLead.output.leadId });
  assert(
    controlDiagnosis.output.industry !== "Dental",
    `non-dental lead does not classify as Dental (got ${controlDiagnosis.output.industry})`
  );

  console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
