// Origins allowed to call this API from a browser (FRONTEND_URL, comma-separated).
// Empty means no browser origin is allowed: with cookie auth, a reflect-anything
// CORS fallback would let any site make credentialed requests.
export function frontendOrigins(): string[] {
  return (process.env.FRONTEND_URL ?? '')
    .split(',')
    .map((url) => url.trim().replace(/\/$/, ''))
    .filter(Boolean);
}
