import { NextRequest, NextResponse } from "next/server";
import { localFileLeadStore } from "@/lib/leadStore";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.name !== "string" || typeof body.phone !== "string") {
    return NextResponse.json({ error: "name and phone are required" }, { status: 400 });
  }

  await localFileLeadStore.save({
    name: body.name,
    phone: body.phone,
    email: typeof body.email === "string" ? body.email : "",
    preferredTimes: Array.isArray(body.preferredTimes) ? body.preferredTimes : [],
    patientStatus: body.patientStatus === "existing" ? "existing" : "new",
    submittedAt: new Date().toISOString(),
  });

  return NextResponse.json({ status: "received" }, { status: 201 });
}
