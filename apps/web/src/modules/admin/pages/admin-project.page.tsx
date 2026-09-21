import { DeployStatus, projectHost, projectUrl } from "@/modules/projects";
import { BackLink } from "@/shared/components/page-header";
import { Panel } from "@/shared/components/panel";
import { useRequiredParam } from "@/shared/hooks/use-required-param";
import { ApiError } from "@/shared/lib/http";
import { formatDayMonthTime } from "@/shared/lib/format";
import { Skeleton } from "@/shared/ui/skeleton";
import { AdminError } from "../components/admin-error";
import { useAdminProject } from "../hooks/use-admin";

export default function AdminProjectDetailPage() {
  const slug = useRequiredParam("slug");
  const { data: project, isPending, error, refetch } = useAdminProject(slug);

  if (isPending) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink to="/admin">Projetos</BackLink>
        <AdminError onRetry={refetch}>
          {error instanceof ApiError && error.status_code === 404
            ? "Projeto não encontrado."
            : "Erro ao carregar o projeto."}
        </AdminError>
      </div>
    );
  }

  const deployments = project.deployments ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2.5">
        <BackLink to="/admin">Projetos</BackLink>
        <h2 className="font-display text-title-lg font-bold">{project.name}</h2>
        <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-sm">
          <a
            href={projectUrl(project.slug)}
            target="_blank"
            rel="noreferrer"
            className="text-text-3 hover:text-foreground font-mono text-xs"
          >
            {projectHost(project.slug)}
          </a>
          <span aria-hidden="true">·</span>
          <span>
            dono <span className="font-mono text-xs">{project.user?.email ?? "—"}</span>
          </span>
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Configuração" className="lg:col-span-1">
          <dl className="flex flex-col">
            <div className="border-border flex flex-col gap-1 border-b px-4 py-3">
              <dt className="text-muted-foreground text-xs">Repositório</dt>
              <dd className="font-mono text-xs break-all">{project.repository_url}</dd>
            </div>
            <div className="border-border flex flex-col gap-1 border-b px-4 py-3">
              <dt className="text-muted-foreground text-xs">Build</dt>
              <dd className="font-mono text-xs break-all">{project.build_command}</dd>
            </div>
            <div className="flex flex-col gap-1 px-4 py-3">
              <dt className="text-muted-foreground text-xs">Saída</dt>
              <dd className="font-mono text-xs">{project.output_dir}</dd>
            </div>
          </dl>
        </Panel>

        <Panel title="Histórico de deploys" count={deployments.length} className="xl:col-span-2">
          {deployments.length === 0 ? (
            <p className="text-muted-foreground px-4 py-10 text-center">Nenhum deploy ainda.</p>
          ) : (
            deployments.map((deployment) => (
              <details key={deployment.id} className="group border-border border-b last:border-b-0">
                <summary
                  className={
                    "grid grid-cols-12 items-center gap-3 px-4 py-3 " +
                    (deployment.log
                      ? "hover:bg-raised cursor-pointer"
                      : "cursor-default [&::-webkit-details-marker]:hidden")
                  }
                >
                  <span className="col-span-5 sm:col-span-3">
                    <DeployStatus status={deployment.status} />
                  </span>
                  <span className="text-muted-foreground col-span-5 text-caption sm:col-span-4">
                    {formatDayMonthTime(deployment.created_at)}
                  </span>
                  <span className="text-text-3 col-span-2 font-mono text-xs sm:col-span-3">
                    {deployment.commit_sha ? deployment.commit_sha.slice(0, 7) : "—"}
                  </span>
                  {deployment.log && (
                    <span className="text-text-3 label group-open:text-foreground hidden text-micro sm:col-span-2 sm:block sm:text-right">
                      log
                    </span>
                  )}
                </summary>
                {deployment.log && (
                  <pre className="bg-background border-border text-muted-foreground mx-4 mb-4 max-h-64 overflow-auto border p-3 font-mono text-xs whitespace-pre-wrap">
                    {deployment.log}
                  </pre>
                )}
              </details>
            ))
          )}
        </Panel>
      </div>
    </div>
  );
}
