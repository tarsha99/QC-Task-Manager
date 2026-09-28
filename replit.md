# QC Task Manager

A task scheduling workspace that keeps project work visible, persistent, and reminder-aware.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/qc-task-manager run dev` — run the web dashboard
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — PostgreSQL connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 with a non-blocking 15-second task scheduler
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/qc-task-manager/src/` — dashboard, task queue, forms, detail pages, and reminder UI
- `artifacts/api-server/src/routes/tasks.ts` — task CRUD, dashboard, activity, and due endpoints
- `artifacts/api-server/src/lib/scheduler.ts` — background due-task promotion and one-time demo seed
- `artifacts/api-server/src/lib/task-utils.ts` — Asia/Kolkata time handling and derived statuses
- `lib/api-spec/openapi.yaml` — source of truth for API contracts
- `lib/db/src/schema/tasks.ts` — source of truth for persistent task storage

## Architecture decisions

- Keep calendar date and scheduled time as explicit fields alongside the scheduled instant, so scheduling remains stable in Asia/Kolkata.
- Derive display statuses from the current time, while the scheduler persists `Due` so the dashboard can poll reliably.
- Use generated OpenAPI clients and Zod schemas to keep the frontend and backend contract aligned.
- Seed demo tasks only when the database is empty, so the initial demo is useful without creating duplicates.
- Use browser notification permission opportunistically and always provide an in-app fallback.

## Product

QC Task Manager supports task CRUD, rescheduling, completion, due reminders, dashboard summaries, recent activity, task search/filtering, and live database/scheduler/API health.

## User preferences

The requested scheduling timezone is Asia/Kolkata.

## Gotchas

- Use the managed workflows for local preview so `PORT` and `BASE_PATH` are available to Vite.
- After changing `lib/api-spec/openapi.yaml`, run codegen before using new hooks or server schemas.
- Use `pnpm run typecheck` for the canonical verification command.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
