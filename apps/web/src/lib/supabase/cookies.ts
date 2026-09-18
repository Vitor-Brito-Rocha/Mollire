import type { CookieOptions } from '@supabase/ssr';

// @supabase/ssr sets its session cookies readable from JS by default (the
// browser client needs that). Nothing in the browser touches the session
// here — auth runs in server actions and the API goes through /api/proxy —
// so the cookies are locked down: JS can't read the token, so an XSS can't
// steal it.
export function hardenCookie(options: CookieOptions): CookieOptions {
  return {
    ...options,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  };
}
