import { NextRequest, NextResponse } from "next/server";
import { runClaudeBuildLoop } from "@/lib/loops";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { output } = runClaudeBuildLoop({ taskId: params.id });
    return NextResponse.json({ brief: output });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
