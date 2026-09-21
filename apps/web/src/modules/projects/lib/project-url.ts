// Projects are published at <slug>.<DOMAIN> (the API's DOMAIN). The fallback is
// the production domain; dev sets VITE_PROJECTS_DOMAIN (localtest.me, plain http).
const DOMAIN = import.meta.env.VITE_PROJECTS_DOMAIN || "aulvi.com.br";
const PROTOCOL = import.meta.env.DEV ? "http" : "https";

export const projectHost = (slug: string) => `${slug}.${DOMAIN}`;
export const projectUrl = (slug: string) => `${PROTOCOL}://${projectHost(slug)}`;
