// A repository the connected GitHub account can turn into a project.
export type GithubRepo = {
  id: number;
  full_name: string;
  name: string;
  private: boolean;
  html_url: string;
  clone_url: string;
  default_branch: string;
};

// One installation of the Mollire GitHub App (a personal account or an org).
export type GithubAccount = {
  installation_id: string;
  account_login: string;
  account_avatar_url: string;
  account_type: string;
  repository_selection: string;
};
