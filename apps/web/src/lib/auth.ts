import { api, ApiError } from "./api";

// Auth goes through the API, which sets the session as httpOnly cookies on its
// own origin — the browser never sees a token, so there's nothing here to store.
type Result = { error?: string };

async function run(call: () => Promise<unknown>): Promise<Result> {
  try {
    await call();
    return {};
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Não foi possível falar com o servidor." };
  }
}

export const signIn = (email: string, password: string) =>
  run(() => api.post("/auth/login", { email, password }));

export const signUp = (email: string, password: string) =>
  run(() => api.post("/auth/signup", { email, password }));

export const requestPasswordReset = (email: string) => run(() => api.post("/auth/forgot", { email }));

export const confirmEmailLink = (token_hash: string, type: string) =>
  run(() => api.post("/auth/confirm", { token_hash, type }));

export const updatePassword = (password: string) => run(() => api.put("/auth/password", { password }));

export const signOut = () => run(() => api.post("/auth/logout"));

export function hasSession(): Promise<boolean> {
  return api.get("/users/me").then(
    () => true,
    () => false,
  );
}
