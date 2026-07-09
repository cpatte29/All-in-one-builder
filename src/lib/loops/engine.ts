import { db, newId } from "@/lib/db";
import type { LoopType } from "@/lib/types";

export interface LoopContext {
  clientId?: string;
  projectId?: string;
  taskId?: string;
}

export interface LoopDefinition<TInput, TOutput> {
  type: LoopType;
  /** Runs the loop's logic and applies all side effects (DB writes, status updates). */
  run: (input: TInput) => { output: TOutput; context: LoopContext };
}

/**
 * Shared harness every loop goes through:
 * accept structured input -> run() produces structured output + side effects
 * already applied by run() -> persist the loop row -> log activity.
 */
export function executeLoop<TInput, TOutput>(
  def: LoopDefinition<TInput, TOutput>,
  input: TInput
): { id: string; output: TOutput } {
  const { output, context } = def.run(input);

  const loopId = newId("loop");
  db.prepare(
    `INSERT INTO loops (id, loop_type, client_id, project_id, task_id, status, input_json, output_json)
     VALUES (?, ?, ?, ?, ?, 'completed', ?, ?)`
  ).run(
    loopId,
    def.type,
    context.clientId ?? null,
    context.projectId ?? null,
    context.taskId ?? null,
    JSON.stringify(input),
    JSON.stringify(output)
  );

  logActivity(
    context.taskId ? "task" : context.projectId ? "project" : "client",
    context.taskId ?? context.projectId ?? context.clientId ?? loopId,
    def.type,
    `Ran ${loopLabel(def.type)}`
  );

  return { id: loopId, output };
}

export function logActivity(entityType: string, entityId: string, action: string, message: string) {
  db.prepare(
    `INSERT INTO activity_log (id, entity_type, entity_id, action, message) VALUES (?, ?, ?, ?, ?)`
  ).run(newId("act"), entityType, entityId, action, message);
}

export function loopLabel(type: LoopType): string {
  const labels: Record<LoopType, string> = {
    client_profile: "Client Profile Loop",
    business_diagnosis: "Business Diagnosis Loop",
    package_recommendation: "Package Recommendation Loop",
    project_scope: "Project Scope Loop",
    task_generation: "Task Generation Loop",
    claude_build: "Claude Build Loop",
    quality_review: "Quality Review Loop",
    client_update: "Client Update Loop",
  };
  return labels[type];
}
