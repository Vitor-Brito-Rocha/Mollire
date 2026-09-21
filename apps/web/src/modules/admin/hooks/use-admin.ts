import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api/admin.api";
import type { InviteAdminResponse } from "../types";
import { adminKeys } from "./keys";

// The admin screens render their own error state, with a retry button.
export function useAdminProjects() {
  return useQuery({
    queryKey: adminKeys.projects(),
    queryFn: adminApi.projects,
    staleTime: 0,
    meta: { silent: true },
  });
}

export function useAdminProject(slug: string) {
  return useQuery({
    queryKey: adminKeys.project(slug),
    queryFn: () => adminApi.project(slug),
    staleTime: 0,
    meta: { silent: true },
  });
}

export function useAdmins() {
  return useQuery({
    queryKey: adminKeys.admins(),
    queryFn: adminApi.admins,
    staleTime: 0,
    meta: { silent: true },
  });
}

function inviteMessage(result: InviteAdminResponse): string {
  switch (result.status) {
    case "already_admin":
      return `${result.user.email} já é admin`;
    case "promoted":
      return `${result.user.email} agora é admin`;
    case "invited":
      return `Convite criado — ${result.invite.email} vira admin no próximo login`;
  }
}

export function useInviteAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.inviteAdmin,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.admins() }),
    meta: { successMessage: inviteMessage, errorMessage: "Erro ao convidar admin" },
  });
}
