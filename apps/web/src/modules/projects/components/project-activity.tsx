import { Panel } from "@/shared/components/panel";
import { formatDayMonthTime } from "@/shared/lib/format";
import { useActivity } from "../hooks/use-project-reads";
import type { ProjectActivity } from "../types";

const DOT_COLOR: Record<ProjectActivity["type"], string> = {
  DEPLOY_SUCCESS: "bg-green-500",
  DEPLOY_FAILED: "bg-red-500",
  DEPLOY_TRIGGERED: "bg-yellow-400",
  STAR_RECEIVED: "bg-yellow-500",
  MEMBER_ADDED: "bg-blue-400",
  MEMBER_REMOVED: "bg-zinc-400",
  COMMENT_ADDED: "bg-purple-400",
  VISIBILITY_CHANGED: "bg-teal-400",
};

function activityText(a: ProjectActivity): string {
  const p = a.payload ?? {};
  const actor = a.actor_handle;
  const by = actor ? `por ${actor}` : "via webhook";

  switch (a.type) {
    case "DEPLOY_TRIGGERED":
      return `Deploy disparado ${by}`;
    case "DEPLOY_SUCCESS": {
      const sha = typeof p.commit_sha === "string" ? ` · ${p.commit_sha.slice(0, 7)}` : "";
      return `Deploy concluído${sha} ${by}`;
    }
    case "DEPLOY_FAILED":
      return `Deploy falhou ${by}`;
    case "MEMBER_ADDED":
      return `${p.handle ?? actor} adicionado ao projeto`;
    case "MEMBER_REMOVED":
      return `${p.handle ?? actor} removido do projeto`;
    case "STAR_RECEIVED":
      return `${p.from_handle ?? actor} deu uma estrela`;
    case "COMMENT_ADDED":
      return `${p.handle ?? actor} comentou: "${String(p.body_preview ?? "").slice(0, 60)}"`;
    case "VISIBILITY_CHANGED":
      return p.is_public ? "Projeto publicado na galeria" : "Projeto removido da galeria";
    default:
      return a.type;
  }
}

export function ProjectActivityFeed({ slug }: { slug: string }) {
  const { data, isPending } = useActivity(slug);

  // Nothing to say while it loads (a side panel popping in late beats a skeleton
  // that may turn into nothing); a failed load reads as an empty feed.
  if (isPending) return null;
  const activities = data ?? [];

  return (
    <Panel title="Atividade" count={activities.length}>
      {activities.length === 0 ? (
        <p className="text-muted-foreground px-4 py-6 text-center text-sm">Nenhuma atividade ainda.</p>
      ) : (
        <ul className="divide-border flex flex-col divide-y">
          {activities.map((a) => (
            <li key={a.id} className="flex items-start gap-3 px-4 py-3">
              <span className={`mt-0.5 size-2 shrink-0 rounded-full ${DOT_COLOR[a.type]}`} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-foreground text-[13px] leading-snug">{activityText(a)}</span>
                <span className="text-text-3 font-mono text-[11px]">{formatDayMonthTime(a.created_at)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
