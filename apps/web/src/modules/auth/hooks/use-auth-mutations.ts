import { useMutation } from "@tanstack/react-query";
import {
  confirmEmailLink,
  createSessionFromTokens,
  requestPasswordReset,
  signIn,
  signOut,
  signUp,
  updatePassword,
} from "../api/auth.api";
import { clearSession, resetSession } from "../lib/session";

// One hook per action. Failures toast by default (shared/lib/query-client),
// so each one only says what is specific: which message to show, and what
// happens to the cached session. Screens read `isPending` for their spinner.

export function useSignIn() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => signIn(email, password),
    onSuccess: resetSession,
    meta: { errorMessage: "Não foi possível entrar." },
  });
}

export function useSignUp() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => signUp(email, password),
    meta: { errorMessage: "Não foi possível criar a conta." },
  });
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (email: string) => requestPasswordReset(email),
    meta: { errorMessage: "Não foi possível enviar o link." },
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (password: string) => updatePassword(password),
    onSuccess: resetSession,
    meta: { successMessage: "Senha atualizada.", errorMessage: "Não foi possível atualizar a senha." },
  });
}

export function useSignOut() {
  return useMutation({
    mutationFn: signOut,
    // Guards and the header react to the cleared session at once.
    onSuccess: clearSession,
    meta: { successMessage: "Você saiu da sua conta", errorMessage: "Não foi possível sair." },
  });
}

// The two below run from a redirect landing page, which sends the user
// elsewhere with its own message on failure — hence silent.

export function useConfirmEmail() {
  return useMutation({
    mutationFn: ({ tokenHash, type }: { tokenHash: string; type: string }) => confirmEmailLink(tokenHash, type),
    onSuccess: resetSession,
    meta: { silent: true },
  });
}

export function useCreateSessionFromTokens() {
  return useMutation({
    mutationFn: createSessionFromTokens,
    onSuccess: resetSession,
    meta: { silent: true },
  });
}
