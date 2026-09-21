import { useCallback } from "react";
import { Link } from "react-router";
import { EmptyState } from "@/shared/components/empty-state";
import { useRequiredParam } from "@/shared/hooks/use-required-param";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { DeploymentHistory } from "../components/deployment-history";
import { ProjectActivityFeed } from "../components/project-activity";
import { ProjectConfig } from "../components/project-config";
import { ProjectEnvVars } from "../components/project-env-vars";
import { ProjectHeader } from "../components/project-header";
import { ProjectMembers } from "../components/project-members";
import { VisibilityCard } from "../components/visibility-card";
import { useDeploymentStream } from "../hooks/use-deployment-stream";
import { useDeploy, useProject, useSetVisibility } from "../hooks/use-projects";
import { isInFlight, latestDeployment } from "../lib/deployments";

export default function ProjectDetailPage() {
  const slug = useRequiredParam("slug");
  const { data: project, isPending, isError } = useProject(slug);
  const deploy = useDeploy(slug);
  const setVisibility = useSetVisibility(slug);

  const latest = latestDeployment(project?.deployments);
  const inFlight = !!latest && isInFlight(latest.status);
  const liveLog = useDeploymentStream(slug, !!project && inFlight);

  // `mutate` is stable, so rows (memoised) don't re-render because of this.
  const { mutate: deployMutate } = deploy;
  const handleRedeploy = useCallback((commitSha: string) => deployMutate(commitSha), [deployMutate]);

  if (isPending) {
    return (
      <div className="mx-auto flex w-full max-w-(--page) flex-col gap-4" aria-busy="true">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="mx-auto w-full max-w-(--page)">
        <EmptyState
          action={<Button variant="outline" nativeButton={false} render={<Link to="/">Voltar aos projetos</Link>} />}
        >
          Projeto não encontrado, ou você não tem acesso a ele.
        </EmptyState>
      </div>
    );
  }

  const isOwner = project.my_role !== "MEMBER";
  // variables === undefined: the header's Deploy button; a string: a row's re-deploy.
  const redeployingSha = deploy.isPending ? (deploy.variables ?? null) : null;

  return (
    <div className="mx-auto flex w-full max-w-(--page) flex-col gap-6">
      <ProjectHeader
        project={project}
        inFlight={inFlight}
        deploying={deploy.isPending && deploy.variables === undefined}
        deployLocked={deploy.isPending}
        onDeploy={() => deploy.mutate(undefined)}
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <DeploymentHistory
          slug={slug}
          deployments={project.deployments ?? []}
          inFlight={inFlight}
          liveLog={liveLog}
          redeployingSha={redeployingSha}
          deployPending={deploy.isPending}
          onRedeploy={handleRedeploy}
        />

        <div className="flex flex-col gap-6">
          <VisibilityCard
            project={project}
            isOwner={isOwner}
            pending={setVisibility.isPending}
            onChange={setVisibility.mutate}
          />
          <ProjectMembers slug={slug} />
          {isOwner && <ProjectEnvVars slug={slug} />}
          <ProjectActivityFeed slug={slug} />
          <ProjectConfig project={project} />
        </div>
      </div>
    </div>
  );
}
