import { ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { Panel } from "@/shared/components/panel";
import { SiteThumb } from "@/shared/components/site-thumb";
import { formatDayMonthYear } from "@/shared/lib/format";
import { projectHost } from "../lib/project-url";
import type { Project } from "../types";
import { StatusChip } from "./status-chip";

// A lista completa: cada linha tem a capa do projeto, nome, endereço, se
// está na galeria e quando nasceu. Passar o mouse acende a linha inteira.
export function ProjectsTable({ projects }: { projects: Project[] }) {
  return (
    <Panel title="Todos os projetos" count={projects.length}>
      <ul>
        {projects.map((project) => (
          <li key={project.id}>
            <Link
              to={`/projects/${project.slug}`}
              className="group hover:bg-raised/60 border-border relative flex items-center gap-4 border-b px-4 py-3 transition-colors last:border-b-0"
            >
              <span
                className="bg-primary glow absolute top-0 bottom-0 left-0 w-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden="true"
              />
              <span className="border-border block h-11 w-[72px] shrink-0 overflow-hidden border">
                <SiteThumb slug={project.slug} thumbnailUrl={project.thumbnail_url} name={project.name} size="thumb" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex items-center gap-2">
                  <span className="group-hover:text-primary truncate text-[15px] font-semibold transition-colors">
                    {project.name}
                  </span>
                  {project.my_role === "MEMBER" && <span className="label text-text-3 shrink-0 text-[9.5px]">membro</span>}
                </span>
                <span className="text-text-3 truncate font-mono text-xs">{projectHost(project.slug)}</span>
              </span>
              <span className="hidden items-center gap-4 sm:flex">
                {project.is_public ? <StatusChip tone="good">Galeria</StatusChip> : <StatusChip tone="idle">Privado</StatusChip>}
                <span className="text-muted-foreground w-[104px] text-right text-[13px] tabular-nums">
                  {formatDayMonthYear(project.created_at)}
                </span>
              </span>
              <ChevronRight className="text-text-3 group-hover:text-primary size-4 shrink-0 transition-colors" />
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
