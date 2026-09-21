import { queryClient } from "@/shared/lib/query-client";
import type { CurrentUser } from "../types";

// One cached copy of "who is logged in" (GET /users/me) shared by the header,
// the route guards and every page that shows level, stars or the handle.
// `null` means "asked, nobody is logged in" — never an error on public screens.
export const sessionKey = ["session"] as const;

// After logging in (or any credential change) the cached answer is wrong:
// drop it so the next reader asks the API again.
export function resetSession() {
  queryClient.removeQueries({ queryKey: sessionKey });
}

// Something that feeds the session user changed on the server (GitHub connected
// or removed…): mark it stale so mounted readers refetch it.
export function invalidateSession() {
  return queryClient.invalidateQueries({ queryKey: sessionKey });
}

// Profile edits return the fresh user; write it through instead of refetching.
export function setSessionUser(user: CurrentUser) {
  queryClient.setQueryData(sessionKey, user);
}

// Logout: everyone watching the session flips to "signed out" at once (guards
// redirect, header shows Entrar) and nothing from the old user stays cached.
export function clearSession() {
  queryClient.setQueryData(sessionKey, null);
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== sessionKey[0] });
}
