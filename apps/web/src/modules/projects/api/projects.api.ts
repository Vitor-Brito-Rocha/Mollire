import { http } from "@/shared/lib/http";
import type {
  DeploymentNote,
  EnvVar,
  InviteMemberResponse,
  MembersList,
  Project,
  ProjectActivity,
  ProjectAnalytics,
  RootDirCheckStatus,
} from "../types";

// Endpoint calls only — they throw ApiError. Caching, toasts and invalidation
// belong to the hooks.

export type NewProject = {
  name: string;
  slug: string;
  repository_url: string;
  root_dir: string;
  build_command: string;
  output_dir: string;
};

// Só o que mudou vai no corpo; o slug não é editável.
export type ProjectPatch = Partial<Pick<NewProject, "name" | "repository_url" | "root_dir" | "build_command" | "output_dir">>;

export const projectsApi = {
  list: () => http.get<Project[]>("/projects"),
  get: (slug: string) => http.get<Project>(`/projects/${slug}`),
  create: (project: NewProject) => http.post<Project>("/projects", project),
  // Nada é salvo: só pergunta se a pasta existe no repositório.
  checkRootDir: (repositoryUrl: string, rootDir: string) =>
    http.post<{ status: RootDirCheckStatus }>("/projects/check-root-dir", {
      repository_url: repositoryUrl,
      root_dir: rootDir,
    }),
  update: (slug: string, patch: ProjectPatch) => http.patch<Project>(`/projects/${slug}`, patch),
  // O nome digitado volta no corpo: o servidor só apaga se conferir.
  remove: (slug: string, confirmName: string) =>
    http.delete<void>(`/projects/${slug}`, { confirm_name: confirmName }),
  deploy: (slug: string, commitSha?: string) =>
    http.post<void>(`/projects/${slug}/deploy`, commitSha ? { commit_sha: commitSha } : undefined),
  // Texto vazio apaga a anotação (a API responde null).
  setDeploymentNote: (slug: string, deploymentId: string, text: string) =>
    http.put<DeploymentNote | null>(`/projects/${slug}/deployments/${deploymentId}/note`, { text }),
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
