# Mollire Web

Next.js dashboard for Mollire — tenant project management and a read-only admin section.
Deploys to Vercel; talks to `apps/api` over HTTP (never touches the database directly).

## Stack

- Next.js (App Router) + TypeScript + Tailwind v4
- shadcn/ui (`base-nova` style, Base UI primitives — not Radix; components use a `render` prop
  for polymorphism, not `asChild`)
- Supabase Auth via `@supabase/ssr` for session handling; the API is authorized separately
  through the same Supabase-issued JWT, verified by `apps/api`

## Setup

```bash
cd apps/web
npm install
cp .env.local.example .env.local   # Supabase URL/anon key, API URL, VAPID public key
npm run dev
```

## What's here

- `(auth)/login`, `(auth)/signup` — email/password via Supabase Auth
- `(dashboard)/` — a tenant's own projects: create, deploy, watch build logs (polls while a
  deploy is in flight)
- `admin/` — every tenant's projects/deployments, gated client-side by `GET /users/me`'s role
  (the real enforcement is server-side, in `apps/api`'s `RolesGuard`)
- `lib/push.ts` + `public/sw.js` — web push subscribe/unsubscribe flow

Sensitive values (DB credentials, the VAPID private key, the Supabase service-role key) never
appear here — only `NEXT_PUBLIC_*` values, all safe to expose.
