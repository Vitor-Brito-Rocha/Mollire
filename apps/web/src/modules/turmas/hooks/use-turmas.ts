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

export function useTurmaGallery(id: string) {
  return useQuery({
    queryKey: turmaKeys.gallery(id),
    queryFn: () => turmasApi.gallery(id),
    // Compartilhada: outros enviam e estrelam; sempre pergunta de novo ao abrir.
    staleTime: 0,
    meta: { errorMessage: "Não foi possível carregar os projetos da turma." },
  });
}
