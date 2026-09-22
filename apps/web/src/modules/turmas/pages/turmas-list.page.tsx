import { KeyRound, Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { useCurrentUser } from "@/modules/auth";
import { EmptyState } from "@/shared/components/empty-state";
import { Eyebrow } from "@/shared/components/eyebrow";
import { PageHeader } from "@/shared/components/page-header";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { JoinByCodeDialog } from "../components/join-by-code-dialog";
import { PublicTurmaCard } from "../components/public-turma-card";
import { TurmaCard } from "../components/turma-card";
import { useMyTurmas, usePublicTurmas } from "../hooks/use-turmas";

// Suas turmas, o botão de criar, o de entrar com código, e as públicas
// abertas a qualquer um.
export default function TurmasListPage() {
  const { user } = useCurrentUser();
  const { data: mine, isPending, isError, refetch } = useMyTurmas(!!user);
  const { data: publicTurmas } = usePublicTurmas(!!user);
  const [joining, setJoining] = useState(false);
  const openPublic = publicTurmas?.filter((t) => !t.is_member) ?? [];

  return (
    <div className="mx-auto flex w-full max-w-(--page) flex-col gap-8">
      <PageHeader
        eyebrow="Sala de aula"
        title="Turmas"
        description="Cada turma tem a própria galeria: você envia um projeto, os colegas dão estrela e o professor dá a nota."
        actions={
          <>
            <Button variant="outline" size="lg" onClick={() => setJoining(true)}>
              <KeyRound className="size-4" />
              Entrar com código
            </Button>
            <Button size="lg" nativeButton={false} render={<Link to="/turmas/nova" />}>
              <Plus className="size-4" strokeWidth={2.5} />
              Nova turma
            </Button>
          </>
        }
      />

      <section className="flex flex-col gap-4">
        <Eyebrow as="h2" tone="section">
          Minhas turmas
          {mine && <span className="text-text-3 font-mono text-xs tracking-normal normal-case">{mine.length}</span>}
        </Eyebrow>
        {isPending ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-busy="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[124px] w-full" />
            ))}
          </div>
        ) : isError ? (
          <EmptyState action={<Button variant="outline" onClick={() => refetch()}>Tentar de novo</Button>}>
            Não foi possível carregar suas turmas.
          </EmptyState>
        ) : mine.length === 0 ? (
          <EmptyState
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Button variant="outline" onClick={() => setJoining(true)}>
                  Entrar com código
                </Button>
                <Button nativeButton={false} render={<Link to="/turmas/nova">Criar uma turma</Link>} />
              </div>
            }
          >
            Você ainda não está em nenhuma turma. Entre com o código que o professor passou, ou crie a sua.
          </EmptyState>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {mine.map((turma) => (
              <TurmaCard key={turma.id} turma={turma} />
            ))}
          </div>
        )}
      </section>

      {openPublic.length > 0 && (
        <section className="flex flex-col gap-4">
          <Eyebrow as="h2" tone="section">
            Turmas públicas
            <span className="text-text-3 font-mono text-xs tracking-normal normal-case">{openPublic.length}</span>
          </Eyebrow>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {openPublic.map((turma) => (
              <PublicTurmaCard key={turma.id} turma={turma} />
            ))}
          </div>
        </section>
      )}

      <JoinByCodeDialog open={joining} onOpenChange={setJoining} />
    </div>
  );
}
