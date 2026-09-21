import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { projectsApi } from "../api/projects.api";
import { isSupportedRepositoryUrl, isValidRootDir, normalizeRootDir } from "../lib/root-dir";
import type { RootDirCheckStatus } from "../types";
import { projectKeys } from "./keys";

// idle: nada a verificar (pasta vazia = raiz, ou ainda sem repositório).
export type RootDirState = "idle" | "checking" | "invalid" | RootDirCheckStatus;

// Pergunta à API, enquanto a pessoa digita, se a pasta existe no repositório.
// Só orienta o formulário; quem recusa de verdade é o servidor ao salvar.
// `settledRootDir` é a pasta já parada de mudar: é ela que serve de base para
// outras consultas (a detecção do package.json), sem uma requisição por tecla.
export function useRootDirCheck(repositoryUrl: string, rootDir: string) {
  const normalized = normalizeRootDir(rootDir);
  const settledRootDir = useDebouncedValue(normalized);
  const settledUrl = useDebouncedValue(repositoryUrl);

  const enabled = settledRootDir !== "" && isValidRootDir(settledRootDir) && isSupportedRepositoryUrl(settledUrl);
  const query = useQuery({
    queryKey: projectKeys.rootDirCheck(settledUrl, settledRootDir),
    queryFn: () => projectsApi.checkRootDir(settledUrl, settledRootDir),
    enabled,
    staleTime: 60_000,
    retry: false,
    meta: { silent: true },
  });

  let state: RootDirState;
  if (normalized === "" || !isSupportedRepositoryUrl(repositoryUrl)) state = "idle";
  else if (!isValidRootDir(normalized)) state = "invalid";
  else if (normalized !== settledRootDir || repositoryUrl !== settledUrl || query.isPending) state = "checking";
  else if (query.isError) state = "unverified";
  else state = query.data.status;

  return { state, settledRootDir };
}

// O que impede de salvar: a pasta provadamente não está lá, ou a verificação
// ainda está em andamento.
export const blocksSubmit = (state: RootDirState) =>
  state === "invalid" || state === "checking" || state === "missing" || state === "not_a_directory";
