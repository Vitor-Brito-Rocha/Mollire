import { useQuery } from "@tanstack/react-query";
import { turmasApi } from "../api/turmas.api";
import { turmaKeys } from "./keys";

// `silent`: a barra lateral usa só para decidir se mostra o item "Turmas";
// uma falha ali não vira toast.
export function useMyTurmas(enabled: boolean, options: { silent?: boolean } = {}) {
  return useQuery({
    queryKey: turmaKeys.mine(),
    queryFn: turmasApi.mine,
    enabled,
    meta: options.silent ? { silent: true } : { errorMessage: "Não foi possível carregar suas turmas." },
  });
}

export function usePublicTurmas(enabled: boolean) {
  return useQuery({
    queryKey: turmaKeys.public(),
    queryFn: turmasApi.public,
    enabled,
    meta: { silent: true },
  });
}

// The screen renders its own "not found" state.
export function useTurma(id: string) {
  return useQuery({
    queryKey: turmaKeys.detail(id),
    queryFn: () => turmasApi.detail(id),
    meta: { silent: true },
  });
}

export function useTurmaStudents(id: string, enabled: boolean) {
  return useQuery({
    queryKey: turmaKeys.students(id),
    queryFn: () => turmasApi.students(id),
    enabled,
    meta: { errorMessage: "Não foi possível carregar os alunos." },
  });
}

// `live`: o modo apresentação relê a cada poucos segundos, para as estrelas
// contarem na parede enquanto a turma vota pelo celular.
export function useTurmaGallery(id: string, options: { live?: boolean } = {}) {
  return useQuery({
    queryKey: turmaKeys.gallery(id),
    queryFn: () => turmasApi.gallery(id),
    // Compartilhada: outros enviam e estrelam; sempre pergunta de novo ao abrir.
    staleTime: 0,
    refetchInterval: options.live ? 5_000 : false,
    meta: { errorMessage: "Não foi possível carregar os projetos da turma." },
  });
}

// Os dois abaixo são das ideias de grupos (docs/api-grupos.md): enquanto o
// back não responde, o bloco correspondente não aparece — por isso silenciosos.

export function useTurmaProgress(id: string) {
  return useQuery({
    queryKey: turmaKeys.progress(id),
    queryFn: () => turmasApi.progress(id),
    meta: { silent: true },
  });
}

export function useTurmaMilestones(id: string) {
  return useQuery({
    queryKey: turmaKeys.milestones(id),
    queryFn: () => turmasApi.milestones(id),
    meta: { silent: true },
  });
}

// "Quem entregou": só o professor abre, e só quando pede.
export function useMilestoneDetail(id: string, milestoneId: string | null) {
  return useQuery({
    queryKey: turmaKeys.milestone(id, milestoneId ?? ""),
    queryFn: () => turmasApi.milestone(id, milestoneId ?? ""),
    enabled: milestoneId !== null,
    meta: { errorMessage: "Não foi possível carregar a entrega." },
  });
}
