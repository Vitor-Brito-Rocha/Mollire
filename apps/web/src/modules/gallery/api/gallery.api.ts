import { http } from "@/shared/lib/http";
import type { GalleryComment, GalleryFilter, GalleryProject, GalleryProjectDetail, StarState } from "../types";

// Endpoint calls only — they throw ApiError. Caching, optimism and toasts
// belong to the hooks.
export const galleryApi = {
  list: (filter: GalleryFilter) => http.get<GalleryProject[]>(`/gallery?filter=${filter}`),
  detail: (slug: string) => http.get<GalleryProjectDetail>(`/gallery/${slug}`),

  star: (slug: string) => http.post<StarState>(`/gallery/${slug}/star`),
  unstar: (slug: string) => http.delete<StarState>(`/gallery/${slug}/star`),

  comments: (slug: string) => http.get<GalleryComment[]>(`/gallery/${slug}/comments`),
  addComment: (slug: string, body: string) => http.post<GalleryComment>(`/gallery/${slug}/comments`, { body }),
  deleteComment: (slug: string, id: string) => http.delete<void>(`/gallery/${slug}/comments/${id}`),
};
