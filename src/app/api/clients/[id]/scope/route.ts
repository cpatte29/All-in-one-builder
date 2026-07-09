import { NextRequest, NextResponse } from "next/server";
import { runProjectScopeLoop } from "@/lib/loops";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { output } = runProjectScopeLoop({ clientId: params.id });
    return NextResponse.json({ scope: output });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
