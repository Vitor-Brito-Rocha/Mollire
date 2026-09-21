import { Panel } from "@/shared/components/panel";
import { formatDayMonthTime, formatLongDate } from "@/shared/lib/format";
import type { GalleryProjectDetail } from "../types";

function Fact({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={"flex justify-between gap-3 px-4 py-3 text-sm " + (last ? "" : "border-border border-b")}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export function ProjectFacts({ project }: { project: GalleryProjectDetail }) {
  return (
    <Panel>
      <dl className="flex flex-col">
        <Fact label="Publicado">{project.published_at ? formatLongDate(project.published_at) : "—"}</Fact>
        <Fact label="Último deploy">{project.last_deploy_at ? formatDayMonthTime(project.last_deploy_at) : "—"}</Fact>
        <Fact label="Estrelas">
          <span className="font-mono tabular-nums">{project.stars}</span>
        </Fact>
        <Fact label="Comentários" last>
          <span className="font-mono tabular-nums">{project.comments}</span>
        </Fact>
      </dl>
    </Panel>
  );
}
