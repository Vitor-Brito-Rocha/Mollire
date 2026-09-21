// `?next=` arrives from the URL, so it is untrusted: a crafted login link must
// not be able to send someone (right after they typed their password) to an
// arbitrary site. Two destinations are legitimate:
//   - a path inside this app ("/projects/x")
//   - a page of a published project, which nginx sends here when it needs a
//     login (https://<slug>.<projects domain>/...)

// Root domain projects are published under (the API's DOMAIN). Empty = only
// in-app paths are accepted.
const PROJECTS_DOMAIN = import.meta.env.VITE_PROJECTS_DOMAIN?.toLowerCase() ?? "";

export type Destination = { kind: "internal"; path: string } | { kind: "external"; url: string };

export function resolveNext(next: string | null): Destination | null {
  if (!next) return null;

  // "//host" and "/\host" are protocol-relative in disguise.
  if (next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")) {
    return { kind: "internal", path: next };
  }

  try {
    const url = new URL(next);
    const host = url.hostname.toLowerCase();
    const isProject = PROJECTS_DOMAIN !== "" && host.endsWith(`.${PROJECTS_DOMAIN}`);
    if ((url.protocol === "https:" || url.protocol === "http:") && isProject) {
      return { kind: "external", url: url.href };
    }
  } catch {
    // Not a URL at all.
  }
  return null;
}

// Where to send someone who needs an account for what they just tried (star,
// comment…): the login, with a way back to this very screen afterwards.
export const loginPathFor = (returnTo: string) => `/login?next=${encodeURIComponent(returnTo)}`;
