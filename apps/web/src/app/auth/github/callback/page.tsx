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
    const installationId = searchParams.get("installation_id");
    const setupAction = searchParams.get("setup_action");

    // GitHub also redirects here on "request" (org needs approval) — nothing to save.
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
