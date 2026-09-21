import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { FormField } from "@/shared/components/form-field";
import { SubmitButton } from "@/shared/components/submit-button";
import { AuthCard } from "../components/auth-card";
import { useRequestPasswordReset } from "../hooks/use-auth-mutations";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const requestReset = useRequestPasswordReset();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    requestReset.mutate(email);
  }

  if (requestReset.isSuccess) {
    return (
      <AuthCard
        title="Confira seu email"
        description={`Se ${email} tiver uma conta, enviamos um link para redefinir a senha.`}
      />
    );
  }

  return (
    <AuthCard
      title="Esqueceu a senha?"
      description="Informe seu email e enviaremos um link para redefinir sua senha."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField
          id="email"
          label="E-mail"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <SubmitButton size="lg" pending={requestReset.isPending} pendingLabel="Enviando…">
          Enviar link
        </SubmitButton>
        <p className="text-muted-foreground text-center text-sm">
          <Link to="/login" className="text-primary underline underline-offset-4">
            Voltar para o login
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
