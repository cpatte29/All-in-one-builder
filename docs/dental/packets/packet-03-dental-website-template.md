# Packet 03 — Vertical Site Template: Base + Dental Content Pack

**Executor:** Sonnet · **Depends on:** Packet 00 (naming only; parallel-safe)
**Revised by 03-platform-review.md:** was a dental-only template; now a
reusable base ("the engine") + a dental content pack ("the config"). A
second vertical must require only a new pack.

## Context

The template is the delivery unit of repeatability. The review found the
shell — config loading, lead-capture form, storage adapter, SEO machinery —
is industry-agnostic, while page sets, copy, and schema types are genuinely
vertical. Split accordingly. **Do not build any pack other than dental**;
the base is validated by one real pack plus the acceptance checks below.

## Spec

1. **Location:** `templates/vertical-site/` — self-contained Next.js 14 +
   Tailwind app (own `package.json`, own README: "clone → pick pack →
   edit `site.config.ts` → deploy"). Excluded from the FABLE dashboard
   build (`tsconfig.json` exclude; verify root `npm run build` unaffected).

2. **Base (industry-agnostic):**
   - `site.config.ts` schema: business name, people (bios), address/hours/
     phone, two brand hues, service lines (array), trust items, review URL,
     `notifyEmail`, `packId`.
   - Components: layout/nav/footer, hero with primary CTA, trust strip,
     service card + service page shell, location block, click-to-call.
   - **Lead-capture form (conversion core):** name, phone, email, preferred
     days/times, new/existing radio — exactly these fields, enforced by the
     base (packs cannot add fields). Fixed data-minimization note rendered
     under every instance ("Please don't include medical or personal
     details in this form — we'll discuss your needs by phone."). Submits
     to `/api/lead-request` backed by a storage adapter
     (`src/lib/leadStore.ts`, MVP: local JSON) with documented email/webhook
     swap point.
   - SEO machinery: per-page `metadata` built from config ("{Service} in
     {city} — {business}"), JSON-LD emitter that takes the schema type
     from the pack.
   - Quality bar: mobile-first, semantic/accessible, static-first, no heavy
     client JS beyond the form.

3. **Dental pack `templates/vertical-site/packs/dental/`:**
   - Page set: home, services index + `[slug]`, new-patients, insurance &
     financing, about, contact.
   - Conservative default copy (no outcome guarantees, no "painless", no
     before/after photos by default — state advertising rules).
   - JSON-LD type `Dentist`; service-line seeds (implants, aligners,
     cosmetic, hygiene); insurance page pattern with membership-plan toggle.
   - A pack manifest (`pack.ts`) declaring pages, copy defaults, schema
     type — the shape future packs implement.

## Out of scope

Automations (Packet 04). CMS. Multi-location. Any second content pack.

## Acceptance criteria

- `cd templates/vertical-site && npm install && npm run build` passes; root
  FABLE build unaffected.
- Editing only `site.config.ts` rebrands the site end to end.
- The pack manifest interface compiles against a synthetic fixture pack in
  a verification script (proves "new vertical = new pack, zero base edits")
  — fixture is not shipped as a real pack.
- Form renders exactly the specified fields; submission persists through
  the adapter in dev.
- Grep checks: no health-soliciting field/copy anywhere; no `dental` string
  under the base (`templates/vertical-site/src/`) — dental appears only
  under `packs/dental/`.
