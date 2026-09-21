import { ArrowUpRight, BarChart3 } from "lucide-react";
import { Link } from "react-router";
import { BackLink } from "@/shared/components/page-header";
import { SiteThumb } from "@/shared/components/site-thumb";
import { tintFor } from "@/shared/lib/tint";
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

// O topo da tela do projeto é o banner dele: a capa atrás, nome e estado por
// cima, e o Deploy — a ação da tela — no canto.
export function ProjectHeader({ project, inFlight, deploying, deployLocked, onDeploy }: ProjectHeaderProps) {
  const tint = tintFor(project.slug);

  return (
    <section className="corners border-border relative flex min-h-[220px] border" style={{ "--corner": tint } as React.CSSProperties}>
      <div className="absolute inset-0" aria-hidden="true">
        <SiteThumb slug={project.slug} thumbnailUrl={project.thumbnail_url} name={project.name} size="banner" />
      </div>
      <div className="from-background via-background/85 to-background/25 absolute inset-0 bg-gradient-to-r" aria-hidden="true" />
      <div className="from-background/80 absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t to-transparent" aria-hidden="true" />

      <div className="relative flex w-full flex-col justify-between gap-6 p-6 md:p-8">
        <BackLink to="/">Seus projetos</BackLink>

        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex min-w-0 flex-col gap-3">
            <h1 className="font-display text-[34px] leading-[1.02] font-bold tracking-[-0.02em] md:text-[44px]">
              {project.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={projectUrl(project.slug)}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 font-mono text-[13px] transition-colors"
              >
                {projectHost(project.slug)}
                <ArrowUpRight className="size-3.5" />
              </a>
              {project.is_public ? <StatusChip tone="good">Na galeria</StatusChip> : <StatusChip tone="idle">Privado</StatusChip>}
              {inFlight && <StatusChip tone="busy">Deploy em andamento</StatusChip>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              nativeButton={false}
              render={
                <Link to={`/projects/${project.slug}/analytics`}>
                  <BarChart3 className="size-4" />
                  Analytics
                </Link>
              }
            />
            <Button size="lg" onClick={onDeploy} disabled={deployLocked || inFlight} aria-busy={deploying}>
              {deploying && <Spinner />}
              {deploying ? "Disparando…" : "Deploy"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
