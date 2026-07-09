import { db, nowIso } from "@/lib/db";
import { executeLoop, logActivity } from "./engine";
import { packageForScore } from "@/lib/packages";
import { getClient } from "./clientProfile";
import type { Package } from "@/lib/types";

export interface PackageRecommendationInput {
  clientId: string;
}

export interface PackageRecommendationOutput {
  packageId: string;
  packageName: string;
  rationale: string;
}

/** Loop 3: Package Recommendation Loop — maps diagnosis -> a service package. */
export function runPackageRecommendationLoop(input: PackageRecommendationInput) {
  return executeLoop<PackageRecommendationInput, PackageRecommendationOutput>(
    {
      type: "package_recommendation",
      run: ({ clientId }) => {
        const client = getClient(clientId);
        if (!client) throw new Error(`Client ${clientId} not found`);
        if (!client.diagnosis_json) {
          throw new Error("Client must complete the Business Diagnosis Loop first");
        }

        const diagnosis = JSON.parse(client.diagnosis_json) as { opportunityScore: number };
        const def = packageForScore(diagnosis.opportunityScore);
        const pkg = db.prepare("SELECT * FROM packages WHERE id = ?").get(def.id) as Package | undefined;
        if (!pkg) throw new Error(`Package ${def.id} not seeded`);

        const rationale = `Opportunity score ${diagnosis.opportunityScore}/100 places ${client.business_name} in the "${def.tier}" tier — recommending ${pkg.name}.`;

        db.prepare(
          `UPDATE clients SET recommended_package_id = ?, status = 'package_recommended', updated_at = ? WHERE id = ?`
        ).run(pkg.id, nowIso(), clientId);

        logActivity("client", clientId, "package_recommended", rationale);

        return {
          output: { packageId: pkg.id, packageName: pkg.name, rationale },
          context: { clientId },
        };
      },
    },
    input
  );
}
