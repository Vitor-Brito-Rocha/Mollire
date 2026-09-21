import { Navigate, Outlet } from "react-router";
import { useCurrentUser } from "@/modules/auth";
import { PageSpinner } from "@/shared/ui/spinner";
import { useSessionUser } from "./use-session-user";

// The session is an httpOnly cookie only the API can see, so "am I logged in"
// is asked of the API (cached: see auth's session). UX gate only — every
// protected route is guarded server-side anyway. Children render once this
// passes, so no page fires unauthenticated calls first.
export function RequireAuth() {
  const { user, loading } = useCurrentUser();

  if (loading) return <PageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// Must sit under <RequireAuth />. The real boundary is the backend's RolesGuard
// on every /admin/* route — a tenant redirected here never had a way to fetch
// the data in the first place.
export function RequireAdmin() {
  const user = useSessionUser();
  if (user.role !== "ADMIN") return <Navigate to="/" replace />;
  return <Outlet />;
}
