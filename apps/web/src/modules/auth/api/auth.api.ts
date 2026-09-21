import { http } from "@/shared/lib/http";
import type { CurrentUser } from "../types";

// Auth goes through the API, which sets the session as httpOnly cookies on its
// own origin — the browser never sees a token, so there's nothing here to store.
// Plain endpoint calls: they throw ApiError on failure. Toasts and the cached
// session are the hooks' business (see ../hooks/use-auth-mutations.ts).

export const fetchCurrentUser = () => http.get<CurrentUser | null>("/users/me");

export const signIn = (email: string, password: string) => http.post<void>("/auth/login", { email, password });

export const signUp = (email: string, password: string) => http.post<void>("/auth/signup", { email, password });

export const requestPasswordReset = (email: string) => http.post<void>("/auth/forgot", { email });

export const confirmEmailLink = (token_hash: string, type: string) =>
  http.post<void>("/auth/confirm", { token_hash, type });

export const updatePassword = (password: string) => http.put<void>("/auth/password", { password });

export const signOut = () => http.post<void>("/auth/logout");

// OAuth (GitHub) login: Supabase hands the tokens back in the URL hash and the
// API turns them into the session cookies.
export const createSessionFromTokens = (tokens: { access_token: string; refresh_token: string; expires_in: number }) =>
  http.post<void>("/auth/session", tokens);

// The GitHub App's install redirect lands on the same callback URL as GitHub
// login, so the call lives here for now; the profile module (which lists the
// connected accounts) is its natural home.
export const installGithubApp = (installationId: number) =>
  http.post<void>("/github/install", { installation_id: installationId });
