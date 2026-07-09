# FABLE 5 — Internal Operations System

FABLE 5 is the internal ops dashboard for the agency. It is **not a chatbot** —
it's an operations system, made of two connected modes:

- **Sales Mode** captures leads from in-person conversations, email replies,
  referrals, and cold outreach, then carries them through diagnosis, offer
  matching, proposal generation, and follow-up.
- **Operations Mode** takes a client (either entered directly or converted
  from a won lead) through classification, package recommendation, scoping,
  task generation, and build/review/update cycles.

Both modes run on the same loop engine: structured input in, structured
output saved to the database, status updated, activity logged.

## Tech Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** for the dashboard UI
- **SQLite** (via `better-sqlite3`) — local-first, file-based, zero setup.
  The schema (`db/schema.sql`) is plain SQL and maps 1:1 onto Postgres, so
  moving to **Supabase** later is a schema copy + swapping the `db/client.ts`
  driver, not a rewrite.

## File Structure

```
.
├── db/
│   ├── schema.sql          # full relational schema (clients, projects, tasks, loops, leads, ...)
│   ├── seed.ts              # sample seed data (clients, a hot lead, a fresh lead, loop runs)
│   └── fable5.db            # generated SQLite file (gitignored)
├── src/
│   ├── app/
│   │   ├── layout.tsx        # shell: sidebar + topbar
│   │   ├── page.tsx           # 1. Dashboard (ops + sales stat cards)
│   │   ├── clients/
│   │   │   ├── page.tsx        # 2. Clients (list)
│   │   │   ├── new/page.tsx     # 3. New Client Intake
│   │   │   └── [id]/page.tsx    # 4. Client Detail (loops, tasks, notes, activity)
│   │   ├── projects/page.tsx  # 5. Projects (+ [id] Project Detail)
│   │   ├── tasks/page.tsx     # 6. Tasks
│   │   ├── loops/page.tsx     # 7. Loops (all 14 loops, run history)
│   │   ├── settings/page.tsx  # 8. Settings (packages, loop config)
│   │   ├── leads/
│   │   │   ├── page.tsx        # Sales 1. Leads (list)
│   │   │   ├── new/page.tsx     # Sales 2. New Lead
│   │   │   └── [id]/page.tsx    # Sales 3. Lead Detail (loops, conversations, proposals, follow-ups)
│   │   ├── proposals/
│   │   │   ├── page.tsx        # Sales 4. Proposals (list)
│   │   │   └── [id]/page.tsx    # Sales 5. Proposal Detail
│   │   ├── follow-ups/page.tsx # Sales 6. Follow-Ups (due / upcoming / resolved)
│   │   └── api/                # route handlers backing every page (REST-ish JSON API)
│   ├── components/            # Sidebar, Topbar, StatCard, StatusBadge, forms, LoopActionButton
│   └── lib/
│       ├── db.ts               # SQLite connection + schema bootstrap + column migrations
│       ├── types.ts            # shared TypeScript types
│       ├── packages.ts         # service package catalog
│       ├── classify.ts         # business classification heuristics
│       └── loops/              # the 14 loops — the actual "product"
│           ├── engine.ts          # shared executeLoop/executeSalesLoop harness: input -> output -> DB -> status -> activity log
│           ├── clientProfile.ts    ┐
│           ├── businessDiagnosis.ts│
│           ├── packageRecommendation.ts
│           ├── projectScope.ts     │ Operations Mode (8)
│           ├── taskGeneration.ts   │
│           ├── claudeBuild.ts      │
│           ├── qualityReview.ts    │
│           ├── clientUpdate.ts    ┘
│           ├── leadCapture.ts      ┐
│           ├── businessPain.ts     │
│           ├── offerMatch.ts       │ Sales Mode (6)
│           ├── proposalGeneration.ts│
│           ├── followUpEmail.ts    │
│           ├── closeProbability.ts┘
│           └── leadConvert.ts     # lead → client (status transition, not a generative loop)
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.mjs
```

## Setup

```bash
npm install
npm run db:seed     # creates db/fable5.db, applies schema.sql, inserts sample data
npm run dev          # http://localhost:3000
```

No environment variables or external services are required to run the MVP.
`.env.example` documents the optional variables for a future Supabase swap.

## The Loop System

The loop engine is the actual product — the AI is a step inside a pipeline,
not a chat window. Every loop:

1. Accepts **structured input** (a typed object, e.g. `{ clientId }` or
   `{ projectId, taskIds }`)
2. Produces **structured output** (a typed object saved as JSON in `loops.output_json`)
3. **Saves** that output to the relevant table(s) (`packages`, `projects`, `tasks`, ...)
4. **Updates** the client and/or project `status` field
5. **Logs** an `activity_log` row describing what happened

### Operations Mode

| # | Loop | Input | Output | Side effects |
|---|------|-------|--------|---------------|
| 1 | Client Profile Loop | intake form fields | normalized client profile | creates/updates `clients` row, status → `profiled` |
| 2 | Business Diagnosis Loop | clientId | industry, pain points, opportunity score | writes diagnosis note, status → `diagnosed` |
| 3 | Package Recommendation Loop | clientId | recommended package + rationale | links `packages` row to client, status → `package_recommended` |
| 4 | Project Scope Loop | clientId | scope doc (deliverables, timeline, price) | creates `projects` row, status → `scoped` |
| 5 | Task Generation Loop | projectId | list of task cards | creates `tasks` rows, project status → `tasks_generated` |
| 6 | Claude Build Loop | taskId(s) | structured build brief per task (context, spec, acceptance criteria) for an AI developer to execute | writes build brief onto `tasks.build_brief_json`, task status → `ready_for_build` |
| 7 | Quality Review Loop | taskId | pass/fail + review notes | updates task status → `done`/`needs_revision` |
| 8 | Client Update Loop | projectId | client-facing status summary | writes `notes` row, client status → `in_progress`/`delivered` |

### Sales Mode

| # | Loop | Input | Output | Side effects |
|---|------|-------|--------|---------------|
| 1 | Lead Capture Loop | raw lead fields (business, contact, pain, service, budget, urgency, source, notes) | normalized lead | creates `leads` row, status → `new` |
| 2 | Business Pain Loop | leadId | industry, opportunity score, pain score, pain points | writes diagnosis, status → `diagnosed` |
| 3 | Offer Match Loop | leadId | matched package + fit score + rationale | writes `leads.offer_match_json`, status → `matched` |
| 4 | Proposal Generation Loop | leadId | proposal: package, scope, price range, timeline, deliverables, next step | creates `proposals` row (draft), status → `proposal_ready` |
| 5 | Follow-Up Email Loop | leadId | ready-to-send subject + body, due date | creates `follow_ups` row, due date set by urgency |
| 6 | Close Probability Loop | leadId | score 0-100 from urgency, budget, fit, responsiveness, pain level | writes `leads.close_probability` + breakdown |

A lead becomes a client via **Convert to Client** (a status transition, not a
generative loop): it creates the `clients` row from the lead's captured data
and links `leads.client_id`, so the client can then run the full Operations
Mode pipeline. Sending a proposal or marking a lead negotiating/lost are
likewise plain status actions, not loops — they don't produce new structured
output.

Every loop run is itself persisted as a row in `loops` (type, input_json,
output_json, status, timestamps) so the Loops page shows a full audit trail
across both modes. Ops loops log to `activity_log`; sales loops log to the
separate `sales_activity` feed so the CEO's sales timeline doesn't mix with
build/delivery activity.

## Database Schema

See `db/schema.sql`. Operations tables: `clients`, `projects`, `tasks`,
`packages`, `notes`, `activity_log`. Sales tables: `leads`, `conversations`,
`proposals`, `follow_ups`, `sales_activity`. Both share the `loops` table
(with `lead_id`/`proposal_id` columns alongside `client_id`/`project_id`/`task_id`)
for a unified audit trail.

## Roadmap to Supabase

`db/schema.sql` uses only Postgres-compatible types (`TEXT`, `INTEGER`,
`REAL`, `TIMESTAMP`, JSON-as-TEXT). To move to Supabase: run the same schema
against a Postgres database, swap `src/lib/db.ts` for a `@supabase/supabase-js`
client, and the rest of the app (loops, API routes, pages) is unchanged since
they all go through the `db` query helpers.
