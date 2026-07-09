import { db, nowIso } from "@/lib/db";
import { executeLoop, logActivity } from "./engine";
import { classifyBusiness, type BusinessClassification } from "@/lib/classify";
import { getClient } from "./clientProfile";

export interface BusinessDiagnosisInput {
  clientId: string;
}

export type BusinessDiagnosisOutput = BusinessClassification;

/** Loop 2: Business Diagnosis Loop — classifies the business and scores opportunity. */
export function runBusinessDiagnosisLoop(input: BusinessDiagnosisInput) {
  return executeLoop<BusinessDiagnosisInput, BusinessDiagnosisOutput>(
    {
      type: "business_diagnosis",
      run: ({ clientId }) => {
        const client = getClient(clientId);
        if (!client) throw new Error(`Client ${clientId} not found`);

        const classification = classifyBusiness({
          businessName: client.business_name,
          businessTypeRaw: client.business_type ?? undefined,
          goals: client.goals ?? undefined,
          painPoints: client.pain_points ?? undefined,
          websitePresent: !!client.website,
          budgetRange: client.budget_range ?? undefined,
        });

        db.prepare(
          `UPDATE clients SET industry = ?, business_type = ?, business_size = ?,
             diagnosis_json = ?, status = 'diagnosed', updated_at = ? WHERE id = ?`
        ).run(
          classification.industry,
          classification.businessType,
          classification.size,
          JSON.stringify(classification),
          nowIso(),
          clientId
        );

        logActivity(
          "client",
          clientId,
          "diagnosed",
          `Diagnosed as ${classification.industry} (opportunity score ${classification.opportunityScore}/100).`
        );

        return { output: classification, context: { clientId } };
      },
    },
    input
  );
}
