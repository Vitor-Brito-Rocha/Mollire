// Every cached read of this module lives under ["projects", …] so a whole
// project (or everything) can be invalidated by prefix.
export const projectKeys = {
  all: ["projects"] as const,
  list: () => [...projectKeys.all, "list"] as const,
  detail: (slug: string) => [...projectKeys.all, "detail", slug] as const,
  analytics: (slug: string) => [...projectKeys.all, "analytics", slug] as const,
  activity: (slug: string) => [...projectKeys.all, "activity", slug] as const,
  envVars: (slug: string) => [...projectKeys.all, "env", slug] as const,
  rootDirCheck: (repositoryUrl: string, rootDir: string) =>
    [...projectKeys.all, "root-dir-check", repositoryUrl, rootDir] as const,
  members: (slug: string) => [...projectKeys.all, "members", slug] as const,
};
