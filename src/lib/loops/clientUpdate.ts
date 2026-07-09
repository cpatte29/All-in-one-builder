import { db, newId, nowIso } from "@/lib/db";
import { executeLoop, logActivity } from "./engine";
import type { Task, Project } from "@/lib/types";

export interface ClientUpdateInput {
  projectId: string;
}

export interface ClientUpdateOutput {
  summary: string;
  tasksDone: number;
  tasksTotal: number;
  projectStatus: "in_build" | "delivered";
}

/** Loop 8: Client Update Loop — rolls task progress into a client-facing status note. */
export function runClientUpdateLoop(input: ClientUpdateInput) {
  return executeLoop<ClientUpdateInput, ClientUpdateOutput>(
    {
      type: "client_update",
      run: ({ projectId }) => {
        const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(projectId) as Project | undefined;
        if (!project) throw new Error(`Project ${projectId} not found`);

        const tasks = db.prepare("SELECT * FROM tasks WHERE project_id = ?").all(projectId) as Task[];
        const tasksTotal = tasks.length;
        const tasksDone = tasks.filter((t) => t.status === "done").length;
        const allDone = tasksTotal > 0 && tasksDone === tasksTotal;
        const projectStatus: "in_build" | "delivered" = allDone ? "delivered" : "in_build";
        const clientStatus = allDone ? "delivered" : "in_progress";

        const summary = allDone
          ? `${project.name} is complete — all ${tasksTotal} tasks delivered.`
          : `${project.name} is in progress — ${tasksDone}/${tasksTotal} tasks complete.`;

        db.prepare(`UPDATE projects SET status = ?, updated_at = ? WHERE id = ?`).run(
          projectStatus,
          nowIso(),
          projectId
        );
        db.prepare(`UPDATE clients SET status = ?, updated_at = ? WHERE id = ?`).run(
          clientStatus,
          nowIso(),
          project.client_id
        );

        db.prepare(
          `INSERT INTO notes (id, client_id, project_id, author, body, note_type, created_at)
           VALUES (?, ?, ?, 'system', ?, 'status_update', ?)`
        ).run(newId("note"), project.client_id, projectId, summary, nowIso());

        logActivity("project", projectId, "client_update", summary);

        return {
          output: { summary, tasksDone, tasksTotal, projectStatus },
          context: { projectId, clientId: project.client_id },
        };
      },
    },
    input
  );
}
