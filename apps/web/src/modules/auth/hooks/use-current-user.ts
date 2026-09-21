import { useQuery } from "@tanstack/react-query";
import { http } from "@/shared/lib/http";
import { sessionKey } from "../lib/session";
import type { CurrentUser } from "../types";

// Sessão em qualquer tela: quem está logado ganha nível e estrelas marcadas;
// quem não está simplesmente não tem usuário — nunca é erro (sem toast).
export function useCurrentUser() {
  const { data, isPending } = useQuery({
    queryKey: sessionKey,
    queryFn: () => http.get<CurrentUser | null>("/users/me"),
    retry: false,
    staleTime: 5 * 60_000,
    meta: { silent: true },
  });

  return { user: data ?? null, loading: isPending };
}
