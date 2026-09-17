# Email templates

HTML templates for Supabase Auth's transactional emails. Supabase doesn't
expose a public API for these — they have to be pasted into the dashboard by
hand:

**Supabase Dashboard → Authentication → Emails**

- `confirm-signup.html` → "Confirm signup" template
- `reset-password.html` → "Reset Password" template

Both templates link to `apps/web/src/app/auth/confirm/route.ts`, which
verifies the token server-side (via `supabase.auth.verifyOtp`) and sets the
session cookie before redirecting into the app — this is what lets
`/reset-password` see an authenticated user.

## Required dashboard settings

- **Site URL** (Authentication → URL Configuration) must point at the
  deployed frontend (e.g. `https://mollire.aulvi.com.br`) — the templates use
  `{{ .SiteURL }}` to build the confirmation link.
- **Redirect URLs** allowlist must include `{{ .SiteURL }}/auth/confirm`.
- For local dev, add `http://localhost:3000/auth/confirm` to the same
  allowlist and temporarily set Site URL to `http://localhost:3000` (or use a
  separate dev Supabase project).

## Logo

Both templates have the `<img>` tag commented out — most mail clients block
images from a host they don't recognize yet, and Vercel doesn't have a stable
URL for `apps/web/public/brand/icon-light.png` until the frontend is
deployed. Once it is, uncomment the `<img>` tag and set `LOGO_URL` to the
deployed icon path.
