import { useQuery } from "@tanstack/react-query";
import { fetchCurrentUser } from "../api/auth.api";
import { sessionKey } from "../lib/session";

// Sessão em qualquer tela: quem está logado ganha nível e estrelas marcadas;
// quem não está simplesmente não tem usuário — nunca é erro (sem toast).
export function useCurrentUser() {
  const { data, isPending } = useQuery({
    queryKey: sessionKey,
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 5 * 60_000,
    meta: { silent: true },
  });

  return { user: data ?? null, loading: isPending };
}
