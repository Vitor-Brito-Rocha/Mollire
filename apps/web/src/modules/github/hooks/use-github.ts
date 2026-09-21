import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { githubApi } from "../api/github.api";

const githubKeys = {
  all: ["github"] as const,
  accounts: () => [...githubKeys.all, "accounts"] as const,
  repos: () => [...githubKeys.all, "repos"] as const,
  buildScript: (repo: string, rootDir: string) => [...githubKeys.all, "build-script", repo, rootDir] as const,
};

// `enabled`: nothing to ask while the user hasn't connected GitHub.

// A side list on the profile: if it fails it stays empty instead of shouting.
export function useGithubAccounts(enabled: boolean) {
  return useQuery({
    queryKey: githubKeys.accounts(),
    queryFn: githubApi.accounts,
    enabled,
    meta: { silent: true },
  });
}

export function useGithubRepos(enabled: boolean) {
  return useQuery({
    queryKey: githubKeys.repos(),
    queryFn: githubApi.availableRepos,
    enabled,
    meta: { errorMessage: "Não foi possível carregar os repositórios" },
  });
}

// Reads the package.json in `rootDir` of the repo ("" = the root) to suggest a
// build command. Only a hint: on failure the user keeps the manual field.
export function useBuildScript(repo: { installation_id: string; full_name: string } | null, rootDir: string) {
  return useQuery({
    queryKey: githubKeys.buildScript(repo?.full_name ?? "", rootDir),
    queryFn: () => githubApi.buildScript(repo!.installation_id, repo!.full_name, rootDir),
    enabled: !!repo,
    meta: { silent: true },
  });
}

export function useDisconnectGithub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (installationId: string) => githubApi.disconnect(installationId),
    onSuccess: async () => {
      // The repo list depends on which accounts are connected.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: githubKeys.accounts() }),
        queryClient.invalidateQueries({ queryKey: githubKeys.repos() }),
      ]);
    },
    meta: { successMessage: "Conta GitHub desconectada", errorMessage: "Erro ao desconectar GitHub" },
  });
}

// Runs from the redirect landing page, which reports the outcome itself.
export function useInstallGithubApp() {
  return useMutation({
    mutationFn: githubApi.install,
    meta: { silent: true },
  });
}
