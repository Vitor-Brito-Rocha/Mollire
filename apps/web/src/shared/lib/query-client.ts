import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, getErrorMessage } from "./http";

// Every request gets visible feedback by default; opt out per call via `meta`.
//
//   useMutation({ mutationFn, meta: { successMessage: "Projeto criado" } })  -> success toast
//   useMutation({ mutationFn, meta: { errorMessage: "Falha ao salvar" } })   -> fallback for non-API errors
//   useMutation({ mutationFn, meta: { silent: true } })                      -> no toast (screen handles it)
//   useQuery({ queryKey, queryFn, meta: { silent: true } })                  -> no toast on failure
declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: { silent?: boolean; errorMessage?: string };
    mutationMeta: { silent?: boolean; successMessage?: string; errorMessage?: string };
  }
}

// 4xx are the caller's answer (bad credentials, not found, forbidden): retrying
// won't change them. Only network blips and 5xx are worth another attempt.
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status_code < 500) return false;
  return failureCount < 2;
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.meta?.silent) return;
      // Stable id: the same failing query (refetch loops, several observers)
      // shows one toast, not a stack of them.
      toast.error(getErrorMessage(error, query.meta?.errorMessage), { id: query.queryHash });
    },
  }),
  mutationCache: new MutationCache({
    onSuccess: (_data, _variables, _context, mutation) => {
      if (mutation.meta?.silent || !mutation.meta?.successMessage) return;
      toast.success(mutation.meta.successMessage);
    },
    onError: (error, _variables, _context, mutation) => {
      if (mutation.meta?.silent) return;
      toast.error(getErrorMessage(error, mutation.meta?.errorMessage));
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: shouldRetry,
      // Refetching on every tab focus would re-toast errors and flicker the HUD.
      refetchOnWindowFocus: false,
    },
  },
});
