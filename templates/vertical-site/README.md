# Vertical Site Template

A reusable Next.js 14 + Tailwind site: a base (`src/`) that's completely
industry-agnostic, plus a content pack (`packs/`) that supplies copy, a
JSON-LD schema type, and default services for one vertical. Today's only
pack is `dental`.

## Deploying a new client site

1. Clone this directory.
2. Pick a pack (currently only `dental`) — leave `registerPacks.ts` as-is
   if you're using the one that's already registered.
3. Edit `site.config.ts` — business name, people, address, hours, phone,
   brand colors, service lines (or leave empty to use the pack's
   defaults), trust items, review URL, notify email. That one file
   rebrands the entire site.
4. `npm install && npm run build`, deploy.

## Adding a new vertical

Write a new pack under `packs/<vertical>/pack.ts` implementing
`PackManifest` (`src/packs/types.ts`), call `registerPack()`, and add one
import line to `registerPacks.ts`. **Zero changes to `src/`.** That's the
whole point of the base/pack split — see
`scripts/verify-pack-manifest.ts` for a synthetic pack proving this.

## Structure

```
.
├── registerPacks.ts     # the only place that lists which packs are active
├── site.config.ts        # the one file a client deployment edits
├── packs/
│   └── dental/pack.ts     # dental copy, schema type, default services
├── src/
│   ├── config/types.ts     # SiteConfig shape
│   ├── packs/               # pack registry + PackManifest contract (industry-agnostic)
│   ├── lib/
│   │   ├── seo.ts            # metadata + JSON-LD helpers
│   │   └── leadStore.ts       # booking-request storage adapter (MVP: local JSON file)
│   ├── components/           # Layout, Hero, TrustStrip, ServiceCard, LocationBlock, LeadForm
│   └── app/                  # home, services (+ [slug]), new-patients, insurance, about, contact
└── scripts/verify-pack-manifest.ts
```

## The lead-capture form

Exactly five fields: name, phone, email, preferred days/times, new/existing
patient. No pack may add a field to it — that's enforced by the base
owning the form component, not by convention. A fixed note under the form
tells visitors not to include medical details; submissions carry only
contact info and scheduling preference, never anything else.

## Swapping the storage adapter

`src/lib/leadStore.ts` exports a `LeadStoreAdapter` interface
(`save(lead)`). The MVP implementation appends to a local `leads.json`.
Wire up email (Resend, SendGrid) or a webhook by implementing the same
interface and pointing `src/app/api/lead-request/route.ts` at it — no
other code changes.
