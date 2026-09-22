import { useMutation, useQueryClient } from "@tanstack/react-query";
import { turmasApi } from "../api/turmas.api";
import type { NewTurma, TurmaProject } from "../types";
import { turmaKeys } from "./keys";

export function useCreateTurma() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: NewTurma) => turmasApi.create(body),
    onSuccess: (created) => {
      queryClient.setQueryData(turmaKeys.detail(created.id), created);
      return queryClient.invalidateQueries({ queryKey: turmaKeys.mine() });
    },
    meta: { successMessage: "Turma criada", errorMessage: "Erro ao criar a turma" },
  });
}

export function useJoinByCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => turmasApi.joinByCode(code),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: turmaKeys.mine() }),
        queryClient.invalidateQueries({ queryKey: turmaKeys.public() }),
      ]),
    meta: { successMessage: "Você entrou na turma", errorMessage: "Código inválido ou turma cheia" },
  });
}

export function useJoinPublic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => turmasApi.joinPublic(id),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: turmaKeys.mine() }),
        queryClient.invalidateQueries({ queryKey: turmaKeys.public() }),
      ]),
    meta: { successMessage: "Você entrou na turma", errorMessage: "Não foi possível entrar na turma" },
  });
}

// Tudo que muda a turma invalida o detalhe (grupos, contagens) e a lista de alunos.
function useTurmaInvalidation(id: string) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: turmaKeys.detail(id) }),
      queryClient.invalidateQueries({ queryKey: turmaKeys.students(id) }),
      queryClient.invalidateQueries({ queryKey: turmaKeys.gallery(id) }),
    ]);
}

export function useAddGroup(id: string) {
  const invalidate = useTurmaInvalidation(id);
  return useMutation({
    mutationFn: (body: { name: string; max_size: number }) => turmasApi.addGroup(id, body),
    onSuccess: invalidate,
    meta: { successMessage: "Grupo criado", errorMessage: "Erro ao criar o grupo" },
  });
}

export function useRemoveGroup(id: string) {
  const invalidate = useTurmaInvalidation(id);
  return useMutation({
    mutationFn: (groupId: string) => turmasApi.removeGroup(id, groupId),
    onSuccess: invalidate,
    meta: { successMessage: "Grupo removido", errorMessage: "Erro ao remover o grupo" },
  });
}

export function useJoinGroup(id: string) {
  const invalidate = useTurmaInvalidation(id);
  return useMutation({
    mutationFn: (groupId: string) => turmasApi.joinGroup(id, groupId),
    onSuccess: invalidate,
    meta: { successMessage: "Você entrou no grupo", errorMessage: "Grupo cheio ou indisponível" },
  });
}

export function useLeaveGroup(id: string) {
  const invalidate = useTurmaInvalidation(id);
  return useMutation({
    mutationFn: () => turmasApi.leaveGroup(id),
    onSuccess: invalidate,
    meta: { successMessage: "Você saiu do grupo", errorMessage: "Erro ao sair do grupo" },
  });
}

export function useSubmitProject(id: string) {
  const invalidate = useTurmaInvalidation(id);
  return useMutation({
    mutationFn: (slug: string) => turmasApi.submitProject(id, slug),
    onSuccess: invalidate,
    meta: { successMessage: "Projeto enviado para a turma", errorMessage: "Erro ao enviar o projeto" },
  });
}

export function useRemoveSubmission(id: string) {
  const invalidate = useTurmaInvalidation(id);
  return useMutation({
    mutationFn: (slug: string) => turmasApi.removeSubmission(id, slug),
    onSuccess: invalidate,
    meta: { successMessage: "Projeto retirado da turma", errorMessage: "Erro ao retirar o projeto" },
  });
}

export function useGradeProject(id: string) {
  const invalidate = useTurmaInvalidation(id);
  return useMutation({
    mutationFn: ({ slug, grade }: { slug: string; grade: number }) => turmasApi.grade(id, slug, grade),
    onSuccess: invalidate,
    meta: { successMessage: "Nota salva", errorMessage: "Erro ao salvar a nota" },
  });
}

// Estrela otimista na galeria da turma, como na galeria normal.
export function useToggleTurmaStar(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, starred }: { slug: string; starred: boolean }) =>
      starred ? turmasApi.unstar(id, slug) : turmasApi.star(id, slug),
    onMutate: async ({ slug, starred }) => {
      await queryClient.cancelQueries({ queryKey: turmaKeys.gallery(id) });
      const previous = queryClient.getQueryData<TurmaProject[]>(turmaKeys.gallery(id));
      queryClient.setQueryData<TurmaProject[]>(turmaKeys.gallery(id), (projects) =>
        projects?.map((p) =>
          p.slug === slug ? { ...p, starred_by_viewer: !starred, stars: p.stars + (starred ? -1 : 1) } : p,
        ),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(turmaKeys.gallery(id), context.previous);
    },
    onSuccess: (state, { slug }) => {
      queryClient.setQueryData<TurmaProject[]>(turmaKeys.gallery(id), (projects) =>
        projects?.map((p) => (p.slug === slug ? { ...p, ...state } : p)),
      );
    },
    meta: { errorMessage: "Não foi possível dar a estrela" },
  });
}
