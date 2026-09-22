import { createBrowserRouter, type RouteObject } from "react-router";
import { PageSpinner } from "@/shared/ui/spinner";
import { RequireAdmin, RequireAuth } from "./guards";
import AdminLayout from "./layouts/admin-layout";
import AppLayout from "./layouts/app-layout";
import AuthLayout from "./layouts/auth-layout";
import RootLayout from "./layouts/root-layout";
import { NotFound, RouteError } from "./route-error";

// Pages are default exports; React Router wants `Component`. Each page becomes
// its own chunk, fetched on first navigation.
const page = (load: () => Promise<{ default: React.ComponentType }>): Pick<RouteObject, "lazy"> => ({
  lazy: async () => ({ Component: (await load()).default }),
});

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    hydrateFallbackElement: <PageSpinner />,
    children: [
      // Same top bar everywhere it exists; only the routed content swaps.
      {
        element: <AppLayout />,
        children: [
          // Public
          { path: "galeria", ...page(() => import("@/modules/gallery/pages/gallery.page")) },
          { path: "galeria/:slug", ...page(() => import("@/modules/gallery/pages/gallery-detail.page")) },
          { path: "u/:handle", ...page(() => import("@/modules/profile/pages/public-profile.page")) },

          // Signed in
          {
            element: <RequireAuth />,
            children: [
              { index: true, ...page(() => import("@/modules/projects/pages/projects-list.page")) },
              { path: "perfil", ...page(() => import("@/modules/profile/pages/perfil.page")) },
              { path: "configuracoes", ...page(() => import("@/modules/settings/pages/configuracoes.page")) },
              { path: "projects/new", ...page(() => import("@/modules/projects/pages/new-project.page")) },
              { path: "projects/:slug", ...page(() => import("@/modules/projects/pages/project-detail.page")) },
              {
                path: "projects/:slug/analytics",
                ...page(() => import("@/modules/projects/pages/project-analytics.page")),
              },
              { path: "turmas", ...page(() => import("@/modules/turmas/pages/turmas-list.page")) },
              { path: "turmas/nova", ...page(() => import("@/modules/turmas/pages/turma-create.page")) },
              { path: "turmas/:id", ...page(() => import("@/modules/turmas/pages/turma-detail.page")) },
              {
                path: "admin",
                element: <RequireAdmin />,
                children: [
                  {
                    element: <AdminLayout />,
                    children: [
                      { index: true, ...page(() => import("@/modules/admin/pages/admin-projects.page")) },
                      { path: "admins", ...page(() => import("@/modules/admin/pages/admin-admins.page")) },
                      { path: "projects/:slug", ...page(() => import("@/modules/admin/pages/admin-project.page")) },
                    ],
                  },
                ],
              },
            ],
          },

          { path: "*", element: <NotFound /> },
        ],
      },

      // Auth flow: centred card, no menu (there is no session yet)
      {
        element: <AuthLayout />,
        children: [
          { path: "login", ...page(() => import("@/modules/auth/pages/login.page")) },
          { path: "signup", ...page(() => import("@/modules/auth/pages/signup.page")) },
          { path: "forgot-password", ...page(() => import("@/modules/auth/pages/forgot-password.page")) },
          { path: "reset-password", ...page(() => import("@/modules/auth/pages/reset-password.page")) },
        ],
      },
      // Redirect-only screens
      { path: "auth/confirm", ...page(() => import("@/modules/auth/pages/confirm.page")) },
      { path: "auth/github/callback", ...page(() => import("@/modules/auth/pages/github-callback.page")) },
    ],
  },
]);
