import { useQuery } from "@tanstack/react-query";
import { progressApi } from "../api/progress.api";
import { progressKeys } from "./keys";

// Todos silenciosos: se o back ainda não tem o endpoint, o bloco some, sem toast.

export function useQuests(enabled: boolean) {
  return useQuery({
    queryKey: progressKeys.quests(),
    queryFn: progressApi.quests,
    enabled,
    staleTime: 30_000,
    meta: { silent: true },
  });
}

// `handle` = "me" para o próprio usuário.
export function useAchievements(handle: string | null) {
  return useQuery({
    queryKey: progressKeys.achievements(handle ?? ""),
    queryFn: () => (handle === "me" ? progressApi.myAchievements() : progressApi.achievementsOf(handle ?? "")),
    enabled: !!handle,
    staleTime: 60_000,
    meta: { silent: true },
  });
}

export function useXpHistory(enabled: boolean) {
  return useQuery({
    queryKey: progressKeys.xpHistory(),
    queryFn: () => progressApi.xpHistory(),
    enabled,
    staleTime: 30_000,
    meta: { silent: true },
  });
}

// As regras valem por um dia; sem o endpoint, quem chama usa o espelho do catálogo.
export function useXpRules() {
  return useQuery({
    queryKey: progressKeys.rules(),
    queryFn: progressApi.rules,
    staleTime: 24 * 60 * 60 * 1000,
    meta: { silent: true },
  });
}
