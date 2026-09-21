import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { FormField } from "@/shared/components/form-field";
import { SubmitButton } from "@/shared/components/submit-button";
import { AuthCard } from "../components/auth-card";
import { GithubButton } from "../components/github-button";
import { useSignIn } from "../hooks/use-auth-mutations";
import { resolveNext } from "../lib/redirect";

// Why a bounce back to /login happened (set by /auth/confirm and the GitHub callback).
const LOGIN_ERRORS: Record<string, string> = {
  link_invalido: "Esse link é inválido ou expirou. Tente novamente.",
  github: "Não foi possível entrar com o GitHub. Tente novamente.",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const signIn = useSignIn();

  const errorKey = searchParams.get("error");
  useEffect(() => {
    const message = errorKey && LOGIN_ERRORS[errorKey];
    // id: StrictMode runs effects twice in dev; one toast, not two.
    if (message) toast.error(message, { id: `login-${errorKey}` });
  }, [errorKey]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    signIn.mutate(
      { email, password },
      {
        onSuccess: () => {
          const destination = resolveNext(searchParams.get("next"));
          if (destination?.kind === "external") {
            // A published project asked for the login: leave the SPA for it.
            window.location.assign(destination.url);
          } else {
            navigate(destination?.path ?? "/", { replace: true });
          }
        },
      },
    );
  }

  return (
    <AuthCard title="Entrar" description="Publique, receba estrelas, suba de nível.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField
          id="email"
          label="E-mail"
          type="email"
          autoComplete="email"
          className="h-11"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <FormField
          id="password"
          label="Senha"
          labelAction={
            <Link to="/forgot-password" className="text-muted-foreground text-xs underline underline-offset-4">
              Esqueceu a senha?
            </Link>
          }
          type="password"
          autoComplete="current-password"
          className="h-11"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <SubmitButton size="lg" pending={signIn.isPending} pendingLabel="Entrando…">
          Entrar
        </SubmitButton>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="border-border w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background text-muted-foreground px-2">ou</span>
          </div>
        </div>
        <GithubButton />
        <p className="text-muted-foreground text-center text-sm">
          Não tem conta?{" "}
          <Link to="/signup" className="text-primary underline underline-offset-4">
            Criar conta
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
