/**
 * Compile-time proof that a trigger input or template cannot carry a
 * procedure/health/free-text field. `next build`'s type-check step
 * compiles this file like any other; if TypeScript ever started accepting
 * either literal below, the `@ts-expect-error` directive itself would
 * fail to compile, breaking the build — that's the point of this file.
 *
 * This covers the type-level half of data minimization (no such field can
 * exist on the record). The runtime half — a template's placeholder
 * syntax can't reference anything outside the closed set even inside a
 * plain string — is `validateTemplate()` in ../engine.ts, exercised by
 * scripts/verify-sequence-engine.ts, not by TypeScript.
 */
import type { LeadCapturedInput, MessageTemplate } from "../types";

const _rejectedTriggerInput: LeadCapturedInput = {
  kind: "lead_captured",
  firstName: "Test",
  contact: "555-0100",
  businessName: "Test Co",
  capturedAt: new Date().toISOString(),
  // @ts-expect-error -- "procedure" is not a field of LeadCapturedInput; excess-property check on an object literal rejects it.
  procedure: "root canal",
};

const _rejectedTemplate: MessageTemplate = {
  body: "See you soon, {firstName}.",
  // @ts-expect-error -- "proceduresDiscussed" is not a field of MessageTemplate; a template cannot carry structured health data alongside its text.
  proceduresDiscussed: ["root canal"],
};

export {};
