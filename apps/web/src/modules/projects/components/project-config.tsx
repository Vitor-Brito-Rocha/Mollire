import { Panel } from "@/shared/components/panel";
import type { Project } from "../types";

export function ProjectConfig({ project }: { project: Project }) {
  return (
    <Panel title="Configuração">
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
  );
}
