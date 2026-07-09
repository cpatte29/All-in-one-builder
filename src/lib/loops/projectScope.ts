import { db, newId, nowIso } from "@/lib/db";
import { executeLoop, logActivity } from "./engine";
import { getClient } from "./clientProfile";
import type { Package } from "@/lib/types";

export interface ProjectScopeInput {
  clientId: string;
}

export interface ProjectScopeOutput {
  projectId: string;
  scope: {
    deliverables: string[];
    timelineWeeks: number;
    priceQuote: string;
    focusAreas: string[];
  };
}

/** Loop 4: Project Scope Loop — turns the recommended package into a concrete project + scope doc. */
export function runProjectScopeLoop(input: ProjectScopeInput) {
  return executeLoop<ProjectScopeInput, ProjectScopeOutput>(
    {
      type: "project_scope",
      run: ({ clientId }) => {
        const client = getClient(clientId);
        if (!client) throw new Error(`Client ${clientId} not found`);
        if (!client.recommended_package_id) {
          throw new Error("Client must complete the Package Recommendation Loop first");
        }

        const pkg = db
          .prepare("SELECT * FROM packages WHERE id = ?")
          .get(client.recommended_package_id) as Package;
        const deliverables: string[] = JSON.parse(pkg.deliverables_json || "[]");
        const diagnosis = client.diagnosis_json ? JSON.parse(client.diagnosis_json) : { recommendedFocus: [] };

        const scope = {
          deliverables,
          timelineWeeks: pkg.timeline_weeks ?? 4,
          priceQuote: pkg.price_range ?? "TBD",
          focusAreas: diagnosis.recommendedFocus ?? [],
        };

        const projectId = newId("proj");
        db.prepare(
          `INSERT INTO projects (id, client_id, package_id, name, status, scope_json, price_quote, timeline_weeks, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'scoped', ?, ?, ?, ?, ?)`
        ).run(
          projectId,
          clientId,
          pkg.id,
          `${client.business_name} — ${pkg.name}`,
          JSON.stringify(scope),
          scope.priceQuote,
          scope.timelineWeeks,
          nowIso(),
          nowIso()
        );

        db.prepare(`UPDATE clients SET status = 'scoped', updated_at = ? WHERE id = ?`).run(nowIso(), clientId);

        logActivity(
          "project",
          projectId,
          "scoped",
          `Project scoped: ${deliverables.length} deliverables, ${scope.timelineWeeks} week timeline, ${scope.priceQuote}.`
        );

        return { output: { projectId, scope }, context: { clientId, projectId } };
      },
    },
    input
  );
}
