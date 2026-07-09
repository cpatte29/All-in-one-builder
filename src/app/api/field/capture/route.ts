import { NextRequest, NextResponse } from "next/server";
import {
  runLeadCaptureLoop,
  runBusinessPainLoop,
  runOfferMatchLoop,
  runProposalGenerationLoop,
  runFollowUpEmailLoop,
  runCloseProbabilityLoop,
} from "@/lib/loops";
import type { LeadUrgency } from "@/lib/types";

/**
 * The CEO enters one freeform "contact" field in the field (a name, a phone
 * number, an email, or some mix scribbled down mid-conversation). Split it
 * into the structured fields the lead record actually needs.
 */
function parseContact(raw: string): { contactName: string; email?: string; phone?: string } {
  const trimmed = raw.trim();
  const emailMatch = trimmed.match(/[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = trimmed.match(/(\+?\(?\d[\d\s().-]{6,}\d)/);

  let remaining = trimmed;
  if (emailMatch) remaining = remaining.replace(emailMatch[0], "");
  if (phoneMatch) remaining = remaining.replace(phoneMatch[0], "");
  remaining = remaining.replace(/[-,|()]+/g, " ").replace(/\s+/g, " ").trim();

  const contactName = remaining || emailMatch?.[0].split("@")[0] || phoneMatch?.[0] || trimmed;
  return { contactName, email: emailMatch?.[0], phone: phoneMatch?.[0]?.trim() };
}

/**
 * CEO Field Mode's "Run Sales Loops" action. Chains all 6 sales loops in
 * order from a single quick-capture submission, so an in-person conversation
 * becomes a lead, a diagnosis, a matched offer, a proposal, a follow-up
 * email, and a close-probability score in one request.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { businessName, businessType, contact, whatTheySaid, whatTheyWant, budgetRange, urgency, notes } = body;

  if (!businessName || !contact) {
    return NextResponse.json({ error: "businessName and contact are required" }, { status: 400 });
  }

  try {
    const { contactName, email, phone } = parseContact(String(contact));

    const capture = runLeadCaptureLoop({
      businessName,
      contactName,
      email,
      phone,
      businessType,
      painPoints: whatTheySaid,
      requestedService: whatTheyWant,
      budgetRange,
      urgency: (urgency as LeadUrgency) || "medium",
      source: "in_person",
      notes,
    });
    const leadId = capture.output.leadId;

    const diagnosis = runBusinessPainLoop({ leadId });
    const match = runOfferMatchLoop({ leadId });
    const proposal = runProposalGenerationLoop({ leadId });
    const followUp = runFollowUpEmailLoop({ leadId });
    const score = runCloseProbabilityLoop({ leadId });

    const nextStep =
      score.output.score >= 70
        ? `${proposal.output.nextStep} This is a hot lead — prioritize immediate outreach.`
        : proposal.output.nextStep;

    return NextResponse.json(
      {
        leadId,
        diagnosis: diagnosis.output,
        match: match.output,
        proposal: proposal.output,
        followUp: followUp.output,
        score: score.output,
        nextStep,
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
