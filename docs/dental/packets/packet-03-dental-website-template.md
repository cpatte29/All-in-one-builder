# Packet 03 — Dental Website Template

**Executor:** Sonnet · **Depends on:** Packet 01 (naming only; can start in parallel)

## Context

Success criteria require a website template. Nothing client-facing ships in
the repo today. The template is the unit of repeatability: every dental
client gets a configured clone, not a bespoke build.

## Spec

1. **Location:** `templates/dental-site/` — a self-contained Next.js 14 +
   Tailwind app with its own `package.json` and README ("clone, edit
   `site.config.ts`, deploy"). It is NOT part of the FABLE dashboard build;
   add the path to the dashboard's `tsconfig.json` `exclude` and verify the
   root `npm run build` is unaffected.

2. **Single config file** `site.config.ts` drives all practice-specific
   content: practice name, doctor bios, address/hours/phone, brand colors
   (two Tailwind hues), service lines (array — drives service pages),
   insurance list, financing partners, review-platform URL, booking
   `notifyEmail`.

3. **Pages:**
   - `/` Home — hero with primary CTA "Request an Appointment", trust strip
     (years, insurance-friendly, review rating placeholder), top 3 services,
     meet-the-doctor teaser, location block with hours + map placeholder.
   - `/services` index + `/services/[slug]` — generated from config service
     lines; conservative copy (no outcome guarantees, no "painless", no
     before/after photos by default — state advertising rules).
   - `/new-patients` — what to expect, forms note, first-visit FAQ.
   - `/insurance` — accepted plans from config, financing, membership plan
     section (togglable).
   - `/about` — doctor(s) + practice story from config.
   - `/contact` — address, hours, click-to-call, booking request form.

4. **Booking request form (the conversion core):** name, phone, email,
   preferred days/times (checkboxes), new/existing patient radio. **Exactly
   these fields.** A fixed note under the form: "Please don't include
   medical details in this form — we'll discuss your needs by phone."
   Submits to a `/api/booking-request` route handler that (MVP) stores to a
   local `bookings.json` via a storage adapter interface
   (`src/lib/bookingStore.ts`) with a documented swap point for
   email/webhook delivery (Packet 04 wires the real notification).
   **Data-minimization is a hard requirement: no free-text "reason for
   visit" field, no health questions anywhere in the template.**

5. **Quality bar:** mobile-first (majority of dental traffic is mobile),
   semantic HTML + accessible labels, `metadata` per page with
   local-SEO-sensible titles ("Dentist in {city} — {practice}"), JSON-LD
   `Dentist` schema on the home page fed from config, Lighthouse-conscious
   (static pages, no heavy client JS beyond the form).

## Out of scope

Reminder/recall/review automations (Packet 04). CMS integration. Multi-location.

## Acceptance criteria

- `cd templates/dental-site && npm install && npm run build` passes.
- Root FABLE `npm run build` still passes and does not compile the template.
- Changing only `site.config.ts` visibly rebrands the site (name, colors,
  services) with no other edits.
- Booking form renders exactly the specified fields and persists a
  submission through the storage adapter in dev.
- Grep check: no form field or copy soliciting health information.
