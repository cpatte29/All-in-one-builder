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

function logLoop(
  loopType: string,
  ids: { clientId?: string; projectId?: string; taskId?: string },
  input: unknown,
  output: unknown
) {
  db.prepare(
    `INSERT INTO loops (id, loop_type, client_id, project_id, task_id, status, input_json, output_json)
     VALUES (?, ?, ?, ?, ?, 'completed', ?, ?)`
  ).run(
    newId("loop"),
    loopType,
    ids.clientId ?? null,
    ids.projectId ?? null,
    ids.taskId ?? null,
    JSON.stringify(input),
    JSON.stringify(output)
  );
}

function clearAll() {
  const tables = ["activity_log", "loops", "notes", "tasks", "projects", "clients", "packages"];
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
    "Health & Wellness",
    "Dental practice",
    "Small",
    "Fill more new-patient appointment slots and stop losing leads after hours.",
    "Manual, time-consuming scheduling and missed after-hours leads.",
    "$4,000 - $8,000",
    "referral",
    JSON.stringify({
      industry: "Health & Wellness",
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

function main() {
  clearAll();
  seedPackages();
  seedFullyDeliveredClient();
  seedFreshClient();
  console.log("Seed complete.");
}

main();
