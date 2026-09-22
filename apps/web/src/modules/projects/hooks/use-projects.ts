import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { galleryKeys } from "@/modules/gallery";
import { projectsApi, type NewProject, type ProjectPatch } from "../api/projects.api";
import { isInFlight, latestDeployment } from "../lib/deployments";
import type { DeploymentNote, Project } from "../types";
import { projectKeys } from "./keys";

// `silent`: quem só decora a tela com a lista (a barra lateral) não avisa se
// ela falhar — a tela principal já avisa.
export function useProjects({ silent = false }: { silent?: boolean } = {}) {
  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: projectsApi.list,
    meta: silent ? { silent: true } : { errorMessage: "Não foi possível carregar seus projetos." },
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

export function useUpdateProject(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: ProjectPatch) => projectsApi.update(slug, patch),
    onSuccess: (updated) => {
      // A resposta é só a linha do projeto: mescla, para não perder deploys e papel.
      queryClient.setQueryData<Project>(projectKeys.detail(slug), (previous) =>
        previous ? { ...previous, ...updated } : updated,
      );
      return queryClient.invalidateQueries({ queryKey: projectKeys.list() });
    },
    meta: { successMessage: "Configuração salva", errorMessage: "Erro ao salvar configuração" },
  });
}

// Diário de bordo (docs/api-diario-de-bordo.md): grava no deploy dentro do
// projeto em cache, sem refazer a tela.
export function useSetDeploymentNote(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ deploymentId, text }: { deploymentId: string; text: string }) =>
      projectsApi.setDeploymentNote(slug, deploymentId, text),
    onSuccess: (note: DeploymentNote | null, { deploymentId }) => {
      queryClient.setQueryData<Project>(projectKeys.detail(slug), (previous) =>
        previous
          ? { ...previous, deployments: previous.deployments?.map((d) => (d.id === deploymentId ? { ...d, note } : d)) }
          : previous,
      );
    },
    meta: { successMessage: "Diário salvo", errorMessage: "Erro ao salvar o diário" },
  });
}

export function useDeleteProject(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (confirmName: string) => projectsApi.remove(slug, confirmName),
    // Sem `return` e sem tocar no cache do próprio projeto: a tela ainda está
    // montada quando isto roda (quem chamou navega em seguida), e remover ou
    // refazer o detalhe agora pediria um projeto que já não existe, com um toast
    // de erro. Ao sair da tela o polling para e o cache velho é descartado.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectKeys.list() });
      void queryClient.invalidateQueries({ queryKey: galleryKeys.all });
    },
    meta: { successMessage: "Projeto apagado", errorMessage: "Erro ao apagar projeto" },
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
