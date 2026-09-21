import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { galleryApi } from "../api/gallery.api";
import type { GalleryProject, GalleryProjectDetail, StarState } from "../types";
import { galleryKeys } from "./keys";

type Variables = {
  slug: string;
  // The state *before* the click: true = the viewer has starred it, so this removes it.
  starred: boolean;
};

type Snapshot = {
  lists: [QueryKey, GalleryProject[] | undefined][];
  detail: GalleryProjectDetail | undefined;
};

// A star is a gesture, so it should feel instant: the count and the button flip
// the moment it is clicked — in every cached list and in the detail — and are
// put back if the server says no (the error toast comes from the query client).
// When the server answers, its numbers replace the guess.
export function useToggleStar() {
  const queryClient = useQueryClient();

  // The same patch applied to a project wherever it is cached.
  function patchProject(slug: string, patch: (current: StarState) => StarState) {
    queryClient.setQueriesData<GalleryProject[]>({ queryKey: galleryKeys.lists() }, (projects) =>
      projects?.map((project) => (project.slug === slug ? { ...project, ...patch(project) } : project)),
    );
    queryClient.setQueryData<GalleryProjectDetail>(galleryKeys.detail(slug), (detail) =>
      detail ? { ...detail, ...patch(detail) } : detail,
    );
  }

  return useMutation<StarState, Error, Variables, Snapshot>({
    mutationFn: ({ slug, starred }) => (starred ? galleryApi.unstar(slug) : galleryApi.star(slug)),

    onMutate: async ({ slug, starred }) => {
      // An in-flight refetch would overwrite the guess with the old numbers.
      await queryClient.cancelQueries({ queryKey: galleryKeys.lists() });
      await queryClient.cancelQueries({ queryKey: galleryKeys.detail(slug) });

      const snapshot: Snapshot = {
        lists: queryClient.getQueriesData<GalleryProject[]>({ queryKey: galleryKeys.lists() }),
        detail: queryClient.getQueryData<GalleryProjectDetail>(galleryKeys.detail(slug)),
      };

      patchProject(slug, (current) => ({
        starred_by_viewer: !starred,
        stars: Math.max(0, current.stars + (starred ? -1 : 1)),
      }));

      return snapshot;
    },

    onError: (_error, { slug }, snapshot) => {
      if (!snapshot) return;
      snapshot.lists.forEach(([key, data]) => queryClient.setQueryData(key, data));
      queryClient.setQueryData(galleryKeys.detail(slug), snapshot.detail);
    },

    onSuccess: (result, { slug }) => patchProject(slug, () => result),

    meta: { errorMessage: "Erro ao dar estrela" },
  });
}
