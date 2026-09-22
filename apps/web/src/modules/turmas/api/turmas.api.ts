import type { StarState } from "@/modules/gallery";
import { http } from "@/shared/lib/http";
import type {
  GradeInput,
  JoinResult,
  MilestoneDetail,
  NewMilestone,
  NewTurma,
  PublicTurma,
  TurmaDetail,
  TurmaGroup,
  TurmaMilestone,
  TurmaProgress,
  TurmaProject,
  TurmaStudent,
  TurmaSummary,
} from "../types";

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
  progress: (id: string) => http.get<TurmaProgress>(`/turmas/${id}/progress`),

  addGroup: (id: string, body: { name: string; max_size: number }) => http.post<TurmaGroup>(`/turmas/${id}/groups`, body),
  removeGroup: (id: string, groupId: string) => http.delete<void>(`/turmas/${id}/groups/${groupId}`),
  joinGroup: (id: string, groupId: string) => http.post<void>(`/turmas/${id}/groups/${groupId}/join`),
  leaveGroup: (id: string) => http.delete<void>(`/turmas/${id}/group`),

  gallery: (id: string) => http.get<TurmaProject[]>(`/turmas/${id}/gallery`),
  submitProject: (id: string, slug: string) => http.post<void>(`/turmas/${id}/projects`, { project_slug: slug }),
  removeSubmission: (id: string, slug: string) => http.delete<void>(`/turmas/${id}/projects/${slug}`),
  grade: (id: string, slug: string, body: GradeInput) => http.post<void>(`/turmas/${id}/projects/${slug}/grade`, body),
  star: (id: string, slug: string) => http.post<StarState>(`/turmas/${id}/projects/${slug}/star`),
  unstar: (id: string, slug: string) => http.delete<StarState>(`/turmas/${id}/projects/${slug}/star`),

  milestones: (id: string) => http.get<TurmaMilestone[]>(`/turmas/${id}/milestones`),
  milestone: (id: string, milestoneId: string) => http.get<MilestoneDetail>(`/turmas/${id}/milestones/${milestoneId}`),
  addMilestone: (id: string, body: NewMilestone) => http.post<TurmaMilestone>(`/turmas/${id}/milestones`, body),
  updateMilestone: (id: string, milestoneId: string, body: Partial<NewMilestone>) =>
    http.patch<TurmaMilestone>(`/turmas/${id}/milestones/${milestoneId}`, body),
  removeMilestone: (id: string, milestoneId: string) => http.delete<void>(`/turmas/${id}/milestones/${milestoneId}`),
};
