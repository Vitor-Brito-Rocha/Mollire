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
cp .env.example .env   # DATABASE_URL, SUPABASE_PROJECT_URL, VAPID_* keys
npx prisma migrate dev
npx playwright install chromium   # needed for gallery thumbnail capture
npm run start:dev
```

## Multi-tenancy & roles

- Every project belongs to a user (`user_id`). The `User` row is provisioned lazily from the
  verified Supabase JWT on a user's first authenticated request — there's no signup webhook.
  `role` lives on that row (`Role.ADMIN` / `Role.TENANT`, default `TENANT`) — it is never read
  from the JWT itself.
- The very first admin is a manual DB action (no bootstrap env var):
  `UPDATE users SET role = 'ADMIN' WHERE email = '...';` — that user must have logged in once
  already, since the row is provisioned lazily.
- From there, any admin can grant the role to someone else via `POST /admin/admins { email }`.
  If that email already has a `User` row, it's promoted immediately. If not (hasn't logged in
  yet), it's parked in `AdminInvite` and redeemed — role set to `ADMIN` — the moment that email
  first authenticates (`SupabaseAuthService.syncUser`). `GET /admin/admins` lists current admins
  plus pending invites. Only ever promotes, never demotes.
- Every tenant-facing query is scoped by `user_id`; an ownership mismatch returns **404**, not
  403, so a tenant can't even confirm another tenant's slug exists.
- `/admin/projects*`, `/admin/deployments/*` are strictly **read-only** (view every tenant's
  projects/deployments/logs); `/admin/admins*` is the one mutating exception. All gated by
  `RolesGuard` + `@Roles('ADMIN')`, none sharing a code path with the tenant-facing services.

## Gallery & XP

- A project is private by default. Its owner publishes it via
  `PATCH /projects/:slug/visibility { is_public: true }`; only then does it show up in
  `GET /gallery`. Unpublishing just flips it back to private — no data is deleted.
- Stars are a `ProjectStar(project_id, user_id)` row — one per viewer per project, given via
  `POST /gallery/:slug/star` and removed via `DELETE /gallery/:slug/star`. A project's own owner
  can't star it. `GET /gallery?filter=recentes|destaque|todos` returns each project's star count
  and whether the current viewer has starred it (`recentes`/`todos`: newest first; `destaque`:
  most-starred first).
- `xp` lives on `User`, incremented directly wherever it's earned (no separate ledger table):
  **+10** on every successful deploy (**+50** extra the first time ever for that user), **+20**
  once when a project is first published to the gallery (re-publishing after unpublishing doesn't
  pay it again — tracked by `Project.published_at`), **+5** to a project's owner each time someone
  else stars it. `level`/`next` are never stored — `GET /users/me` derives them from `xp` on read
  (see `common/level.ts`).
- Thumbnails are real screenshots, not uploads: the first successful deploy of a project *after*
  it's public triggers a headless Playwright capture of `{slug}.{DOMAIN}` (`GalleryModule`'s
  `ThumbnailService`), saved to `THUMBNAILS_DIR` and served at `GET /thumbnails/{slug}.png`. A
  failed capture never fails the deploy — the gallery just shows no thumbnail until the next one.

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
| PATCH  | `/projects/:slug/visibility` | user | Publish/unpublish a project to the gallery |
| POST   | `/projects/:slug/deploy`   | user  | Trigger a deploy (runs in background)     |
| GET    | `/deployments/:id`         | user  | Deployment status/log                     |
| GET    | `/users/me`                | user  | Current user (id, email, role, xp, level, next) |
| GET    | `/gallery`                 | user  | Public projects (`?filter=recentes\|destaque\|todos`) |
| POST   | `/gallery/:slug/star`      | user  | Star a public project                     |
| DELETE | `/gallery/:slug/star`      | user  | Remove your star                          |
| POST   | `/notifications/subscribe` | user  | Register a web push subscription          |
| DELETE | `/notifications/subscribe` | user  | Remove a web push subscription            |
| GET    | `/admin/projects`          | admin | All projects, every tenant                |
| GET    | `/admin/projects/:slug`    | admin | Any project's detail + deployment history |
| GET    | `/admin/deployments/:id`   | admin | Any deployment's status/log               |
| GET    | `/admin/admins`            | admin | Current admins + pending invites          |
| POST   | `/admin/admins`            | admin | Promote a user / invite an email to ADMIN |

## Not built yet

- Docker/sandboxed builds — `buildCommand` still runs directly on the host (env stripped to
  PATH/HOME only, but no process isolation). Accepted trust boundary for single-operator use;
  must land before this is opened to anyone beyond the operator.
- Wildcard TLS cert automation
