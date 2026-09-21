import { useEffect, useState } from "react";
import { http, ApiError } from "@/shared/lib/http";
import type { ProjectActivity } from "../types";

const timeFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function ActivityIcon({ type }: { type: ProjectActivity["type"] }) {
  const base = "mt-0.5 size-2 shrink-0 rounded-full";
  switch (type) {
    case "DEPLOY_SUCCESS":    return <span className={`${base} bg-green-500`} />;
    case "DEPLOY_FAILED":     return <span className={`${base} bg-red-500`} />;
    case "DEPLOY_TRIGGERED":  return <span className={`${base} bg-yellow-400`} />;
    case "STAR_RECEIVED":     return <span className={`${base} bg-yellow-500`} />;
    case "MEMBER_ADDED":      return <span className={`${base} bg-blue-400`} />;
    case "MEMBER_REMOVED":    return <span className={`${base} bg-zinc-400`} />;
    case "COMMENT_ADDED":     return <span className={`${base} bg-purple-400`} />;
    case "VISIBILITY_CHANGED":return <span className={`${base} bg-teal-400`} />;
  }
}

function activityText(a: ProjectActivity): string {
  const p = a.payload ?? {};
  const actor = a.actor_handle;
  const by = actor ? `por ${actor}` : "via webhook";

  switch (a.type) {
    case "DEPLOY_TRIGGERED":  return `Deploy disparado ${by}`;
    case "DEPLOY_SUCCESS": {
      const sha = typeof p.commit_sha === "string" ? ` · ${p.commit_sha.slice(0, 7)}` : "";
      return `Deploy concluído${sha} ${by}`;
    }
    case "DEPLOY_FAILED":     return `Deploy falhou ${by}`;
    case "MEMBER_ADDED":      return `${p.handle ?? actor} adicionado ao projeto`;
    case "MEMBER_REMOVED":    return `${p.handle ?? actor} removido do projeto`;
    case "STAR_RECEIVED":     return `${p.from_handle ?? actor} deu uma estrela`;
    case "COMMENT_ADDED":     return `${p.handle ?? actor} comentou: "${String(p.body_preview ?? "").slice(0, 60)}"`;
    case "VISIBILITY_CHANGED":
      return p.is_public ? "Projeto publicado na galeria" : "Projeto removido da galeria";
    default:                  return a.type;
  }
}

export function ProjectActivityFeed({ slug }: { slug: string }) {
  const [activities, setActivities] = useState<ProjectActivity[] | null>(null);

  useEffect(() => {
    http
      .get<ProjectActivity[]>(`/projects/${slug}/activity`)
      .then(setActivities)
      .catch((err) => {
        if (!(err instanceof ApiError)) return;
        setActivities([]);
      });
  }, [slug]);

  if (activities === null) return null;

  return (
    <section className="corners bg-card border-border flex flex-col border">
      <h2 className="label border-border border-b px-4 py-3">
        Atividade
        <span className="text-text-3 ml-2 font-mono text-xs tracking-normal normal-case">{activities.length}</span>
      </h2>

      {activities.length === 0 ? (
        <p className="text-muted-foreground px-4 py-6 text-sm text-center">Nenhuma atividade ainda.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {activities.map((a) => (
            <li key={a.id} className="flex items-start gap-3 px-4 py-3">
              <ActivityIcon type={a.type} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-foreground text-[13px] leading-snug">{activityText(a)}</span>
                <span className="text-text-3 font-mono text-[11px]">
                  {timeFmt.format(new Date(a.created_at))}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
