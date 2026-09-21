import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";
import { SiteThumb } from "@/shared/components/site-thumb";
import { formatDayMonthYear } from "@/shared/lib/format";
import { tintFor } from "@/shared/lib/tint";
import { Button } from "@/shared/ui/button";
import { projectHost, projectUrl } from "../lib/project-url";
import type { Project } from "../types";
import { StatusChip } from "./status-chip";

// O projeto mais recente como banner de launcher: a capa (captura real, ou a
// inicial gigante na cor do projeto) atrás, o texto por cima de um degradê.
// Põe a ação mais provável — abrir o último projeto — a um clique.
export function FeaturedProject({ project }: { project: Project }) {
  const tint = tintFor(project.slug);

  return (
    <section
      className="corners border-border relative flex min-h-[280px] border"
      style={{ "--corner": tint } as React.CSSProperties}
      aria-label="Projeto mais recente"
    >
      <div className="absolute inset-0" aria-hidden="true">
        <SiteThumb slug={project.slug} thumbnailUrl={project.thumbnail_url} name={project.name} size="banner" />
      </div>
      <div className="from-background via-background/85 to-background/20 absolute inset-0 bg-gradient-to-r" aria-hidden="true" />
      <div className="from-background/80 absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t to-transparent" aria-hidden="true" />

      <div className="relative flex w-full max-w-[660px] flex-col justify-end gap-4 p-6 md:p-9">
        <span className="label flex items-center gap-2.5 tracking-[0.14em]" style={{ color: tint }}>
          <span className="h-0.5 w-[18px]" style={{ background: tint }} />
          Mais recente
        </span>
        <h2 className="font-display text-[32px] leading-[1.02] font-bold tracking-[-0.02em] md:text-[44px]">
          {project.name}
        </h2>
        <div className="flex flex-wrap items-center gap-2.5">
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
      </div>
    </section>
  );
}
