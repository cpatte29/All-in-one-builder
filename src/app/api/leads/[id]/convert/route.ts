import { NextRequest, NextResponse } from "next/server";
import { convertLeadToClient } from "@/lib/loops";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = convertLeadToClient(params.id);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
