# Mollire Web

Vite + React dashboard for Mollire — tenant project management, the public gallery and a
read-only admin section. A static SPA deployed to Vercel; talks to `apps/api` over HTTP (never
touches the database directly). Auth is the API's: the session lives in httpOnly cookies and this
app never sees a token.

## Stack

- Vite + React 19 + TypeScript (strict) + Tailwind v4
- React Router (data router, every page is a lazy route) + TanStack Query
- shadcn/ui (`base-nova` style, Base UI primitives — not Radix; components use a `render` prop
  for polymorphism, not `asChild`)

## Setup

```bash
cd apps/web
npm install
cp .env.local.example .env.local   # API URL, VAPID public key, GitHub App slug
npm run dev                         # http://localhost:3000 (fixed: API CORS + dev nginx point here)
```

Scripts: `dev`, `build` (typecheck + bundle to `dist/`), `preview`, `lint`, `typecheck`.
Only `VITE_*` values are read, all safe to expose (they are baked into the bundle at build time).

## Layout

```
src/
  main.tsx            fonts, styles, providers, router
  app/                router.tsx (routes), guards.tsx (RequireAuth/RequireAdmin), layouts/
  modules/<domain>/   auth · projects · gallery · profile · admin · notifications
    api/  hooks/  components/  pages/  lib/  types.ts  index.ts
  shared/             ui/ (shadcn) · components/ · hooks/ · lib/ (http client, query client, utils)
  styles/globals.css
```

- **One shell.** `app/layouts/app-layout.tsx` renders the top bar once (session-aware: level,
  notifications, admin, avatar, sign out / sign in) around every screen with a menu; only the
  routed content changes. Auth screens use their own centred layout (no session yet).
- **Module boundaries** (enforced by eslint): a module imports another only through its
  `index.ts`; `shared/*` never imports `modules/*`. Pages are the exception — `app/router.tsx`
  imports them by path so each page is its own chunk.
- **API access.** `shared/lib/http` is the only place that calls `fetch` (cookies, 401 → one
  shared refresh → retry, `ApiError`). Modules wrap endpoints in `api/*.api.ts`.
- **Session.** `useCurrentUser()` reads one cached `GET /users/me` shared by the header, the
  guards and public pages; `null` means "nobody logged in", never an error.
- **Feedback.** Every request shows progress (spinner/skeleton, disabled buttons) and every
  outcome a toast. `shared/lib/query-client.ts` toasts failed queries/mutations by default; opt
  out or add a success message per call via `meta` (`silent`, `successMessage`, `errorMessage`).

## Deploy (Vercel)

Framework preset Vite, build `npm run build`, output `dist`. `vercel.json` rewrites every path to
`index.html` (client-side routing); static assets are served before the rewrite.
