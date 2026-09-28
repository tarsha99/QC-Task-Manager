# QC Task Manager

QC Task Manager is a full-stack task scheduling workspace for planning project work, tracking what is due, and keeping the next important item visible. It uses a React/Vite interface, a typed Express API, PostgreSQL persistence through Drizzle ORM, and a non-blocking background scheduler.

## Features

- Create, view, edit, reschedule, complete, cancel, and delete tasks.
- Store tasks permanently with scheduled date, time, status, and completion metadata.
- Calculate `Scheduled`, `Upcoming`, `Due`, `Completed`, and `Cancelled` statuses from persisted data and the Asia/Kolkata schedule.
- Promote due tasks in a background worker without blocking API requests.
- Poll due tasks every 15 seconds while the dashboard is open.
- Show browser notifications when supported, with an in-app reminder fallback.
- Dashboard cards for total, scheduled, upcoming, due, and completed work.
- Recent activity feed and next-task spotlight.
- Live system status for database, scheduler, and API health.
- Search and filter the task queue.
- Responsive desktop, tablet, and mobile layouts.

## Technology stack

- React, Vite, TypeScript, Tailwind CSS, and generated React Query hooks.
- Express 5 API server.
- PostgreSQL with Drizzle ORM.
- Zod schemas generated from the OpenAPI contract.
- Pino structured server logging.
- A Node background worker that checks scheduled tasks every 15 seconds.

## Project structure

```text
artifacts/
├── api-server/
│   └── src/
│       ├── lib/scheduler.ts       # Background due-task worker and demo seed
│       ├── lib/task-utils.ts      # Asia/Kolkata time and status logic
│       └── routes/tasks.ts        # CRUD, dashboard, activity, and due APIs
└── qc-task-manager/
    └── src/
        ├── components/            # Workspace shell, forms, task primitives
        └── pages/                 # Dashboard, queue, detail, and edit screens
lib/
├── api-spec/openapi.yaml          # API source of truth
├── api-client-react/              # Generated React Query client
├── api-zod/                      # Generated Zod schemas
└── db/src/schema/tasks.ts         # Persistent task table
```

## Architecture

```text
Browser dashboard
      │  generated React Query hooks
      ▼
Express API (/api)
      ├── PostgreSQL via Drizzle ORM
      └── Background scheduler
             │ every 15 seconds
             ▼
        Promote overdue tasks
             │
             ▼
  Dashboard polling + browser/in-app reminder
```

## Installation and local running

The workspace uses pnpm:

```bash
pnpm install
pnpm --filter @workspace/db run push
pnpm --filter @workspace/api-server run dev
```

Start the frontend through its managed workflow so `PORT` and `BASE_PATH` are provided:

```bash
pnpm --filter @workspace/qc-task-manager run dev
```

The API is mounted at `/api` and the frontend is served at the root preview path.

## Database setup

The development database is PostgreSQL and is provisioned by the workspace. The schema is defined in `lib/db/src/schema/tasks.ts`. Run the following after schema changes:

```bash
pnpm --filter @workspace/db run push
```

On a completely empty development database, the API seeds three example tasks once. It never adds duplicate demo rows after tasks exist.

## API endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/tasks` | List, search, and filter tasks |
| POST | `/api/tasks` | Create a task |
| GET | `/api/tasks/:id` | Read task details |
| PATCH | `/api/tasks/:id` | Edit or reschedule a task |
| DELETE | `/api/tasks/:id` | Delete a task |
| POST | `/api/tasks/:id/complete` | Mark a task complete |
| GET | `/api/tasks/due` | Read current due tasks |
| GET | `/api/dashboard/stats` | Read dashboard counts and next task |
| GET | `/api/dashboard/activity` | Read recent activity |
| GET | `/api/healthz` | Full health response |
| GET | `/api/health` | Health alias for integrations |

Create and update requests use JSON. Successful creation returns `201`, successful deletion returns `204`, validation errors return `400`, and missing task IDs return `404`.

## Health endpoint

```bash
curl http://localhost:80/api/healthz
```

Example:

```json
{
  "status": "healthy",
  "database": "connected",
  "scheduler": "running",
  "api": "healthy"
}
```

## Reminder behavior

The scheduler updates overdue active tasks to `Due`. The dashboard checks `/api/tasks/due` every 15 seconds. The first due task not already acknowledged in the browser is surfaced as an in-app reminder. If browser notification permission is available, the same reminder is sent through the Notification API. A local browser key prevents repeated notifications for the same task.

All scheduling uses Asia/Kolkata. Calendar values are stored separately from instants so a date entered by the user does not shift across time zones.

## Re-generating API clients

Change `lib/api-spec/openapi.yaml` first, then run:

```bash
pnpm --filter @workspace/api-spec run codegen
pnpm run typecheck
```

## Deploying on Replit

1. Run `pnpm run typecheck`.
2. Confirm both the API and web workflows are running.
3. Use Replit's Publish flow for the project.
4. Verify the published root page and the published `/api/healthz` endpoint.
5. Keep the database attached to the deployment so tasks persist between releases.

## Known limitations

- This build is single-workspace and does not include user accounts or team-level permissions.
- Browser reminders only appear while the dashboard is open; background push notifications are not included.
- Activity is derived from task timestamps and status because the first release does not maintain a separate audit-log table.