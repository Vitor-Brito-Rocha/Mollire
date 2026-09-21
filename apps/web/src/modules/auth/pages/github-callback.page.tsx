import { useNavigate, useSearchParams } from "react-router";
import { resetSession } from "../lib/session";
import { Suspense, useEffect } from "react";
import { http, ApiError } from "@/shared/lib/http";

export default function GithubCallbackPage() {
  return (
    <Suspense>
      <GithubCallback />
    </Suspense>
  );
}

function GithubCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const installationId = searchParams.get("installation_id");
    const setupAction = searchParams.get("setup_action");

    // OAuth login flow — tokens arrive in the URL hash (implicit flow)
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const access_token = hash.get("access_token");
    const refresh_token = hash.get("refresh_token");
    const expires_in = Number(hash.get("expires_in") ?? 3600);
    if (access_token && refresh_token) {
      http
        .post("/auth/session", { access_token, refresh_token, expires_in })
        .then(() => {
          resetSession();
          navigate("/", { replace: true });
        })
        .catch(() => navigate("/login?error=github", { replace: true }));
      return;
    }

    // GitHub App installation flow
    if (setupAction === "request" || !installationId) {
      navigate("/", { replace: true });
      return;
    }

    http
      .post("/github/install", { installation_id: Number(installationId) })
      .then(() => navigate("/perfil?github=conectado", { replace: true }))
      .catch((err) => {
        const msg = err instanceof ApiError ? err.message : "Erro ao conectar GitHub";
        navigate(`/perfil?github=erro&msg=${encodeURIComponent(msg)}`, { replace: true });
      });
  }, [navigate, searchParams]);

  return <p className="text-muted-foreground p-6 text-center text-sm">Conectando GitHub…</p>;
}
