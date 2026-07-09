import { NextRequest, NextResponse } from "next/server";
import { runProposalGenerationLoop } from "@/lib/loops";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { output } = runProposalGenerationLoop({ leadId: params.id });
    return NextResponse.json({ proposal: output });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
