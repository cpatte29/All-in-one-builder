import { NextRequest, NextResponse } from "next/server";
import { runQualityReviewLoop } from "@/lib/loops";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  try {
    const { output } = runQualityReviewLoop({
      taskId: params.id,
      passed: !!body.passed,
      reviewerNotes: body.reviewerNotes,
    });
    return NextResponse.json({ review: output });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
