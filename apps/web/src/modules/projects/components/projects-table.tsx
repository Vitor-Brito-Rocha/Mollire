import { Link } from "react-router";
import { Panel } from "@/shared/components/panel";
import { formatDayMonthYear } from "@/shared/lib/format";
import { projectHost } from "../lib/project-url";
import type { Project } from "../types";

export function ProjectsTable({ projects }: { projects: Project[] }) {
  return (
    <Panel>
      <div className="label text-text-3 border-border grid grid-cols-12 gap-3 border-b px-4 py-2.5 text-[10px]">
        <span className="col-span-8 sm:col-span-9">Projeto</span>
        <span className="col-span-4 sm:col-span-3">Criado em</span>
      </div>
      {projects.map((project) => (
        <Link
          key={project.id}
          to={`/projects/${project.slug}`}
          className="hover:bg-raised border-border grid grid-cols-12 items-center gap-3 border-b px-4 py-3.5 transition-colors last:border-b-0"
        >
          <div className="col-span-8 flex min-w-0 flex-col gap-0.5 sm:col-span-9">
            <span className="flex items-center gap-2">
              <span className="truncate text-[15px] font-semibold">{project.name}</span>
              {project.my_role === "MEMBER" && <span className="label text-text-3 shrink-0 text-[9.5px]">membro</span>}
            </span>
            <span className="text-text-3 truncate font-mono text-xs">{projectHost(project.slug)}</span>
          </div>
          <span className="text-muted-foreground col-span-4 text-[13px] sm:col-span-3">
            {formatDayMonthYear(project.created_at)}
          </span>
        </Link>
      ))}
    </Panel>
  );
}
