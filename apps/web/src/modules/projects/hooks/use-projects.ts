import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectsApi, type NewProject } from "../api/projects.api";
import { isInFlight, latestDeployment } from "../lib/deployments";
import type { Project } from "../types";
import { projectKeys } from "./keys";

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: projectsApi.list,
    meta: { errorMessage: "Não foi possível carregar seus projetos." },
  });
}

// While a deploy is running the SSE stream (useDeploymentStream) pushes the
// updates and this only polls slowly as a safety net; when idle it polls every
// 5s to catch deploys started elsewhere (webhook, another member).
const POLL_IDLE_MS = 5_000;
const POLL_IN_FLIGHT_MS = 10_000;

export function useProject(slug: string) {
  return useQuery({
    queryKey: projectKeys.detail(slug),
    queryFn: () => projectsApi.get(slug),
    refetchInterval: (query) => {
      const latest = latestDeployment(query.state.data?.deployments);
      return latest && isInFlight(latest.status) ? POLL_IN_FLIGHT_MS : POLL_IDLE_MS;
    },
    meta: { errorMessage: "Não foi possível carregar o projeto." },
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (project: NewProject) => projectsApi.create(project),
    onSuccess: (created) => {
      queryClient.setQueryData<Project>(projectKeys.detail(created.slug), created);
      return queryClient.invalidateQueries({ queryKey: projectKeys.list() });
    },
    meta: { successMessage: "Projeto criado", errorMessage: "Erro ao criar projeto" },
  });
}

export function useDeploy(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commitSha?: string) => projectsApi.deploy(slug, commitSha),
    // The new deployment is QUEUED on the server: refetch so the list (and the
    // stream, which starts once the latest one is in flight) pick it up.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.detail(slug) }),
    meta: {
      successMessage: (_data: void, commitSha: string | undefined) =>
        commitSha ? `Re-deploy de ${commitSha.slice(0, 7)} disparado` : "Deploy disparado",
      errorMessage: "Erro ao disparar deploy",
    },
  });
}

export function useSetVisibility(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (isPublic: boolean) => projectsApi.setVisibility(slug, isPublic),
    onSuccess: (updated) => {
      queryClient.setQueryData<Project>(projectKeys.detail(slug), (previous) =>
        previous ? { ...previous, ...updated } : updated,
      );
    },
    meta: {
      successMessage: (_data: Project, isPublic: boolean) =>
        isPublic ? "Projeto publicado na galeria" : "Projeto removido da galeria",
      errorMessage: "Erro ao mudar visibilidade",
    },
  });
}
