import { db, newId, nowIso } from "@/lib/db";
import { executeLoop, logActivity } from "./engine";
import type { Project } from "@/lib/types";

export interface TaskGenerationInput {
  projectId: string;
}

export interface GeneratedTask {
  id: string;
  title: string;
  category: string;
  priority: "low" | "medium" | "high";
}

export interface TaskGenerationOutput {
  tasks: GeneratedTask[];
}

const CATEGORY_TEMPLATES: Record<string, { title: string; priority: "low" | "medium" | "high" }[]> = {
  default: [
    { title: "Set up project repo and environment", priority: "high" },
    { title: "Confirm brand assets (logo, colors, copy)", priority: "medium" },
  ],
};

function tasksForDeliverable(deliverable: string): { title: string; category: string; priority: "low" | "medium" | "high" }[] {
  const d = deliverable.toLowerCase();
  if (d.includes("website") || d.includes("site")) {
    return [
      { title: `Build: ${deliverable}`, category: "Web Build", priority: "high" },
      { title: `QA responsive layout for: ${deliverable}`, category: "QA", priority: "medium" },
    ];
  }
  if (d.includes("seo")) {
    return [{ title: `Implement: ${deliverable}`, category: "SEO", priority: "medium" }];
  }
  if (d.includes("automation") || d.includes("crm") || d.includes("workflow")) {
    return [
      { title: `Configure: ${deliverable}`, category: "Automation", priority: "high" },
      { title: `Test end-to-end flow for: ${deliverable}`, category: "QA", priority: "medium" },
    ];
  }
  if (d.includes("dashboard") || d.includes("portal") || d.includes("app")) {
    return [
      { title: `Build: ${deliverable}`, category: "Product Build", priority: "high" },
      { title: `Write acceptance tests for: ${deliverable}`, category: "QA", priority: "medium" },
    ];
  }
  if (d.includes("integration")) {
    return [{ title: `Integrate: ${deliverable}`, category: "Integrations", priority: "high" }];
  }
  return [{ title: `Deliver: ${deliverable}`, category: "General", priority: "medium" }];
}

/** Loop 5: Task Generation Loop — scope deliverables -> concrete task cards. */
export function runTaskGenerationLoop(input: TaskGenerationInput) {
  return executeLoop<TaskGenerationInput, TaskGenerationOutput>(
    {
      type: "task_generation",
      run: ({ projectId }) => {
        const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(projectId) as Project | undefined;
        if (!project) throw new Error(`Project ${projectId} not found`);
        if (!project.scope_json) throw new Error("Project must complete the Project Scope Loop first");

        const scope = JSON.parse(project.scope_json) as { deliverables: string[] };
        const generated: GeneratedTask[] = [];

        const insert = db.prepare(
          `INSERT INTO tasks (id, project_id, title, description, category, status, priority, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 'backlog', ?, ?, ?)`
        );

        for (const base of CATEGORY_TEMPLATES.default) {
          const id = newId("task");
          insert.run(id, projectId, base.title, null, "Setup", base.priority, nowIso(), nowIso());
          generated.push({ id, title: base.title, category: "Setup", priority: base.priority });
        }

        for (const deliverable of scope.deliverables) {
          for (const t of tasksForDeliverable(deliverable)) {
            const id = newId("task");
            insert.run(id, projectId, t.title, `Deliverable: ${deliverable}`, t.category, t.priority, nowIso(), nowIso());
            generated.push({ id, title: t.title, category: t.category, priority: t.priority });
          }
        }

        db.prepare(`UPDATE projects SET status = 'tasks_generated', updated_at = ? WHERE id = ?`).run(
          nowIso(),
          projectId
        );

        logActivity("project", projectId, "tasks_generated", `Generated ${generated.length} task cards.`);

        return { output: { tasks: generated }, context: { projectId, clientId: project.client_id } };
      },
    },
    input
  );
}
