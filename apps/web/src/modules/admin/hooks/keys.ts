export const adminKeys = {
  all: ["admin"] as const,
  projects: () => [...adminKeys.all, "projects"] as const,
  project: (slug: string) => [...adminKeys.all, "project", slug] as const,
  admins: () => [...adminKeys.all, "admins"] as const,
};
