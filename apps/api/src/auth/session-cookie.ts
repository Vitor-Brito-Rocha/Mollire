import type { Response } from 'express';

// The session lives in two httpOnly cookies set by this API (never readable
// from JS): a short-lived access token, sent on every call, and the refresh
// token, scoped to /auth so it only travels to the endpoints that use it.
export const ACCESS_COOKIE = 'mollire_at';
export const REFRESH_COOKIE = 'mollire_rt';

const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;

export type Session = { access_token: string; refresh_token: string; expires_in: number };

export function readCookie(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1 || part.slice(0, eq).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(eq + 1).trim()) || undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

// COOKIE_CROSS_SITE=true is for a web app and API on *different sites* (web on
// vercel.app, API through an ngrok tunnel): SameSite=None + Partitioned is the
// only way a browser sends the cookie there, and it breaks in Safari. Off is
// the normal mode — web and API on sibling subdomains (COOKIE_DOMAIN=.example.com)
// or both on localhost. See docs/pendencias.md.
function attributes(path: string, maxAge: number): string {
  const crossSite = process.env.COOKIE_CROSS_SITE === 'true';
  const parts = [`Path=${path}`, `Max-Age=${maxAge}`, 'HttpOnly'];
  if (crossSite) {
    parts.push('Secure', 'SameSite=None', 'Partitioned');
  } else {
    parts.push('SameSite=Lax');
    if (process.env.NODE_ENV === 'production') parts.push('Secure');
    if (process.env.COOKIE_DOMAIN) parts.push(`Domain=${process.env.COOKIE_DOMAIN}`);
  }
  return parts.join('; ');
}

// Written by hand: Express's res.cookie() (cookie@0.7) has no `Partitioned`.
function setCookie(res: Response, name: string, value: string, path: string, maxAge: number) {
  res.append('Set-Cookie', `${name}=${encodeURIComponent(value)}; ${attributes(path, maxAge)}`);
}

export function setSessionCookies(res: Response, session: Session) {
  setCookie(res, ACCESS_COOKIE, session.access_token, '/', session.expires_in);
  setCookie(res, REFRESH_COOKIE, session.refresh_token, '/auth', REFRESH_MAX_AGE);
}

export function clearSessionCookies(res: Response) {
  setCookie(res, ACCESS_COOKIE, '', '/', 0);
  setCookie(res, REFRESH_COOKIE, '', '/auth', 0);
}
