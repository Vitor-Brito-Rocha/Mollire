import type { GalleryFilter } from "../types";

export const galleryKeys = {
  all: ["gallery"] as const,
  // Prefix of every filtered list — what optimistic updates walk over.
  lists: () => [...galleryKeys.all, "list"] as const,
  list: (filter: GalleryFilter) => [...galleryKeys.lists(), filter] as const,
  detail: (slug: string) => [...galleryKeys.all, "detail", slug] as const,
  comments: (slug: string) => [...galleryKeys.all, "comments", slug] as const,
  snapshots: (slug: string) => [...galleryKeys.all, "snapshots", slug] as const,
};
