import { Link } from "react-router";
import { PageHeader } from "@/shared/components/page-header";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { projectHost, projectUrl } from "../lib/project-url";
import type { Project } from "../types";
import { StatusChip } from "./status-chip";

type ProjectHeaderProps = {
  project: Project;
  inFlight: boolean;
  // The Deploy button's own request is running (not a re-deploy from a row).
  deploying: boolean;
  deployLocked: boolean;
  onDeploy: () => void;
};

export function ProjectHeader({ project, inFlight, deploying, deployLocked, onDeploy }: ProjectHeaderProps) {
  return (
    <PageHeader
      back={{ to: "/", label: "Seus projetos" }}
      title={project.name}
      meta={
        <>
          <a
            href={projectUrl(project.slug)}
            target="_blank"
            rel="noreferrer"
            className="text-text-3 hover:text-foreground font-mono text-xs"
          >
            {projectHost(project.slug)}
          </a>
          {project.is_public ? (
            <StatusChip tone="good">Na galeria</StatusChip>
          ) : (
            <StatusChip tone="idle">Privado</StatusChip>
          )}
          {inFlight && <StatusChip tone="busy">Deploy em andamento</StatusChip>}
        </>
      }
      actions={
        <>
          <Link
            to={`/projects/${project.slug}/analytics`}
            className="label text-muted-foreground hover:text-foreground text-xs transition-colors"
          >
            Analytics
          </Link>
          <Button size="lg" onClick={onDeploy} disabled={deployLocked || inFlight} aria-busy={deploying}>
            {deploying && <Spinner />}
            {deploying ? "Disparando…" : "Deploy"}
          </Button>
        </>
      }
    />
  );
}
