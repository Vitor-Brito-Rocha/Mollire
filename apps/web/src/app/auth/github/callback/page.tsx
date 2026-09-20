"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { api, ApiError } from "@/lib/api";

export default function GithubCallbackPage() {
  return (
    <Suspense>
      <GithubCallback />
    </Suspense>
  );
}

function GithubCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const installationId = searchParams.get("installation_id");
    const setupAction = searchParams.get("setup_action");

    // OAuth login flow — tokens arrive in the URL hash (implicit flow)
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const access_token = hash.get("access_token");
    const refresh_token = hash.get("refresh_token");
    const expires_in = Number(hash.get("expires_in") ?? 3600);
    if (access_token && refresh_token) {
      api
        .post("/auth/session", { access_token, refresh_token, expires_in })
        .then(() => {
          router.replace("/");
          router.refresh();
        })
        .catch(() => router.replace("/login?error=github"));
      return;
    }

    // GitHub App installation flow
    if (setupAction === "request" || !installationId) {
      router.replace("/");
      return;
    }

    api
      .post("/github/install", { installation_id: Number(installationId) })
      .then(() => router.replace("/perfil?github=conectado"))
      .catch((err) => {
        const msg = err instanceof ApiError ? err.message : "Erro ao conectar GitHub";
        router.replace(`/perfil?github=erro&msg=${encodeURIComponent(msg)}`);
      });
  }, [router, searchParams]);

  return <p className="text-muted-foreground p-6 text-center text-sm">Conectando GitHub…</p>;
}
