import type { CookieOptions } from '@supabase/ssr';

// @supabase/ssr sets its session cookies readable from JS by default (the
// browser client needs that). Nothing in the browser touches the session
// here — auth runs in server actions — so the cookies are locked down: JS
// can't read the token, so an XSS can't steal it.
//
// COOKIE_DOMAIN (e.g. ".example.com") is what lets the browser also send the
// cookie to the API on a sibling subdomain (api.example.com), which is how
// the API authenticates without any token in JS. Unset in local dev: the
// cookie stays host-only, and localhost:3000 / localhost:4000 share it anyway
// (cookies don't isolate by port).
export function hardenCookie(options: CookieOptions): CookieOptions {
  return {
    ...options,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
  };
}
