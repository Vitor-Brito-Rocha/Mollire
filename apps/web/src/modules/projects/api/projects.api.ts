import { http } from "@/shared/lib/http";
import type {
  EnvVar,
  InviteMemberResponse,
  MembersList,
  Project,
  ProjectActivity,
  ProjectAnalytics,
} from "../types";

// Endpoint calls only — they throw ApiError. Caching, toasts and invalidation
// belong to the hooks.

export type NewProject = {
  name: string;
  slug: string;
  repository_url: string;
  build_command: string;
  output_dir: string;
};

export const projectsApi = {
  list: () => http.get<Project[]>("/projects"),
  get: (slug: string) => http.get<Project>(`/projects/${slug}`),
  create: (project: NewProject) => http.post<Project>("/projects", project),
  deploy: (slug: string, commitSha?: string) =>
    http.post<void>(`/projects/${slug}/deploy`, commitSha ? { commit_sha: commitSha } : undefined),
  setVisibility: (slug: string, isPublic: boolean) =>
    http.patch<Project>(`/projects/${slug}/visibility`, { is_public: isPublic }),

  analytics: (slug: string) => http.get<ProjectAnalytics>(`/analytics/${slug}`),
  activity: (slug: string) => http.get<ProjectActivity[]>(`/projects/${slug}/activity`),

  envVars: (slug: string) => http.get<EnvVar[]>(`/projects/${slug}/env`),
  saveEnvVar: (slug: string, key: string, value: string) =>
    http.put<void>(`/projects/${slug}/env/${encodeURIComponent(key)}`, { value }),
  deleteEnvVar: (slug: string, key: string) => http.delete<void>(`/projects/${slug}/env/${encodeURIComponent(key)}`),

  members: (slug: string) => http.get<MembersList>(`/projects/${slug}/members`),
  invite: (slug: string, email: string) => http.post<InviteMemberResponse>(`/projects/${slug}/invitations`, { email }),
  removeMember: (slug: string, userId: string) => http.delete<void>(`/projects/${slug}/members/${userId}`),
  revokeInvitation: (slug: string, id: string) => http.delete<void>(`/projects/${slug}/invitations/${id}`),

};
