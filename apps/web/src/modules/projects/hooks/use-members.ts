import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "../api/projects.api";
import type { InviteMemberResponse } from "../types";
import { projectKeys } from "./keys";

export function useMembers(slug: string) {
  return useQuery({
    queryKey: projectKeys.members(slug),
    queryFn: () => projectsApi.members(slug),
    meta: { errorMessage: "Não foi possível carregar os membros." },
  });
}

export function useInviteMember(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => projectsApi.invite(slug, email),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.members(slug) }),
    meta: {
      successMessage: (result: InviteMemberResponse) =>
        result.status === "added"
          ? `${result.member.handle} entrou no projeto`
          : `Convite criado — ${result.invitation.email} entra no primeiro login`,
      errorMessage: "Erro ao convidar",
    },
  });
}

export function useRemoveMember(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId }: { userId: string; handle: string }) => projectsApi.removeMember(slug, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.members(slug) }),
    meta: {
      successMessage: (_data: void, { handle }: { userId: string; handle: string }) =>
        `${handle} removido do projeto`,
      errorMessage: "Erro ao remover",
    },
  });
}

export function useRevokeInvitation(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectsApi.revokeInvitation(slug, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.members(slug) }),
    meta: { successMessage: "Convite cancelado", errorMessage: "Erro ao cancelar convite" },
  });
}
