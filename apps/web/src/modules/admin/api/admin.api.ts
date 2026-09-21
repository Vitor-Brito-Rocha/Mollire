import { http } from "@/shared/lib/http";
import type { Project } from "@/modules/projects";
import type { AdminsList, InviteAdminResponse } from "../types";

// Endpoint calls only — they throw ApiError. Caching and toasts belong to the hooks.
export const adminApi = {
  projects: () => http.get<Project[]>("/admin/projects"),
  project: (slug: string) => http.get<Project>(`/admin/projects/${slug}`),
  admins: () => http.get<AdminsList>("/admin/admins"),
  inviteAdmin: (email: string) => http.post<InviteAdminResponse>("/admin/admins", { email }),
};
