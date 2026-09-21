import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "../api/projects.api";
import { projectKeys } from "./keys";

export function useEnvVars(slug: string) {
  return useQuery({
    queryKey: projectKeys.envVars(slug),
    queryFn: () => projectsApi.envVars(slug),
    meta: { errorMessage: "Não foi possível carregar as variáveis de ambiente." },
  });
}

export function useSaveEnvVar(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => projectsApi.saveEnvVar(slug, key, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.envVars(slug) }),
    meta: {
      successMessage: (_data: void, { key }: { key: string; value: string }) => `${key} salvo`,
      errorMessage: "Erro ao salvar variável",
    },
  });
}

export function useDeleteEnvVar(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => projectsApi.deleteEnvVar(slug, key),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.envVars(slug) }),
    meta: {
      successMessage: (_data: void, key: string) => `${key} removido`,
      errorMessage: "Erro ao remover variável",
    },
  });
}
