/**
 * Golden regression harness (Platform Constitution, Article VI / Article XI).
 *
 * Runs a fixed set of generic (non-vertical) scenarios in-process against a
 * disposable seeded database, normalizes the outputs (strips ids and
 * timestamps, keeps everything else — status strings, scores, counts,
 * generated prose), and either:
 *   - `capture`: writes the normalized bundle to tests/golden/baseline.json
 *   - `check`:   re-runs the same scenarios and diffs against that baseline
 *
 * "Backward compatible" for every implementation packet means: `check`
 * exits 0. This script must be run with DATABASE_FILE unset by the caller —
 * it manages its own disposable DB file so it never touches db/fable5.db.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(__dirname, "..");
const GOLDEN_DB = path.join(ROOT, "tests", "golden", "golden.db");
const BASELINE_FILE = path.join(ROOT, "tests", "golden", "baseline.json");

for (const f of [GOLDEN_DB, `${GOLDEN_DB}-shm`, `${GOLDEN_DB}-wal`]) {
  if (fs.existsSync(f)) fs.rmSync(f);
}
process.env.DATABASE_FILE = GOLDEN_DB;

type Json = unknown;

function normalize(value: Json): Json {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    const out: Record<string, Json> = {};
    for (const [k, v] of Object.entries(value as Record<string, Json>)) out[k] = normalize(v);
    return out;
  }
  if (typeof value === "string") {
    if (/^[a-z]+_[a-z0-9]+$/.test(value)) {
      return `<id:${value.split("_")[0]}>`;
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      return "<timestamp>";
    }
    return value;
  }
  return value;
}

async function main() {
  const mode = process.argv[2];
  if (mode !== "capture" && mode !== "check") {
    console.error("Usage: tsx scripts/golden.ts <capture|check>");
    process.exit(2);
  }

  // Dynamic imports: must happen after DATABASE_FILE is set, since db.ts
  // reads it at module-load time.
  const {
    runClientProfileLoop,
    runBusinessDiagnosisLoop,
    runPackageRecommendationLoop,
    runProjectScopeLoop,
    runTaskGenerationLoop,
    runClaudeBuildLoop,
    runQualityReviewLoop,
    runClientUpdateLoop,
    runLeadCaptureLoop,
    runBusinessPainLoop,
    runOfferMatchLoop,
    runProposalGenerationLoop,
    runFollowUpEmailLoop,
    runCloseProbabilityLoop,
  } = await import("../src/lib/loops");
  const { db, nowIso } = await import("../src/lib/db");
  const { computeOverseerSnapshot } = await import("../src/lib/overseer/engine");
  const { PACKAGE_CATALOG } = await import("../src/lib/packages");

  const results: Record<string, Json> = {};

  // Seed the package catalog (loops depend on it existing) without pulling
  // in the rest of db/seed.ts's sample clients/leads — golden scenarios
  // create their own fixtures below.
  const insertPackage = db.prepare(
    `INSERT INTO packages (id, name, tier, description, price_range, deliverables_json, timeline_weeks)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  for (const p of PACKAGE_CATALOG) {
    insertPackage.run(p.id, p.name, p.tier, p.description, p.price_range, JSON.stringify(p.deliverables), p.timeline_weeks);
  }

  // --- Scenario A: generic Operations Mode chain (non-vertical business) ---
  const clientProfile = runClientProfileLoop({
    businessName: "Golden Ops Consulting",
    contactName: "Jordan Lee",
    email: "jordan@goldenops.test",
    phone: "555-010-0001",
    website: "",
    businessType: "General business consulting",
    goals: "Modernize our web presence and stop losing leads to slow follow-up.",
    painPoints: "Manual scheduling and no automated lead follow-up.",
    budgetRange: "$4,000 - $8,000",
    source: "referral",
  });
  const clientId = clientProfile.output.clientId;
  const diagnosis = runBusinessDiagnosisLoop({ clientId });
  const recommendation = runPackageRecommendationLoop({ clientId });
  const scope = runProjectScopeLoop({ clientId });
  const projectId = scope.output.projectId;
  const taskGen = runTaskGenerationLoop({ projectId });
  const firstTaskId = taskGen.output.tasks[0].id;
  const build = runClaudeBuildLoop({ taskId: firstTaskId });
  const review = runQualityReviewLoop({ taskId: firstTaskId, passed: true, reviewerNotes: "Meets spec." });
  const clientUpdate = runClientUpdateLoop({ projectId });

  results.opsChain = {
    clientProfile: clientProfile.output,
    diagnosis: diagnosis.output,
    recommendation: recommendation.output,
    scope: scope.output,
    taskGen: { taskCount: taskGen.output.tasks.length, tasks: taskGen.output.tasks },
    build: build.output,
    review: review.output,
    clientUpdate: clientUpdate.output,
  };

  // --- Scenario B: generic Sales Mode chain (HVAC, non-dental) ---
  const leadCapture = runLeadCaptureLoop({
    businessName: "Golden Leads HVAC",
    contactName: "Casey Kim",
    email: "casey@goldenleadshvac.test",
    phone: "555-010-0002",
    businessType: "HVAC contractor",
    painPoints: "We miss after-hours calls and lose the job to competitors.",
    requestedService: "New website and automated follow-up",
    budgetRange: "$9,000 - $18,000",
    urgency: "high",
    source: "in_person",
    notes: "Met at a supplier event.",
  });
  const leadId = leadCapture.output.leadId;
  const businessPain = runBusinessPainLoop({ leadId });
  const offerMatch = runOfferMatchLoop({ leadId });
  const proposalGen = runProposalGenerationLoop({ leadId });
  const proposalId = proposalGen.output.proposalId;
  const followUp = runFollowUpEmailLoop({ leadId });
  const closeProbability = runCloseProbabilityLoop({ leadId });

  results.salesChain = {
    leadCapture: leadCapture.output,
    businessPain: businessPain.output,
    offerMatch: offerMatch.output,
    proposalGen: proposalGen.output,
    followUp: followUp.output,
    closeProbability: closeProbability.output,
  };

  // --- Scenario C: proposal send + follow-up status transitions ---
  // Mirrors src/app/api/proposals/[id]/send and /api/follow-ups/[id] exactly.
  db.prepare("UPDATE proposals SET status = 'sent', sent_at = ?, updated_at = ? WHERE id = ?").run(
    nowIso(),
    nowIso(),
    proposalId
  );
  db.prepare("UPDATE leads SET status = 'proposal_sent', updated_at = ? WHERE id = ?").run(nowIso(), leadId);
  const followUpId = followUp.output.followUpId;
  db.prepare("UPDATE follow_ups SET status = 'sent', updated_at = ? WHERE id = ?").run(nowIso(), followUpId);

  const proposalAfterSend = db.prepare("SELECT status, sent_at FROM proposals WHERE id = ?").get(proposalId);
  const leadAfterSend = db.prepare("SELECT status FROM leads WHERE id = ?").get(leadId);
  const followUpAfterSend = db.prepare("SELECT status FROM follow_ups WHERE id = ?").get(followUpId);

  results.statusTransitions = {
    proposal: normalize(proposalAfterSend),
    lead: normalize(leadAfterSend),
    followUp: normalize(followUpAfterSend),
  };

  // --- Scenario D: Overseer snapshot over the resulting dataset ---
  const snapshot = computeOverseerSnapshot();
  // generatedAt is a timestamp; alerts/recs reference live ids/dates too —
  // normalize() strips those, leaving the structural/numeric shape stable.
  results.overseerSnapshot = {
    healthScore: snapshot.healthScore,
    healthLabel: snapshot.healthLabel,
    healthComponents: snapshot.healthComponents,
    alertCount: snapshot.alerts.length,
    riskCount: snapshot.risks.length,
    opportunityCount: snapshot.opportunities.length,
    recommendationCount: snapshot.recommendations.length,
    forecasts: snapshot.forecasts,
  };

  const normalized = normalize(results);

  if (mode === "capture") {
    fs.mkdirSync(path.dirname(BASELINE_FILE), { recursive: true });
    fs.writeFileSync(BASELINE_FILE, JSON.stringify(normalized, null, 2) + "\n");
    console.log(`Golden baseline captured: ${BASELINE_FILE}`);
    return;
  }

  // check
  if (!fs.existsSync(BASELINE_FILE)) {
    console.error(`No baseline at ${BASELINE_FILE}. Run "capture" first.`);
    process.exit(2);
  }
  const baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, "utf-8"));
  const current = JSON.parse(JSON.stringify(normalized));
  const baselineStr = JSON.stringify(baseline, null, 2);
  const currentStr = JSON.stringify(current, null, 2);

  if (baselineStr === currentStr) {
    console.log("Golden check PASSED — output matches baseline exactly.");
    return;
  }

  console.error("Golden check FAILED — output differs from baseline.");
  console.error("--- baseline ---");
  console.error(baselineStr);
  console.error("--- current ---");
  console.error(currentStr);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
