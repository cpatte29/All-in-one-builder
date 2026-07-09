import { NextRequest, NextResponse } from "next/server";
import { runClientUpdateLoop } from "@/lib/loops";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { output } = runClientUpdateLoop({ projectId: params.id });
    return NextResponse.json({ update: output });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
