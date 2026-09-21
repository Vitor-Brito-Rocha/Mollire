import { useCurrentUser } from "@/modules/auth";

// The logged-in user, for code under <RequireAuth />. Public screens use
// useCurrentUser() instead, where "nobody" is a normal answer.
export function useSessionUser() {
  const { user } = useCurrentUser();
  if (!user) throw new Error("useSessionUser() used outside <RequireAuth />");
  return user;
}
