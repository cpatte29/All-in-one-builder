import { db, newId } from "@/lib/db";
import type { LoopType } from "@/lib/types";

export interface LoopContext {
  clientId?: string;
  projectId?: string;
  taskId?: string;
  leadId?: string;
  proposalId?: string;
}

export interface LoopDefinition<TInput, TOutput> {
  type: LoopType;
  /** Runs the loop's logic and applies all side effects (DB writes, status updates). */
  run: (input: TInput) => { output: TOutput; context: LoopContext };
}

function insertLoopRun<TInput, TOutput>(def: LoopDefinition<TInput, TOutput>, input: TInput, context: LoopContext, output: TOutput) {
  const loopId = newId("loop");
  db.prepare(
    `INSERT INTO loops (id, loop_type, client_id, project_id, task_id, lead_id, proposal_id, status, input_json, output_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)`
  ).run(
    loopId,
    def.type,
    context.clientId ?? null,
    context.projectId ?? null,
    context.taskId ?? null,
    context.leadId ?? null,
    context.proposalId ?? null,
    JSON.stringify(input),
    JSON.stringify(output)
  );
  return loopId;
}

function primaryEntity(context: LoopContext, loopId: string): { entityType: string; entityId: string } {
  if (context.taskId) return { entityType: "task", entityId: context.taskId };
  if (context.projectId) return { entityType: "project", entityId: context.projectId };
  if (context.proposalId) return { entityType: "proposal", entityId: context.proposalId };
  if (context.leadId) return { entityType: "lead", entityId: context.leadId };
  if (context.clientId) return { entityType: "client", entityId: context.clientId };
  return { entityType: "loop", entityId: loopId };
}

/**
 * Shared harness every ops loop goes through:
 * accept structured input -> run() produces structured output + side effects
 * already applied by run() -> persist the loop row -> log to activity_log.
 */
export function executeLoop<TInput, TOutput>(
  def: LoopDefinition<TInput, TOutput>,
  input: TInput
): { id: string; output: TOutput } {
  const { output, context } = def.run(input);
  const loopId = insertLoopRun(def, input, context, output);
  const { entityType, entityId } = primaryEntity(context, loopId);
  logActivity(entityType, entityId, def.type, `Ran ${loopLabel(def.type)}`);
  return { id: loopId, output };
}

/**
 * Same harness as executeLoop, but for Sales Mode loops: logs to the
 * dedicated sales_activity feed instead of the ops activity_log, so the
 * CEO's sales timeline stays separate from build/delivery activity. Loop
 * runs still land in the shared `loops` table for a unified audit trail.
 */
export function executeSalesLoop<TInput, TOutput>(
  def: LoopDefinition<TInput, TOutput>,
  input: TInput
): { id: string; output: TOutput } {
  const { output, context } = def.run(input);
  const loopId = insertLoopRun(def, input, context, output);
  const { entityType, entityId } = primaryEntity(context, loopId);
  logSalesActivity(entityType, entityId, def.type, `Ran ${loopLabel(def.type)}`);
  return { id: loopId, output };
}

export function logActivity(entityType: string, entityId: string, action: string, message: string) {
  db.prepare(
    `INSERT INTO activity_log (id, entity_type, entity_id, action, message) VALUES (?, ?, ?, ?, ?)`
  ).run(newId("act"), entityType, entityId, action, message);
}

export function logSalesActivity(entityType: string, entityId: string, action: string, message: string) {
  db.prepare(
    `INSERT INTO sales_activity (id, entity_type, entity_id, action, message) VALUES (?, ?, ?, ?, ?)`
  ).run(newId("sact"), entityType, entityId, action, message);
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
    lead_capture: "Lead Capture Loop",
    business_pain: "Business Pain Loop",
    offer_match: "Offer Match Loop",
    proposal_generation: "Proposal Generation Loop",
    follow_up_email: "Follow-Up Email Loop",
    close_probability: "Close Probability Loop",
  };
  return labels[type];
}
