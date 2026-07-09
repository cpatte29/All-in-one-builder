import { NextRequest, NextResponse } from "next/server";
import { runFollowUpEmailLoop } from "@/lib/loops";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  try {
    const { output } = runFollowUpEmailLoop({ leadId: params.id, channel: body.channel });
    return NextResponse.json({ followUp: output });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
