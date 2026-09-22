import { Link } from "react-router";
import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";
import { useRequiredParam } from "@/shared/hooks/use-required-param";
import { ApiError } from "@/shared/lib/http";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { MilestonesPanel } from "../components/milestones-panel";
import { TurmaFeed } from "../components/turma-feed";
import { TurmaProgressPanel } from "../components/turma-progress-panel";
import { useTurma } from "../hooks/use-turmas";

// O hub da turma: o que está acontecendo (o feed), como a turma vai (o
// progresso) e o que vem pela frente (as entregas). É a ordem dos
// acontecimentos, não uma ordem de mérito.
export default function TurmaHubPage() {
  const id = useRequiredParam("id");
  const { data: turma, isPending, error, refetch } = useTurma(id);

  if (isPending) {
    return (
      <div className="mx-auto flex w-full max-w-(--page) flex-col gap-6" aria-busy="true">
        <Skeleton className="h-24 w-full max-w-lg" />
        <div className="grid gap-6 xl:grid-cols-3">
          <Skeleton className="h-[480px] w-full xl:col-span-2" />
          <Skeleton className="h-[320px] w-full" />
        </div>
      </div>
    );
  }

  if (!turma) {
    const missing = error instanceof ApiError && error.status_code === 404;
    return (
      <div className="mx-auto w-full max-w-(--page)">
        <EmptyState
          className="py-16"
          action={
            missing ? (
              <Button nativeButton={false} render={<Link to="/turmas">Voltar às turmas</Link>} />
            ) : (
              <Button variant="outline" onClick={() => refetch()}>
                Tentar de novo
              </Button>
            )
          }
        >
          {missing ? "Turma não encontrada, ou você não faz parte dela." : "Erro ao carregar a turma."}
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-(--page) flex-col gap-7">
      <PageHeader
        back={{ to: `/turmas/${turma.id}`, label: turma.name }}
        eyebrow="Hub da turma"
        title="O que está acontecendo"
        description="Deploys, diário, entregas cumpridas e quem chegou, na ordem em que aconteceram. Sem placar."
      />

      <div className="grid items-start gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <TurmaFeed turmaId={turma.id} />
        </div>
        <div className="flex flex-col gap-6">
          <TurmaProgressPanel turmaId={turma.id} />
          <MilestonesPanel turma={turma} />
        </div>
      </div>
    </div>
  );
}
