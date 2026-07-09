import { NextRequest, NextResponse } from "next/server";
import { runCloseProbabilityLoop } from "@/lib/loops";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { output } = runCloseProbabilityLoop({ leadId: params.id });
    return NextResponse.json({ score: output });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
