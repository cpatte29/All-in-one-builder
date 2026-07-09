# FABLE 5 — Internal Operations System

FABLE 5 is the internal ops dashboard for the agency. It is **not a chatbot** —
it's an operations system. You enter a lead, and the loop engine walks it
through classification, package recommendation, scoping, task generation, and
build/review/update cycles, writing structured output to the database at every
step and logging everything to the activity log.

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
│   ├── schema.sql          # full relational schema (clients, projects, tasks, loops, ...)
│   ├── seed.ts              # sample seed data (2 clients, projects, tasks, loop runs)
│   └── fable5.db            # generated SQLite file (gitignored)
├── src/
│   ├── app/
│   │   ├── layout.tsx        # shell: sidebar + topbar
│   │   ├── page.tsx           # 1. Dashboard
│   │   ├── clients/
│   │   │   ├── page.tsx        # 2. Clients (list)
│   │   │   ├── new/page.tsx     # 3. New Client Intake
│   │   │   └── [id]/page.tsx    # 4. Client Detail (loops, tasks, notes, activity)
│   │   ├── projects/page.tsx  # 5. Projects
│   │   ├── tasks/page.tsx     # 6. Tasks
│   │   ├── loops/page.tsx     # 7. Loops (loop run history + manual trigger)
│   │   ├── settings/page.tsx  # 8. Settings (packages, loop config)
│   │   └── api/                # route handlers backing every page (REST-ish JSON API)
│   ├── components/            # Sidebar, Topbar, StatCard, StatusBadge, tables, forms
│   └── lib/
│       ├── db.ts               # SQLite connection + schema bootstrap
│       ├── types.ts            # shared TypeScript types
│       ├── packages.ts         # service package catalog
│       ├── classify.ts         # business classification heuristics
│       └── loops/              # the 8 loops — the actual "product"
│           ├── engine.ts          # shared runLoop() harness: input -> output -> DB -> status -> activity log
│           ├── clientProfile.ts
│           ├── businessDiagnosis.ts
│           ├── packageRecommendation.ts
│           ├── projectScope.ts
│           ├── taskGeneration.ts
│           ├── claudeBuild.ts
│           ├── qualityReview.ts
│           └── clientUpdate.ts
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

Every loop run is itself persisted as a row in `loops` (type, input_json,
output_json, status, timestamps) so the Loops page shows a full audit trail.

## Database Schema

See `db/schema.sql`. Tables: `clients`, `projects`, `tasks`, `loops`,
`packages`, `notes`, `activity_log`.

## Roadmap to Supabase

`db/schema.sql` uses only Postgres-compatible types (`TEXT`, `INTEGER`,
`REAL`, `TIMESTAMP`, JSON-as-TEXT). To move to Supabase: run the same schema
against a Postgres database, swap `src/lib/db.ts` for a `@supabase/supabase-js`
client, and the rest of the app (loops, API routes, pages) is unchanged since
they all go through the `db` query helpers.
