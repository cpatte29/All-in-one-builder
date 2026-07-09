import { db, nowIso } from "@/lib/db";
import { executeLoop, logActivity } from "./engine";
import type { Task, Project, Client } from "@/lib/types";

export interface ClaudeBuildInput {
  taskId: string;
}

export interface BuildBrief {
  taskTitle: string;
  context: string;
  spec: string[];
  acceptanceCriteria: string[];
  suggestedFiles: string[];
}

export type ClaudeBuildOutput = BuildBrief;

/**
 * Loop 6: Claude Build Loop.
 * Produces a structured build brief for an AI developer to execute against —
 * this is the hand-off artifact, not a chat conversation.
 */
export function runClaudeBuildLoop(input: ClaudeBuildInput) {
  return executeLoop<ClaudeBuildInput, ClaudeBuildOutput>(
    {
      type: "claude_build",
      run: ({ taskId }) => {
        const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId) as Task | undefined;
        if (!task) throw new Error(`Task ${taskId} not found`);
        const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(task.project_id) as Project;
        const client = db.prepare("SELECT * FROM clients WHERE id = ?").get(project.client_id) as Client;

        const brief: BuildBrief = {
          taskTitle: task.title,
          context: `Client: ${client.business_name} (${client.industry ?? "uncategorized"}). Project: ${project.name}. Category: ${task.category ?? "General"}.`,
          spec: [
            task.description || `Implement "${task.title}" as part of ${project.name}.`,
            `Follow the ${client.business_name} brand and existing project conventions.`,
            `Category: ${task.category ?? "General"}. Priority: ${task.priority}.`,
          ],
          acceptanceCriteria: [
            "Feature matches the task title and description.",
            "No regressions to existing functionality in the project.",
            "Code is typed, lint-clean, and covered by a manual verification pass.",
          ],
          suggestedFiles: [],
        };

        db.prepare(
          `UPDATE tasks SET build_brief_json = ?, status = 'ready_for_build', updated_at = ? WHERE id = ?`
        ).run(JSON.stringify(brief), nowIso(), taskId);

        logActivity("task", taskId, "build_brief_ready", `Build brief generated for "${task.title}".`);

        return { output: brief, context: { taskId, projectId: task.project_id, clientId: project.client_id } };
      },
    },
    input
  );
}
