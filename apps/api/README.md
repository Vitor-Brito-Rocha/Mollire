# Mollire API

NestJS backend: multi-tenant deploy service for static frontend builds, routed by wildcard
subdomain (`{slug}.aulvi.com.br`) via a single Nginx block instead of per-project config.

## Stack

- **API**: NestJS
- **DB**: Postgres via Prisma (Supabase for now, swappable later by changing `DATABASE_URL`).
  Columns and JSON payloads are `snake_case` throughout.
- **Auth**: Supabase Auth, access tokens verified via JWKS (`jose`) — this project uses
  Supabase's asymmetric signing keys, not a shared HS256 secret.
- **Build engine**: `simple-git` (clone) + `execa` (run the project's build command)
- **Push**: `web-push` (VAPID) — tenants get notified on deploy failure, admins on system errors
- **Serving**: Nginx reads `Host`, resolves the slug, serves `/var/www/projects/{slug}/current`

## How a deploy works

1. `POST /projects` registers a repo (name, slug, repository URL, build command, output dir),
   owned by the authenticated user.
2. `POST /projects/:slug/deploy` clones the repo, runs the build command, and copies the
   output directory into `releases/{timestamp}/`.
3. A symlink named `current` is atomically repointed at the new release (`rename()` is
   atomic on POSIX, so Nginx never serves a half-swapped directory).
4. Nginx never needs a reload for a new project or a new deploy — it always just resolves
   `$slug` from the `Host` header and serves whatever `current` points to.

See [nginx/mollire.conf.example](../../nginx/mollire.conf.example) for the actual server block.

## Setup

```bash
cd apps/api
npm install
cp .env.example .env   # DATABASE_URL, SUPABASE_PROJECT_URL, ADMIN_EMAILS, VAPID_* keys
npx prisma migrate dev
npm run start:dev
```

## Multi-tenancy & roles

- Every project belongs to a user (`user_id`). The `User` row is provisioned lazily from the
  verified Supabase JWT on a user's first authenticated request — there's no signup webhook.
- `ADMIN_EMAILS` (comma-separated env var) grants `role=ADMIN` at that first sync. Removing an
  email from the list later never auto-demotes an existing admin — that stays a manual DB action.
- Every tenant-facing query is scoped by `user_id`; an ownership mismatch returns **404**, not
  403, so a tenant can't even confirm another tenant's slug exists.
- `/admin/*` is strictly **read-only** (view every tenant's projects/deployments/logs), gated by
  `RolesGuard` + `@Roles('ADMIN')`. It never shares a code path with the tenant-facing services.

## Resilience

A global exception filter logs every error to console; 5xx responses are additionally persisted
to `ErrorLog` and page admins via push. `process.on('uncaughtException'/'unhandledRejection')` is
a last-resort net (log + alert + exit fast) for bugs outside any request/pipeline scope — paired
with a process manager for restart, not a way to keep serving from a possibly-corrupted state.
See [deploy/mollire.service.example](../../deploy/mollire.service.example).

## API

| Method | Path                       | Auth  | Description                              |
|--------|----------------------------|-------|-------------------------------------------|
| POST   | `/projects`                | user  | Register a project                        |
| GET    | `/projects`                | user  | List your own projects                    |
| GET    | `/projects/:slug`          | user  | Project detail + last 10 deployments      |
| POST   | `/projects/:slug/deploy`   | user  | Trigger a deploy (runs in background)     |
| GET    | `/deployments/:id`         | user  | Deployment status/log                     |
| GET    | `/users/me`                | user  | Current user (id, email, role)            |
| POST   | `/notifications/subscribe` | user  | Register a web push subscription          |
| DELETE | `/notifications/subscribe` | user  | Remove a web push subscription            |
| GET    | `/admin/projects`          | admin | All projects, every tenant                |
| GET    | `/admin/projects/:slug`    | admin | Any project's detail + deployment history |
| GET    | `/admin/deployments/:id`   | admin | Any deployment's status/log               |

## Not built yet

- Docker/sandboxed builds — `buildCommand` still runs directly on the host (env stripped to
  PATH/HOME only, but no process isolation). Accepted trust boundary for single-operator use;
  must land before this is opened to anyone beyond the operator.
- Wildcard TLS cert automation
