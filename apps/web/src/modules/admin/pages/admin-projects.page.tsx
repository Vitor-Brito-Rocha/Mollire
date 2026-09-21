import { Link } from "react-router";
import { projectHost } from "@/modules/projects";
import { EmptyState } from "@/shared/components/empty-state";
import { formatDayMonthYear } from "@/shared/lib/format";
import { Skeleton } from "@/shared/ui/skeleton";
import { AdminError } from "../components/admin-error";
import { Stat } from "../components/stat";
import { useAdminProjects } from "../hooks/use-admin";

// /admin/projects devolve os projetos com o e-mail do dono, sem deployments —
// por isso a tabela não tem coluna de estado; ela entra quando a API incluir
// o último deploy de cada projeto.
export default function AdminProjectsPage() {
  const { data: projects, isPending, refetch } = useAdminProjects();

  if (isPending) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!projects) return <AdminError onRetry={refetch}>Erro ao carregar os projetos.</AdminError>;

  const owners = new Set(projects.map((p) => p.user?.email).filter(Boolean)).size;
  const newest = projects[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Projetos" value={projects.length} />
        <Stat label="Donos" value={owners} />
        <Stat label="Último cadastro" value={newest ? formatDayMonthYear(newest.created_at) : "—"} />
      </div>

      {projects.length === 0 ? (
        <EmptyState>Nenhum projeto no sistema ainda.</EmptyState>
      ) : (
        <div className="corners bg-card border-border flex flex-col border">
          <div className="label text-text-3 border-border grid grid-cols-12 gap-3 border-b px-4 py-2.5 text-micro">
            <span className="col-span-6 sm:col-span-5">Projeto</span>
            <span className="col-span-6 sm:col-span-4">Dono</span>
            <span className="hidden sm:col-span-3 sm:block">Criado em</span>
          </div>
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/admin/projects/${project.slug}`}
              className="hover:bg-raised border-border grid grid-cols-12 items-center gap-3 border-b px-4 py-3.5 transition-colors last:border-b-0"
            >
              <div className="col-span-6 flex min-w-0 flex-col gap-0.5 sm:col-span-5">
                <span className="truncate text-body-lg font-semibold">{project.name}</span>
                <span className="text-text-3 truncate font-mono text-xs">{projectHost(project.slug)}</span>
              </div>
              <span className="text-muted-foreground col-span-6 truncate font-mono text-xs sm:col-span-4">
                {project.user?.email ?? "—"}
              </span>
              <span className="text-muted-foreground hidden text-caption sm:col-span-3 sm:block">
                {formatDayMonthYear(project.created_at)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
