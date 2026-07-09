import { NextRequest, NextResponse } from "next/server";
import { runPackageRecommendationLoop } from "@/lib/loops";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { output } = runPackageRecommendationLoop({ clientId: params.id });
    return NextResponse.json({ recommendation: output });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
