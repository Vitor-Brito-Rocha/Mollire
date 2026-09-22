import { useEffect, useRef } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { loginPathFor, useCurrentUser } from "@/modules/auth";
import { EmptyState } from "@/shared/components/empty-state";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { useJoinByCode } from "../hooks/use-turma-mutations";

// /turmas/entrar?code=XXXXXX — o link que o professor cola no WhatsApp. Serve
// para o código da turma e para o de um grupo. Quem não está logado passa
// pelo login e volta para cá; depois a entrada é automática.
export default function JoinLinkPage() {
  const [searchParams] = useSearchParams();
  const code = (searchParams.get("code") ?? "").trim();
  const { user, loading } = useCurrentUser();
  const navigate = useNavigate();
  const { mutate: join, isError } = useJoinByCode();
  // One shot: StrictMode runs effects twice in dev.
  const started = useRef(false);

  useEffect(() => {
    if (!user || !code || started.current) return;
    started.current = true;
    join(code, {
      onSuccess: (result) => {
        if (result.group_full) toast.warning("O grupo do link já está cheio. Você entrou só na turma.");
        navigate(`/turmas/${result.turma_id}`, { replace: true });
      },
    });
  }, [user, code, join, navigate]);

  const back = <Button variant="outline" nativeButton={false} render={<Link to="/turmas">Ir para as turmas</Link>} />;

  if (!code) {
    return (
      <div className="mx-auto w-full max-w-(--page-narrow)">
        <EmptyState className="py-16" action={back}>
          Este link não tem um código de turma.
        </EmptyState>
      </div>
    );
  }
  if (loading) return <Waiting label="Verificando sua conta…" />;
  if (!user) return <Navigate to={loginPathFor(`/turmas/entrar?code=${encodeURIComponent(code)}`)} replace />;
  if (isError) {
    return (
      <div className="mx-auto w-full max-w-(--page-narrow)">
        <EmptyState className="py-16" action={back}>
          Não deu para entrar: o código não existe, ou a turma está cheia.
        </EmptyState>
      </div>
    );
  }
  return <Waiting label="Entrando na turma…" />;
}

function Waiting({ label }: { label: string }) {
  return (
    <div role="status" className="text-muted-foreground flex items-center justify-center gap-2.5 p-12 text-sm">
      <Spinner />
      {label}
    </div>
  );
}
