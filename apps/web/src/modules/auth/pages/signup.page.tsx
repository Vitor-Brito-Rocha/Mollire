import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { FormField } from "@/shared/components/form-field";
import { SubmitButton } from "@/shared/components/submit-button";
import { AuthCard } from "../components/auth-card";
import { useSignUp } from "../hooks/use-auth-mutations";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const signUp = useSignUp();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    signUp.mutate({ email, password });
  }

  if (signUp.isSuccess) {
    return (
      <AuthCard
        title="Confira seu email"
        description={`Enviamos um link de confirmação para ${email}. Confirme pra poder entrar.`}
      />
    );
  }

  return (
    <AuthCard title="Criar conta" description="Comece a publicar seus projetos.">
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
        <FormField
          id="password"
          label="Senha"
          type="password"
          autoComplete="new-password"
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <SubmitButton size="lg" pending={signUp.isPending} pendingLabel="Criando…">
          Criar conta
        </SubmitButton>
        <p className="text-muted-foreground text-center text-sm">
          Já tem conta?{" "}
          <Link to="/login" className="text-primary underline underline-offset-4">
            Entrar
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
