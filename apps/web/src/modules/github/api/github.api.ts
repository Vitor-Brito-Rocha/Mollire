import { http } from "@/shared/lib/http";
import type { BuildScriptDetection, GithubAccount, GithubRepo } from "../types";

// Endpoint calls only — they throw ApiError.
export const githubApi = {
  accounts: () => http.get<GithubAccount[]>("/github/accounts"),
  // Repositories that don't have a project yet.
  availableRepos: () => http.get<GithubRepo[]>("/github/repos?available=true"),
  // rootDir: the folder of the repo to read package.json from ("" = the root).
  buildScript: (installationId: string, repo: string, rootDir: string) =>
    http.get<BuildScriptDetection>(
      `/github/build-script?installation_id=${installationId}&repo=${encodeURIComponent(repo)}&root_dir=${encodeURIComponent(rootDir)}`,
    ),
  // GitHub's redirect after installing the App hands us the installation id.
  install: (installationId: number) => http.post<void>("/github/install", { installation_id: installationId }),
  disconnect: (installationId: string) => http.delete<void>(`/github/install/${installationId}`),
};
