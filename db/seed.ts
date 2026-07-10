/**
 * Seeds db/fable5.db with the package catalog and two sample clients:
 * one carried all the way through the pipeline (delivered), one left
 * mid-pipeline (freshly profiled) so the dashboard shows a realistic mix.
 *
 * Run with: npm run db:seed
 */
import { db, newId, nowIso } from "../src/lib/db";
import { PACKAGE_CATALOG } from "../src/lib/packages";

function logActivity(entityType: string, entityId: string, action: string, message: string) {
  db.prepare(
    `INSERT INTO activity_log (id, entity_type, entity_id, action, message) VALUES (?, ?, ?, ?, ?)`
  ).run(newId("act"), entityType, entityId, action, message);
}

function logSalesActivity(entityType: string, entityId: string, action: string, message: string) {
  db.prepare(
    `INSERT INTO sales_activity (id, entity_type, entity_id, action, message) VALUES (?, ?, ?, ?, ?)`
  ).run(newId("sact"), entityType, entityId, action, message);
}

function logLoop(
  loopType: string,
  ids: { clientId?: string; projectId?: string; taskId?: string; leadId?: string; proposalId?: string },
  input: unknown,
  output: unknown
) {
  db.prepare(
    `INSERT INTO loops (id, loop_type, client_id, project_id, task_id, lead_id, proposal_id, status, input_json, output_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)`
  ).run(
    newId("loop"),
    loopType,
    ids.clientId ?? null,
    ids.projectId ?? null,
    ids.taskId ?? null,
    ids.leadId ?? null,
    ids.proposalId ?? null,
    JSON.stringify(input),
    JSON.stringify(output)
  );
}

function clearAll() {
  const tables = [
    "sales_activity",
    "follow_ups",
    "proposals",
    "conversations",
    "leads",
    "activity_log",
    "loops",
    "notes",
    "tasks",
    "projects",
    "clients",
    "packages",
  ];
  for (const t of tables) db.prepare(`DELETE FROM ${t}`).run();
}

function seedPackages() {
  const insert = db.prepare(
    `INSERT INTO packages (id, name, tier, description, price_range, deliverables_json, timeline_weeks)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  for (const p of PACKAGE_CATALOG) {
    insert.run(p.id, p.name, p.tier, p.description, p.price_range, JSON.stringify(p.deliverables), p.timeline_weeks);
  }
  console.log(`Seeded ${PACKAGE_CATALOG.length} packages.`);
}

function seedFullyDeliveredClient() {
  const clientId = newId("client");
  const businessName = "Riverside Family Dental";
  db.prepare(
    `INSERT INTO clients
      (id, business_name, contact_name, email, phone, website, industry, business_type, business_size,
       goals, pain_points, budget_range, source, status, diagnosis_json, recommended_package_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'delivered', ?, ?, ?, ?)`
  ).run(
    clientId,
    businessName,
    "Dr. Maria Chen",
    "maria@riversidefamilydental.com",
    "(555) 234-9981",
    null,
    "Dental",
    "Dental practice",
    "Small",
    "Fill more new-patient appointment slots and stop losing leads after hours.",
    "Manual, time-consuming scheduling and missed after-hours leads.",
    "$4,000 - $8,000",
    "referral",
    JSON.stringify({
      industry: "Dental",
      businessType: "Dental practice",
      size: "Small",
      opportunityScore: 52,
      painPoints: ["No existing web presence", "Scheduling / booking friction"],
      recommendedFocus: ["Website foundation", "Lead + follow-up automation"],
    }),
    "pkg_growth_automation",
    nowIso(),
    nowIso()
  );
  logActivity("client", clientId, "client_created", `Client "${businessName}" created via intake and profiled.`);
  logLoop("client_profile", { clientId }, { businessName }, { clientId });
  logActivity("client", clientId, "diagnosed", "Diagnosed as Health & Wellness (opportunity score 52/100).");
  logLoop("business_diagnosis", { clientId }, { clientId }, { opportunityScore: 52 });
  logActivity("client", clientId, "package_recommended", "Recommending Growth + Automation Package.");
  logLoop("package_recommendation", { clientId }, { clientId }, { packageId: "pkg_growth_automation" });

  const projectId = newId("proj");
  const scope = {
    deliverables: PACKAGE_CATALOG.find((p) => p.id === "pkg_growth_automation")!.deliverables,
    timelineWeeks: 4,
    priceQuote: "$4,000 - $8,000",
    focusAreas: ["Website foundation", "Lead + follow-up automation"],
  };
  db.prepare(
    `INSERT INTO projects (id, client_id, package_id, name, status, scope_json, price_quote, timeline_weeks, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'delivered', ?, ?, ?, ?, ?)`
  ).run(
    projectId,
    clientId,
    "pkg_growth_automation",
    `${businessName} — Growth + Automation Package`,
    JSON.stringify(scope),
    scope.priceQuote,
    scope.timelineWeeks,
    nowIso(),
    nowIso()
  );
  logActivity("project", projectId, "scoped", "Project scoped: 4 deliverables, 4 week timeline, $4,000 - $8,000.");
  logLoop("project_scope", { clientId, projectId }, { clientId }, { projectId });

  const taskDefs = [
    { title: "Set up project repo and environment", category: "Setup", priority: "high" },
    { title: "Confirm brand assets (logo, colors, copy)", category: "Setup", priority: "medium" },
    { title: "Build: Redesigned/rebuilt website", category: "Web Build", priority: "high" },
    { title: "QA responsive layout for: Redesigned/rebuilt website", category: "QA", priority: "medium" },
    { title: "Configure: CRM + lead intake automation", category: "Automation", priority: "high" },
    { title: "Test end-to-end flow for: CRM + lead intake automation", category: "QA", priority: "medium" },
  ] as const;

  for (const t of taskDefs) {
    const taskId = newId("task");
    const brief = {
      taskTitle: t.title,
      context: `Client: ${businessName} (Health & Wellness). Project: ${businessName} — Growth + Automation Package. Category: ${t.category}.`,
      spec: [`Implement "${t.title}".`, `Follow the ${businessName} brand and existing project conventions.`],
      acceptanceCriteria: [
        "Feature matches the task title and description.",
        "No regressions to existing functionality in the project.",
      ],
      suggestedFiles: [],
    };
    const review = { passed: true, notes: "Meets acceptance criteria.", reviewedAt: nowIso() };

    db.prepare(
      `INSERT INTO tasks (id, project_id, title, description, category, status, priority, build_brief_json, review_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'done', ?, ?, ?, ?, ?)`
    ).run(taskId, projectId, t.title, null, t.category, t.priority, JSON.stringify(brief), JSON.stringify(review), nowIso(), nowIso());

    logLoop("claude_build", { clientId, projectId, taskId }, { taskId }, brief);
    logLoop("quality_review", { clientId, projectId, taskId }, { taskId, passed: true }, review);
    logActivity("task", taskId, "reviewed", `Quality review: PASSED — ${t.title}`);
  }
  logActivity("project", projectId, "tasks_generated", `Generated ${taskDefs.length} task cards.`);
  logLoop("task_generation", { clientId, projectId }, { projectId }, { count: taskDefs.length });

  const summary = `${businessName} — Growth + Automation Package is complete — all ${taskDefs.length} tasks delivered.`;
  db.prepare(
    `INSERT INTO notes (id, client_id, project_id, author, body, note_type, created_at) VALUES (?, ?, ?, 'system', ?, 'status_update', ?)`
  ).run(newId("note"), clientId, projectId, summary, nowIso());
  logActivity("project", projectId, "client_update", summary);
  logLoop("client_update", { clientId, projectId }, { projectId }, { summary });

  console.log(`Seeded delivered client: ${businessName}`);
}

function seedFreshClient() {
  const clientId = newId("client");
  const businessName = "Summit Peak Landscaping";
  db.prepare(
    `INSERT INTO clients
      (id, business_name, contact_name, email, phone, website, business_type,
       goals, pain_points, budget_range, source, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'profiled', ?, ?)`
  ).run(
    clientId,
    businessName,
    "Tom Reilly",
    "tom@summitpeaklandscaping.com",
    "(555) 887-2210",
    null,
    "Landscaping contractor",
    "Get a real website up and stop relying only on word of mouth.",
    "No website at all, loses leads to competitors with better online presence.",
    "$1,500 - $3,000",
    "cold_outreach",
    nowIso(),
    nowIso()
  );
  logActivity("client", clientId, "client_created", `Client "${businessName}" created via intake and profiled.`);
  logLoop("client_profile", { clientId }, { businessName }, { clientId });
  console.log(`Seeded fresh (profiled-only) client: ${businessName}`);
}

function seedHotLead() {
  const leadId = newId("lead");
  const businessName = "Bluepeak HVAC Services";
  db.prepare(
    `INSERT INTO leads
      (id, business_name, contact_name, email, phone, business_type, pain_points, requested_service,
       budget_range, urgency, source, notes, status, diagnosis_json, offer_match_json,
       close_probability, close_probability_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'high', 'in_person', ?, 'proposal_sent', ?, ?, ?, ?, ?, ?)`
  ).run(
    leadId,
    businessName,
    "Marcus Webb",
    "marcus@bluepeakhvac.com",
    "(555) 410-2287",
    "HVAC contractor",
    "Losing leads after hours, manual scheduling, no way to follow up fast enough.",
    "New website plus automated lead follow-up",
    "$9,000 - $18,000",
    "Met Marcus at the chamber of commerce mixer — ready to move fast, wants something live before peak season.",
    JSON.stringify({
      industry: "Home Services",
      businessType: "HVAC contractor",
      opportunityScore: 75,
      painScore: 80,
      painPoints: ["Lead capture / follow-up gaps", "Scheduling / booking friction", "Losing business to competitors"],
      recommendedFocus: ["Website foundation", "Lead + follow-up automation", "Internal operations tooling"],
    }),
    JSON.stringify({
      packageId: "pkg_pro_ai_ops",
      packageName: "Pro AI Ops Package",
      fitScore: 77,
      rationale: 'Opportunity score 75/100 and pain score 80/100 (fit 77/100) point to the "pro" tier — Pro AI Ops Package.',
    }),
    82,
    JSON.stringify({
      score: 82,
      breakdown: { urgency: 25, budget: 20, fit: 15, responsiveness: 12, painLevel: 10 },
      summary: "Hot lead — high urgency, strong fit, and active engagement.",
    }),
    nowIso(),
    nowIso()
  );

  logSalesActivity("lead", leadId, "lead_captured", `Lead "${businessName}" captured via in person.`);
  logLoop("lead_capture", { leadId }, { businessName }, { leadId });
  logSalesActivity("lead", leadId, "diagnosed", `Diagnosed as Home Services — pain score 80/100, opportunity score 75/100.`);
  logLoop("business_pain", { leadId }, { leadId }, { opportunityScore: 75, painScore: 80 });
  logSalesActivity("lead", leadId, "offer_matched", "Matched to Pro AI Ops Package (fit 77/100).");
  logLoop("offer_match", { leadId }, { leadId }, { packageId: "pkg_pro_ai_ops", fitScore: 77 });

  const proposalId = newId("prop");
  const pkg = PACKAGE_CATALOG.find((p) => p.id === "pkg_pro_ai_ops")!;
  const scope = { deliverables: pkg.deliverables, focusAreas: ["Website foundation", "Lead + follow-up automation"] };
  const nextStep = "Schedule a same-week call with Marcus Webb to walk through the proposal and confirm scope.";
  db.prepare(
    `INSERT INTO proposals (id, lead_id, package_name, scope_json, price_range, timeline_weeks, deliverables_json, next_step, status, sent_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'sent', ?, ?, ?)`
  ).run(
    proposalId,
    leadId,
    pkg.name,
    JSON.stringify(scope),
    pkg.price_range,
    pkg.timeline_weeks,
    JSON.stringify(pkg.deliverables),
    nextStep,
    nowIso(),
    nowIso(),
    nowIso()
  );
  logSalesActivity("proposal", proposalId, "proposal_drafted", `Drafted proposal for ${businessName}: ${pkg.name}, ${pkg.price_range}, ${pkg.timeline_weeks} weeks.`);
  logLoop("proposal_generation", { leadId, proposalId }, { leadId }, { proposalId, packageName: pkg.name });
  logSalesActivity("proposal", proposalId, "proposal_sent", `Proposal "${pkg.name}" sent.`);

  const conv1 = newId("conv");
  db.prepare(
    `INSERT INTO conversations (id, lead_id, channel, summary, occurred_at, created_at) VALUES (?, ?, 'in_person', ?, ?, ?)`
  ).run(conv1, leadId, "Met at chamber of commerce mixer — described missed after-hours calls costing real jobs.", nowIso(), nowIso());
  const conv2 = newId("conv");
  db.prepare(
    `INSERT INTO conversations (id, lead_id, channel, summary, occurred_at, created_at) VALUES (?, ?, 'call', ?, ?, ?)`
  ).run(conv2, leadId, "Follow-up call — confirmed budget and urgency, wants to move before peak season.", nowIso(), nowIso());
  logSalesActivity("lead", leadId, "conversation_logged", "Logged an in person conversation.");
  logSalesActivity("lead", leadId, "conversation_logged", "Logged a call conversation.");

  const followUpId = newId("fu");
  const dueAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const subject = `Following up on your ${businessName} proposal`;
  const body = `Hi Marcus,\n\nWanted to follow up on the proposal we put together for ${businessName} (${pkg.name}, ${pkg.price_range}, ${pkg.timeline_weeks} weeks). Happy to walk through any part of it or answer questions.\n\n${nextStep}\n\nBest,\nFABLE 5 Team`;
  db.prepare(
    `INSERT INTO follow_ups (id, lead_id, proposal_id, channel, due_at, status, email_subject, email_body, created_at, updated_at)
     VALUES (?, ?, ?, 'email', ?, 'pending', ?, ?, ?, ?)`
  ).run(followUpId, leadId, proposalId, dueAt, subject, body, nowIso(), nowIso());
  logSalesActivity("lead", leadId, "follow_up_drafted", `Follow-up email drafted, due ${new Date(dueAt).toLocaleDateString()}.`);
  logLoop("follow_up_email", { leadId, proposalId }, { leadId }, { followUpId, dueAt });
  logLoop("close_probability", { leadId }, { leadId }, { score: 82 });
  logSalesActivity("lead", leadId, "close_probability_scored", "Close probability: 82/100 — Hot lead — high urgency, strong fit, and active engagement.");

  console.log(`Seeded hot lead: ${businessName} (proposal sent, follow-up due)`);
}

function seedFreshLead() {
  const leadId = newId("lead");
  const businessName = "Cedar & Co Boutique";
  db.prepare(
    `INSERT INTO leads
      (id, business_name, contact_name, email, phone, business_type, pain_points, requested_service,
       budget_range, urgency, source, notes, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'low', 'referral', ?, 'new', ?, ?)`
  ).run(
    leadId,
    businessName,
    "Priya Anand",
    "priya@cedarandco.com",
    "(555) 662-9034",
    "Boutique retail",
    "Relies on Instagram only, no real storefront online.",
    "Simple e-commerce presence",
    "$1,500 - $3,000",
    "Referred by Riverside Family Dental — casual interest, not in a rush.",
    nowIso(),
    nowIso()
  );
  logSalesActivity("lead", leadId, "lead_captured", `Lead "${businessName}" captured via referral.`);
  logLoop("lead_capture", { leadId }, { businessName }, { leadId });
  console.log(`Seeded fresh lead: ${businessName}`);
}

function main() {
  clearAll();
  seedPackages();
  seedFullyDeliveredClient();
  seedFreshClient();
  seedHotLead();
  seedFreshLead();
  console.log("Seed complete.");
}

main();
