import type { StarState } from "@/modules/gallery";
import { http } from "@/shared/lib/http";
import type { JoinResult, NewTurma, PublicTurma, TurmaDetail, TurmaGroup, TurmaProject, TurmaStudent, TurmaSummary } from "../types";

// Endpoint calls only — they throw ApiError. Caching, optimism and toasts
// belong to the hooks.
export const turmasApi = {
  create: (body: NewTurma) => http.post<TurmaDetail>("/turmas", body),
  joinByCode: (code: string) => http.post<JoinResult>("/turmas/join", { code }),
  joinPublic: (id: string) => http.post<JoinResult>(`/turmas/${id}/join`),
  mine: () => http.get<TurmaSummary[]>("/turmas/mine"),
  public: () => http.get<PublicTurma[]>("/turmas/public"),
  detail: (id: string) => http.get<TurmaDetail>(`/turmas/${id}`),
  students: (id: string) => http.get<TurmaStudent[]>(`/turmas/${id}/students`),

  addGroup: (id: string, body: { name: string; max_size: number }) => http.post<TurmaGroup>(`/turmas/${id}/groups`, body),
  removeGroup: (id: string, groupId: string) => http.delete<void>(`/turmas/${id}/groups/${groupId}`),
  joinGroup: (id: string, groupId: string) => http.post<void>(`/turmas/${id}/groups/${groupId}/join`),
  leaveGroup: (id: string) => http.delete<void>(`/turmas/${id}/group`),

  gallery: (id: string) => http.get<TurmaProject[]>(`/turmas/${id}/gallery`),
  submitProject: (id: string, slug: string) => http.post<void>(`/turmas/${id}/projects`, { project_slug: slug }),
  removeSubmission: (id: string, slug: string) => http.delete<void>(`/turmas/${id}/projects/${slug}`),
  grade: (id: string, slug: string, grade: number) => http.post<void>(`/turmas/${id}/projects/${slug}/grade`, { grade }),
  star: (id: string, slug: string) => http.post<StarState>(`/turmas/${id}/projects/${slug}/star`),
  unstar: (id: string, slug: string) => http.delete<StarState>(`/turmas/${id}/projects/${slug}/star`),
};
