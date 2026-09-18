"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { confirmEmailLink } from "@/lib/auth";

// Landing page of every auth email link (signup confirmation, password
// recovery): the token_hash in the URL is traded, through the API, for the
// session cookie before moving on into the app.
export default function ConfirmPage() {
  return (
    <Suspense>
      <Confirm />
    </Suspense>
  );
}

function Confirm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");
    const next = searchParams.get("next") ?? "/";

    if (!tokenHash || !type) {
      router.replace("/login?error=link_invalido");
      return;
    }

    confirmEmailLink(tokenHash, type).then(({ error }) => {
      // Only same-site paths: `next` comes from the URL.
      router.replace(error ? "/login?error=link_invalido" : next.startsWith("/") && !next.startsWith("//") ? next : "/");
    });
  }, [router, searchParams]);

  return <p className="text-muted-foreground p-6 text-center text-sm">Confirmando…</p>;
}
