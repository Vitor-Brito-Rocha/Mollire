import { Globe, Lock, Upload, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { useCurrentUser } from "@/modules/auth";
import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";
import { Panel } from "@/shared/components/panel";
import { StatusChip } from "@/shared/components/status-chip";
import { useRequiredParam } from "@/shared/hooks/use-required-param";
import { ApiError } from "@/shared/lib/http";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { CodeBadge } from "../components/code-badge";
import { GroupsPanel } from "../components/groups-panel";
import { StudentsPanel } from "../components/students-panel";
import { SubmitProjectDialog } from "../components/submit-project-dialog";
import { TurmaProjectCard } from "../components/turma-project-card";
import { useTurma, useTurmaGallery } from "../hooks/use-turmas";
import { formatStudents } from "../lib/format";

// A turma por dentro: a galeria dela, os grupos (para escolher ou gerir) e,
// para o professor, a lista de alunos. O papel de quem vê muda a tela.
export default function TurmaDetailPage() {
  const id = useRequiredParam("id");
  const { user } = useCurrentUser();
  const { data: turma, isPending, error, refetch } = useTurma(id);
  const { data: projects, isPending: loadingProjects } = useTurmaGallery(id);
  const [submitting, setSubmitting] = useState(false);

  if (isPending) {
    return (
      <div className="mx-auto flex w-full max-w-(--page) flex-col gap-6" aria-busy="true">
        <Skeleton className="h-28 w-full max-w-lg" />
        <div className="grid gap-6 xl:grid-cols-3">
          <Skeleton className="h-[360px] w-full xl:col-span-2" />
          <Skeleton className="h-[360px] w-full" />
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

  const professor = turma.my_role === "PROFESSOR";
  const showGroups = professor || turma.group_mode === "GROUPS";

  return (
    <div className="mx-auto flex w-full max-w-(--page) flex-col gap-7">
      <PageHeader
        back={{ to: "/turmas", label: "Turmas" }}
        eyebrow={professor ? "Você é o professor" : "Você é aluno"}
        title={turma.name}
        description={turma.description ?? undefined}
        meta={
          <>
            <StatusChip tone="idle">
              {turma.is_public ? <Globe className="size-3" aria-hidden="true" /> : <Lock className="size-3" aria-hidden="true" />}
              {turma.is_public ? "Pública" : "Privada"}
            </StatusChip>
            <span className="text-muted-foreground flex items-center gap-1.5 text-caption">
              <Users className="size-3.5" aria-hidden="true" />
              {formatStudents(turma.students_count, turma.capacity)}
            </span>
            <CodeBadge code={turma.code} />
          </>
        }
        actions={
          <Button size="lg" onClick={() => setSubmitting(true)}>
            <Upload className="size-4" />
            Enviar projeto
          </Button>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-3">
        <Panel title="Projetos da turma" count={projects?.length} className="xl:col-span-2">
          {loadingProjects ? (
            <div className="grid gap-4 p-4 sm:grid-cols-2" aria-busy="true">
              <Skeleton className="h-[260px] w-full" />
              <Skeleton className="h-[260px] w-full" />
            </div>
          ) : !projects || projects.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
              <p className="text-muted-foreground">Nenhum projeto enviado ainda.</p>
              <p className="text-text-3 max-w-[40ch] text-sm">
                {professor
                  ? "Quando os alunos enviarem, eles aparecem aqui com estrela e nota."
                  : "Envie o seu: ele entra com o seu grupo, e os colegas podem dar estrela."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              {projects.map((project) => (
                <TurmaProjectCard
                  key={project.id}
                  turmaId={turma.id}
                  project={project}
                  viewerHandle={user?.handle ?? null}
                  canGrade={professor}
                />
              ))}
            </div>
          )}
        </Panel>

        <div className="flex flex-col gap-6">
          {showGroups && <GroupsPanel turma={turma} />}
          {professor && <StudentsPanel turmaId={turma.id} />}
        </div>
      </div>

      <SubmitProjectDialog
        turmaId={turma.id}
        submittedSlugs={projects?.map((p) => p.slug) ?? []}
        open={submitting}
        onOpenChange={setSubmitting}
      />
    </div>
  );
}
