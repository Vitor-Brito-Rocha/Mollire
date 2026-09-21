import { http, ApiError } from "@/shared/lib/http";
import { clearSession, resetSession } from "../lib/session";

// Auth goes through the API, which sets the session as httpOnly cookies on its
// own origin — the browser never sees a token, so there's nothing here to store.
type Result = { error?: string };

// `onSuccess` keeps the cached session honest: credentials changed, so what we
// knew about "who is logged in" is stale.
async function run(call: () => Promise<unknown>, onSuccess: () => void = resetSession): Promise<Result> {
  try {
    await call();
    onSuccess();
    return {};
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Não foi possível falar com o servidor." };
  }
}

export const signIn = (email: string, password: string) =>
  run(() => http.post("/auth/login", { email, password }));

export const signUp = (email: string, password: string) =>
  run(() => http.post("/auth/signup", { email, password }));

export const requestPasswordReset = (email: string) => run(() => http.post("/auth/forgot", { email }), () => {});

export const confirmEmailLink = (token_hash: string, type: string) =>
  run(() => http.post("/auth/confirm", { token_hash, type }));

export const updatePassword = (password: string) => run(() => http.put("/auth/password", { password }));

export const signOut = () => run(() => http.post("/auth/logout"), clearSession);

export function hasSession(): Promise<boolean> {
  return http.get("/users/me").then(
    () => true,
    () => false,
  );
}
