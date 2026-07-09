import { NextRequest, NextResponse } from "next/server";
import { runTaskGenerationLoop } from "@/lib/loops";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { output } = runTaskGenerationLoop({ projectId: params.id });
    return NextResponse.json({ tasks: output.tasks });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
