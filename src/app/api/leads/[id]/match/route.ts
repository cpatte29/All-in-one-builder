import { NextRequest, NextResponse } from "next/server";
import { runOfferMatchLoop } from "@/lib/loops";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { output } = runOfferMatchLoop({ leadId: params.id });
    return NextResponse.json({ match: output });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
