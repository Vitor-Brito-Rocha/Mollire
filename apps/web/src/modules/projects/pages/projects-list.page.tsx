import { Link } from "react-router";
import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { ProjectsTable } from "../components/projects-table";
import { useProjects } from "../hooks/use-projects";

// Só o que a API devolve hoje: nome, slug e data. Estado do último deploy,
// estrelas e visibilidade entram nesta tabela quando /projects passar a
// incluí-los — o modelo (canvas "Seus projetos") já reserva as colunas.
export default function ProjectsListPage() {
  const { data: projects, isPending, isError, refetch } = useProjects();

  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6">
      <PageHeader
        eyebrow="Painel"
        title="Seus projetos"
        description={projects && (projects.length === 1 ? "1 projeto" : `${projects.length} projetos`)}
        actions={<Button size="lg" nativeButton={false} render={<Link to="/projects/new">Novo projeto</Link>} />}
      />

      {isPending && (
        <div className="flex flex-col gap-3" aria-busy="true">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {isError && (
        <EmptyState action={<Button variant="outline" onClick={() => refetch()}>Tentar de novo</Button>}>
          Não foi possível carregar seus projetos.
        </EmptyState>
      )}

      {projects?.length === 0 && <EmptyState>Nenhum projeto ainda. Publique o primeiro.</EmptyState>}

      {projects && projects.length > 0 && <ProjectsTable projects={projects} />}
    </div>
  );
}
