import { useMutation, useQueryClient } from "@tanstack/react-query";
import { galleryApi } from "../api/gallery.api";
import type { GalleryComment, GalleryProjectDetail } from "../types";
import { galleryKeys } from "./keys";

export function useAddComment(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => galleryApi.addComment(slug, body),
    onSuccess: (created) => {
      queryClient.setQueryData<GalleryComment[]>(galleryKeys.comments(slug), (comments) => [
        ...(comments ?? []),
        created,
      ]);
      queryClient.setQueryData<GalleryProjectDetail>(galleryKeys.detail(slug), (detail) =>
        detail ? { ...detail, comments: detail.comments + 1 } : detail,
      );
    },
    meta: { errorMessage: "Erro ao comentar" },
  });
}

export function useDeleteComment(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => galleryApi.deleteComment(slug, commentId),
    onSuccess: (_data, commentId) => {
      queryClient.setQueryData<GalleryComment[]>(galleryKeys.comments(slug), (comments) =>
        comments?.filter((comment) => comment.id !== commentId),
      );
      queryClient.setQueryData<GalleryProjectDetail>(galleryKeys.detail(slug), (detail) =>
        detail ? { ...detail, comments: Math.max(0, detail.comments - 1) } : detail,
      );
    },
    meta: { successMessage: "Comentário removido", errorMessage: "Erro ao remover comentário" },
  });
}

// Marcar/desmarcar "útil": otimista, e o servidor confirma em silêncio.
export function useToggleHelpful(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, helpful }: { commentId: string; helpful: boolean }) =>
      helpful ? galleryApi.markHelpful(slug, commentId) : galleryApi.unmarkHelpful(slug, commentId),
    onMutate: async ({ commentId, helpful }) => {
      await queryClient.cancelQueries({ queryKey: galleryKeys.comments(slug) });
      const previous = queryClient.getQueryData<GalleryComment[]>(galleryKeys.comments(slug));
      queryClient.setQueryData<GalleryComment[]>(galleryKeys.comments(slug), (comments) =>
        comments?.map((comment) => (comment.id === commentId ? { ...comment, helpful } : comment)),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(galleryKeys.comments(slug), context.previous);
    },
    meta: { errorMessage: "Erro ao marcar o comentário" },
  });
}
