import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { FormField } from "@/shared/components/form-field";
import { SubmitButton } from "@/shared/components/submit-button";
import { PageSpinner } from "@/shared/ui/spinner";
import { AuthCard } from "../components/auth-card";
import { useUpdatePassword } from "../hooks/use-auth-mutations";
import { useCurrentUser } from "../hooks/use-current-user";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const updatePassword = useUpdatePassword();
  // /auth/confirm already exchanged the recovery link for a session cookie
  // before redirecting here — if there's no session, the link was invalid
  // or already used.
  const { user, loading } = useCurrentUser();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    updatePassword.mutate(password, { onSuccess: () => navigate("/", { replace: true }) });
  }

  if (loading) return <PageSpinner />;

  if (!user) {
    return (
      <AuthCard
        title="Link inválido ou expirado"
        description="Solicite um novo link em “Esqueceu a senha?” na tela de login."
      />
    );
  }

  return (
    <AuthCard title="Redefinir senha" description="Escolha uma nova senha para sua conta.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField
          id="password"
          label="Nova senha"
          type="password"
          autoComplete="new-password"
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <FormField
          id="confirmPassword"
          label="Confirme a nova senha"
          type="password"
          autoComplete="new-password"
          minLength={6}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />
        <SubmitButton size="lg" pending={updatePassword.isPending} pendingLabel="Salvando…">
          Salvar nova senha
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
