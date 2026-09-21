import { http } from "@/shared/lib/http";
import type { GithubAccount, GithubRepo } from "../types";

// Endpoint calls only — they throw ApiError.
export const githubApi = {
  accounts: () => http.get<GithubAccount[]>("/github/accounts"),
  // Repositories that don't have a project yet.
  availableRepos: () => http.get<GithubRepo[]>("/github/repos?available=true"),
  // GitHub's redirect after installing the App hands us the installation id.
  install: (installationId: number) => http.post<void>("/github/install", { installation_id: installationId }),
  disconnect: (installationId: string) => http.delete<void>(`/github/install/${installationId}`),
};
