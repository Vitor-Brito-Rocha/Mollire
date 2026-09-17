"use client";

import { useEffect, useState } from "react";
import { api, type CurrentUser } from "@/lib/api";

// Sessão nas telas públicas: quem está logado ganha nível e estrelas marcadas;
// quem não está simplesmente não tem usuário — nunca é erro.
export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<CurrentUser>("/users/me")
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}
