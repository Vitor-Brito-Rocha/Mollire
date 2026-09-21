import { Link } from "react-router";
import { useCurrentUser } from "@/modules/auth";
import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { FeaturedProject } from "../components/featured-project";
import { LevelPanel } from "../components/level-panel";
import { ProjectsTable } from "../components/projects-table";
import { useProjects } from "../hooks/use-projects";

// O painel: o projeto mais recente como banner, a lista completa ao lado do
// seu nível. Tudo com o que a API já devolve — nada inventado.
export default function ProjectsListPage() {
  const { data: projects, isPending, isError, refetch } = useProjects();
  const { user } = useCurrentUser();
  // /projects vem do mais novo para o mais antigo.
  const featured = projects?.[0];

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-7">
      <PageHeader
        eyebrow="Painel"
        title="Seus projetos"
        actions={<Button size="lg" nativeButton={false} render={<Link to="/projects/new">Novo projeto</Link>} />}
      />

      {isPending && (
        <div className="flex flex-col gap-6" aria-busy="true">
          <Skeleton className="h-[280px] w-full" />
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-56 w-full" />
          </div>
        </div>
      )}

      {isError && (
        <EmptyState action={<Button variant="outline" onClick={() => refetch()}>Tentar de novo</Button>}>
          Não foi possível carregar seus projetos.
        </EmptyState>
      )}

      {projects?.length === 0 && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <EmptyState action={<Button nativeButton={false} render={<Link to="/projects/new">Criar o primeiro</Link>} />}>
            Nenhum projeto ainda. O primeiro deploy rende XP em dobro.
          </EmptyState>
          {user && <LevelPanel user={user} projects={projects} />}
        </div>
      )}

      {projects && projects.length > 0 && featured && (
        <>
          <FeaturedProject project={featured} />
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <ProjectsTable projects={projects} />
            {user && <LevelPanel user={user} projects={projects} />}
          </div>
        </>
      )}
    </div>
  );
}
