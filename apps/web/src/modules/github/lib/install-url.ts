// Where GitHub lets the user install the Mollire App (slug = VITE_GITHUB_APP_SLUG).
export const githubInstallUrl = () =>
  `https://github.com/apps/${import.meta.env.VITE_GITHUB_APP_SLUG}/installations/new`;
