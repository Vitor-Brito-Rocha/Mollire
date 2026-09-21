import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { galleryApi } from "../api/gallery.api";
import type { GalleryFilter } from "../types";
import { galleryKeys } from "./keys";

// Switching filters keeps the previous grid on screen (dimmed, see
// `isPlaceholderData`) instead of flashing skeletons.
export function useGalleryProjects(filter: GalleryFilter) {
  return useQuery({
    queryKey: galleryKeys.list(filter),
    queryFn: () => galleryApi.list(filter),
    placeholderData: keepPreviousData,
    // Public, shared data that others (and the owner's own publish toggle)
    // change: always ask again when the screen opens.
    staleTime: 0,
    meta: { errorMessage: "Erro ao carregar a galeria" },
  });
}

// The screen renders its own "not found" / error state.
export function useGalleryProject(slug: string) {
  return useQuery({
    queryKey: galleryKeys.detail(slug),
    queryFn: () => galleryApi.detail(slug),
    staleTime: 0,
    meta: { silent: true },
  });
}

// A failed comments load reads as "no comments yet" instead of an error toast.
export function useComments(slug: string) {
  return useQuery({
    queryKey: galleryKeys.comments(slug),
    queryFn: () => galleryApi.comments(slug),
    meta: { silent: true },
  });
}
