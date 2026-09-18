// The web app keeps the Supabase session in an httpOnly cookie (set by
// @supabase/ssr on the Next side) that the browser also sends here, so no
// token ever lives in JS. That cookie is `sb-<project-ref>-auth-token`; a
// session JSON bigger than one cookie is split into `.0`, `.1`, ... chunks,
// and the value is "base64-" + base64url(JSON) — this undoes both.
const COOKIE_NAME = /^(sb-.+-auth-token)(?:\.(\d+))?$/;
const BASE64_PREFIX = 'base64-';

export function readSessionToken(cookieHeader: string | undefined): string | undefined {
  if (!cookieHeader) return undefined;

  const chunks = new Map<string, { index: number; value: string }[]>();
  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const match = COOKIE_NAME.exec(part.slice(0, eq).trim());
    if (!match) continue;

    let value: string;
    try {
      value = decodeURIComponent(part.slice(eq + 1).trim());
    } catch {
      continue;
    }
    const list = chunks.get(match[1]) ?? [];
    list.push({ index: match[2] ? Number(match[2]) : 0, value });
    chunks.set(match[1], list);
  }

  for (const list of chunks.values()) {
    const joined = list
      .sort((a, b) => a.index - b.index)
      .map((chunk) => chunk.value)
      .join('');

    try {
      const json = joined.startsWith(BASE64_PREFIX)
        ? Buffer.from(joined.slice(BASE64_PREFIX.length), 'base64url').toString('utf8')
        : joined;
      const token = (JSON.parse(json) as { access_token?: unknown }).access_token;
      if (typeof token === 'string' && token) return token;
    } catch {
      // Malformed cookie — treated as "no session".
    }
  }
  return undefined;
}
