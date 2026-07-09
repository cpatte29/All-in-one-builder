import { NextRequest, NextResponse } from "next/server";
import { runBusinessPainLoop } from "@/lib/loops";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { output } = runBusinessPainLoop({ leadId: params.id });
    return NextResponse.json({ diagnosis: output });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
