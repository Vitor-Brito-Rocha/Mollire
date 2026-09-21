import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";
import { CoverBanner } from "@/shared/components/cover-banner";
import { Eyebrow } from "@/shared/components/eyebrow";
import { formatDayMonthYear } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { projectHost, projectUrl } from "../lib/project-url";
import type { Project } from "../types";
import { StatusChip } from "./status-chip";

// O projeto mais recente como banner de launcher. Põe a ação mais provável —
// abrir o último projeto — a um clique.
export function ProjectBanner({ project }: { project: Project }) {
  return (
    <CoverBanner
      slug={project.slug}
      thumbnailUrl={project.thumbnail_url}
      name={project.name}
      className="min-h-[280px]"
      contentClassName="max-w-[660px] justify-end gap-4 md:p-9"
    >
      {(tint) => (
        <>
          <Eyebrow style={{ color: tint }}>Mais recente</Eyebrow>
          <h2 className="font-display text-display tracking-display font-bold md:text-display-lg">{project.name}</h2>
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={projectUrl(project.slug)}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 font-mono text-caption transition-colors"
            >
              {projectHost(project.slug)}
              <ArrowUpRight className="size-3.5" />
            </a>
            {project.is_public ? <StatusChip tone="good">Na galeria</StatusChip> : <StatusChip tone="idle">Privado</StatusChip>}
            {project.my_role === "MEMBER" && <StatusChip tone="idle">Membro</StatusChip>}
            <span className="text-text-3 text-xs">criado em {formatDayMonthYear(project.created_at)}</span>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button size="lg" nativeButton={false} render={<Link to={`/projects/${project.slug}`}>Abrir projeto</Link>} />
            <Button
              variant="outline"
              size="lg"
              nativeButton={false}
              render={
                <a href={projectUrl(project.slug)} target="_blank" rel="noreferrer">
                  Ver site
                </a>
              }
            />
          </div>
        </>
      )}
    </CoverBanner>
  );
}
