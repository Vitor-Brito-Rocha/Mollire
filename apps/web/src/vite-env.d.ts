/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_VAPID_PUBLIC_KEY: string;
  readonly VITE_GITHUB_APP_SLUG: string;
  // Root domain projects are published under (the API's DOMAIN); only login redirects
  // back to *.this-domain are honoured. Optional: unset = in-app paths only.
  readonly VITE_PROJECTS_DOMAIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
