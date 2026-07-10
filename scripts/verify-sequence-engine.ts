/**
 * Verification script for Packet 04 (Sequence Engine + dental sequence pack).
 *
 * Proves: correct step offsets and rendering, doNotContact short-circuit,
 * SLA follow-up emission (+ persistence through the existing follow_ups
 * table), runtime placeholder validation, and — via a synthetic fixture
 * spec — that the engine itself is industry-independent.
 *
 * Run: tsx scripts/verify-sequence-engine.ts
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(__dirname, "..");
const SEQ_DB = path.join(ROOT, "tests", "golden", "sequences.db");

for (const f of [SEQ_DB, `${SEQ_DB}-shm`, `${SEQ_DB}-wal`]) {
  if (fs.existsSync(f)) fs.rmSync(f);
}
process.env.DATABASE_FILE = SEQ_DB;

let failures = 0;
function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  PASS  ${message}`);
  } else {
    console.error(`  FAIL  ${message}`);
    failures += 1;
  }
}

async function main() {
  const { runSequence, validateTemplate } = await import("../src/lib/sequences/engine");
  const { consoleAdapter } = await import("../src/lib/sequences/adapters");
  const { persistSlaFollowUp } = await import("../src/lib/sequences/persist");
  const dentalModule = await import("../src/lib/verticals/dental");
  const dentalSequences = dentalModule.default.sequences!;

  console.log("Dental sequence pack (via the generic engine):");

  const bookingSpec = dentalSequences.find((s) => s.id === "dental_booking_capture")!;
  const captured: { channel: string; to: string; subject?: string; body: string }[] = [];
  const capturingAdapter = {
    send: (m: { channel: "email" | "sms"; to: string; subject?: string; body: string }) => captured.push(m),
  };
  const capturedAt = "2026-01-01T12:00:00.000Z";
  const bookingResult = runSequence(
    bookingSpec,
    {
      kind: "lead_captured",
      firstName: "Jordan",
      contact: "555-0100",
      businessContact: "front-desk@example.test",
      businessName: "Example Dental",
      capturedAt,
      confirmed: false,
    },
    capturingAdapter
  );
  assert(!bookingResult.skipped, "booking sequence is not skipped for a contactable lead");
  assert(captured.length === 2, `booking sequence dispatches 2 steps (got ${captured.length})`);
  assert(captured[0].to === "front-desk@example.test", `step 1 (business audience) sends to businessContact (got ${captured[0].to})`);
  assert(captured[1].to === "555-0100", `step 2 (customer audience) sends to contact (got ${captured[1].to})`);
  assert(
    bookingResult.steps[0].sendAt === capturedAt,
    `step 1 fires at offset 0 = capturedAt (got ${bookingResult.steps[0].sendAt})`
  );
  assert(
    bookingResult.steps[1].sendAt === "2026-01-01T12:01:00.000Z",
    `step 2 fires at +1 minute (got ${bookingResult.steps[1].sendAt})`
  );
  assert(
    bookingResult.slaFollowUpDueAt === "2026-01-01T16:00:00.000Z",
    `unconfirmed lead gets a 4-hour SLA due date (got ${bookingResult.slaFollowUpDueAt})`
  );

  const { db, newId, nowIso } = await import("../src/lib/db");
  const fixtureLeadId = newId("lead");
  db.prepare(
    `INSERT INTO leads (id, business_name, contact_name, status, created_at, updated_at) VALUES (?, ?, ?, 'new', ?, ?)`
  ).run(fixtureLeadId, "Sequence Verify Fixture", "Fixture Contact", nowIso(), nowIso());

  const followUpId = persistSlaFollowUp(fixtureLeadId, bookingResult.slaFollowUpDueAt!, "SLA test");
  const row = db.prepare("SELECT * FROM follow_ups WHERE id = ?").get(followUpId) as { status: string; due_at: string } | undefined;
  assert(!!row && row.status === "pending" && row.due_at === bookingResult.slaFollowUpDueAt, "persistSlaFollowUp writes a pending row to the existing follow_ups table");

  const reminderSpec = dentalSequences.find((s) => s.id === "dental_appointment_reminders")!;
  const reminderResult = runSequence(
    reminderSpec,
    {
      kind: "appointment_scheduled",
      firstName: "Jordan",
      contact: "555-0100",
      businessContact: "555-0199",
      businessName: "Example Dental",
      appointmentAt: "2026-02-01T15:00:00.000Z",
    },
    consoleAdapter
  );
  assert(reminderResult.steps.length === 3, `reminder sequence has 3 steps (got ${reminderResult.steps.length})`);
  assert(
    reminderResult.steps[0].sendAt === "2026-01-25T15:00:00.000Z",
    `T-7 day reminder fires 7 days before the appointment (got ${reminderResult.steps[0].sendAt})`
  );
  assert(
    !reminderResult.steps.some((s) => /procedure|diagnos|treatment/i.test(s.body)),
    "no reminder step's rendered body mentions a procedure/diagnosis/treatment"
  );
  assert(
    reminderResult.steps.every((s) => s.body.includes("555-0199") && !s.body.includes("555-0100")),
    "every reminder's {phone} resolves to the business's contact, never the patient's own number"
  );

  console.log("\ndoNotContact short-circuit:");
  const reviewSpec = dentalSequences.find((s) => s.id === "dental_review_request")!;
  const optedOut: unknown[] = [];
  const optedOutResult = runSequence(
    reviewSpec,
    {
      kind: "visit_completed",
      firstName: "Jordan",
      contact: "555-0100",
      businessName: "Example Dental",
      visitAt: "2026-01-01T09:00:00.000Z",
      link: "https://example.test/review",
      doNotContact: true,
    },
    { send: (m) => optedOut.push(m) }
  );
  assert(optedOutResult.skipped === true && optedOutResult.reason === "doNotContact", "doNotContact sequence is skipped before any step dispatches");
  assert(optedOut.length === 0, "no message is sent when doNotContact is set");

  console.log("\nRuntime placeholder validation:");
  let threw = false;
  try {
    validateTemplate({ body: "Hi {firstName}, your {procedure} is scheduled." });
  } catch {
    threw = true;
  }
  assert(threw, "validateTemplate throws on a placeholder outside the closed set");

  console.log("\nSynthetic fixture spec (engine industry-independence):");
  const fixtureCaptured: unknown[] = [];
  const fixtureResult = runSequence(
    {
      id: "fixture_spec",
      trigger: "lapsed_customer",
      steps: [
        {
          offset: { unit: "days", value: 3 },
          channel: "email",
          audience: "customer",
          template: { body: "Hi {firstName}, come back to {businessName}! {link}" },
        },
      ],
    },
    {
      kind: "lapsed_customer",
      firstName: "Fixture",
      contact: "fixture@example.test",
      businessName: "Fixture Co",
      lastVisitAt: "2026-01-01T00:00:00.000Z",
      link: "https://example.test/book",
    },
    { send: (m) => fixtureCaptured.push(m) }
  );
  assert(!fixtureResult.skipped && fixtureCaptured.length === 1, "an arbitrary, non-dental fixture spec runs through the same engine");
  assert(
    fixtureResult.steps[0].sendAt === "2026-01-04T00:00:00.000Z",
    `fixture spec's +3 day offset resolves correctly (got ${fixtureResult.steps[0].sendAt})`
  );

  console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
