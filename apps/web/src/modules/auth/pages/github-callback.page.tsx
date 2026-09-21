import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ApiError } from "@/shared/lib/http";
import { PendingScreen } from "../components/pending-screen";
import { useCreateSessionFromTokens, useInstallGithubApp } from "../hooks/use-auth-mutations";

// One redirect URI serves two GitHub flows:
//  - login (OAuth): Supabase returns the tokens in the URL hash;
//  - App installation: GitHub returns installation_id in the query.
export default function GithubCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const createSession = useCreateSessionFromTokens();
  const installApp = useInstallGithubApp();
  // Both calls are one-shot and StrictMode runs effects twice in dev.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const installationId = searchParams.get("installation_id");
    const setupAction = searchParams.get("setup_action");

    // OAuth login flow — tokens arrive in the URL hash (implicit flow)
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const access_token = hash.get("access_token");
    const refresh_token = hash.get("refresh_token");
    const expires_in = Number(hash.get("expires_in") ?? 3600);
    if (access_token && refresh_token) {
      createSession
        .mutateAsync({ access_token, refresh_token, expires_in })
        .then(() => navigate("/", { replace: true }))
        .catch(() => navigate("/login?error=github", { replace: true }));
      return;
    }

    // GitHub App installation flow
    if (setupAction === "request" || !installationId) {
      navigate("/", { replace: true });
      return;
    }

    installApp
      .mutateAsync(Number(installationId))
      .then(() => navigate("/perfil?github=conectado", { replace: true }))
      .catch((error) => {
        const msg = error instanceof ApiError ? error.message : "Erro ao conectar GitHub";
        navigate(`/perfil?github=erro&msg=${encodeURIComponent(msg)}`, { replace: true });
      });
  }, [createSession, installApp, navigate, searchParams]);

  return <PendingScreen label="Conectando…" />;
}
