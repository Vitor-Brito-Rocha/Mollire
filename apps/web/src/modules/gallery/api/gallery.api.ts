import { http } from "@/shared/lib/http";
import type { Snapshot } from "@/modules/projects";
import type { GalleryComment, GalleryFilter, GalleryProject, GalleryProjectDetail, StarState } from "../types";

// Endpoint calls only — they throw ApiError. Caching, optimism and toasts
// belong to the hooks.
export const galleryApi = {
  list: (filter: GalleryFilter) => http.get<GalleryProject[]>(`/gallery?filter=${filter}`),
  detail: (slug: string) => http.get<GalleryProjectDetail>(`/gallery/${slug}`),
  snapshots: (slug: string) => http.get<Snapshot[]>(`/gallery/${slug}/snapshots`),

  star: (slug: string) => http.post<StarState>(`/gallery/${slug}/star`),
  unstar: (slug: string) => http.delete<StarState>(`/gallery/${slug}/star`),

  comments: (slug: string) => http.get<GalleryComment[]>(`/gallery/${slug}/comments`),
  addComment: (slug: string, body: string) => http.post<GalleryComment>(`/gallery/${slug}/comments`, { body }),
  deleteComment: (slug: string, id: string) => http.delete<void>(`/gallery/${slug}/comments/${id}`),
  // Só o dono do projeto marca; quem comentou ganha XP na primeira marcação.
  markHelpful: (slug: string, id: string) => http.post<void>(`/gallery/${slug}/comments/${id}/helpful`),
  unmarkHelpful: (slug: string, id: string) => http.delete<void>(`/gallery/${slug}/comments/${id}/helpful`),
};
