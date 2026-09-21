import { Link } from "react-router";
import { useRequiredParam } from "@/shared/hooks/use-required-param";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteThumb } from "@/shared/components/site-thumb";
import { Skeleton } from "@/shared/ui/skeleton";
import { http, ApiError } from "@/shared/lib/http";
import type { UserProfile } from "../types";
import { tierFor } from "@/modules/gallery";

const joinedFmt = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

// Build a 7-row (days of week) × N-column (weeks) grid for the last 365 days.
function buildGrid(heatmap: UserProfile["heatmap"]) {
  const map = new Map(heatmap.map((h) => [h.date, h.count]));

  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 364);

  // Pad start back to Monday (0=Sun → go back 6; 1=Mon → 0; ...; 6=Sat → 5)
  const dow = start.getDay();
  start.setDate(start.getDate() - (dow === 0 ? 6 : dow - 1));

  const weeks: { date: string | null; count: number }[][] = [];
  const cursor = new Date(start);

  while (cursor <= today) {
    const week: { date: string | null; count: number }[] = [];
    for (let d = 0; d < 7; d++) {
      if (cursor <= today) {
        const dateStr = cursor.toISOString().slice(0, 10);
        week.push({ date: dateStr, count: map.get(dateStr) ?? 0 });
      } else {
        week.push({ date: null, count: 0 });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  return weeks;
}

function cellColor(count: number): string {
  if (count === 0) return "var(--muted)";
  if (count === 1) return "color-mix(in srgb, var(--primary) 30%, transparent)";
  if (count <= 3) return "color-mix(in srgb, var(--primary) 55%, transparent)";
  if (count <= 6) return "color-mix(in srgb, var(--primary) 80%, transparent)";
  return "var(--primary)";
}

function Heatmap({ data }: { data: UserProfile["heatmap"] }) {
  const weeks = buildGrid(data);
  const total = data.reduce((s, h) => s + h.count, 0);

  return (
    <div className="flex flex-col gap-3">
      <h2 className="label flex items-center gap-2.5">
        <span className="bg-primary h-0.5 w-[18px]" />
        Atividade
        <span className="text-text-3 font-mono text-xs tracking-normal normal-case">{total} contribuições no último ano</span>
      </h2>
      <div
        className="overflow-x-auto"
        style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        <div className="flex gap-[3px]" style={{ width: "max-content" }}>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((cell, di) =>
                cell.date === null ? (
                  <div key={di} className="size-[11px]" />
                ) : (
                  <div
                    key={di}
                    className="size-[11px] rounded-[2px]"
                    style={{ background: cellColor(cell.count) }}
                    title={
                      cell.count === 0
                        ? cell.date
                        : `${cell.count} contribuição${cell.count > 1 ? "ões" : ""} em ${cell.date}`
                    }
                  />
                ),
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function UserProfilePage() {
  const handle = useRequiredParam("handle");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    http
      .get<UserProfile>(`/users/${handle}`)
      .then(setProfile)
      .catch((error) => {
        if (error instanceof ApiError && error.status_code === 404) setMissing(true);
        else toast.error("Erro ao carregar o perfil");
      });
  }, [handle]);

  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-10">
      {missing ? (
        <div className="corners bg-card border-border flex flex-col items-center gap-3 border px-6 py-16 text-center">
          <h1 className="font-display text-2xl font-bold">Perfil não encontrado</h1>
          <p className="text-muted-foreground max-w-[40ch]">
            Nenhum usuário com o apelido <span className="font-mono">@{handle}</span>.
          </p>
        </div>
      ) : profile === null ? (
        <>
          <Skeleton className="h-20 w-full max-w-xs" />
          <Skeleton className="h-28 w-full" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[220px] w-full" />
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-start gap-5">
            <span className="hex bg-card font-display text-muted-foreground grid size-14 shrink-0 place-items-center text-2xl font-bold uppercase">
              {profile.handle.charAt(0)}
            </span>
            <div className="flex flex-col gap-1">
              <h1 className="font-display text-[28px] font-bold leading-tight">@{profile.handle}</h1>
              <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span>
                  Nível <span className="text-foreground font-semibold">{profile.level}</span>
                  {" · "}
                  <span className="font-mono">{profile.xp.toLocaleString("pt-BR")} XP</span>
                </span>
                <span className="text-border">·</span>
                <span>Membro desde {joinedFmt.format(new Date(profile.joined_at))}</span>
              </div>
            </div>
          </div>

          {/* Heatmap */}
          <Heatmap data={profile.heatmap} />

          {/* Projects */}
          <div className="flex flex-col gap-5">
            <h2 className="label flex items-center gap-2.5">
              <span className="bg-primary h-0.5 w-[18px]" />
              Projetos públicos
              <span className="text-text-3 font-mono text-xs tracking-normal normal-case">{profile.projects.length}</span>
            </h2>

            {profile.projects.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum projeto publicado ainda.</p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {profile.projects.map((project) => {
                  const tier = tierFor(project.stars);
                  return (
                    <article
                      key={project.slug}
                      className="corners bg-card border-border flex flex-col border"
                      style={{ "--corner": tier ? tier.color : "var(--line-2)" } as React.CSSProperties}
                    >
                      <Link
                        to={`/galeria/${project.slug}`}
                        aria-label={`Abrir ${project.name}`}
                        className="border-border mx-1.5 mt-1.5 block h-[130px] overflow-hidden border"
                      >
                        <SiteThumb slug={project.slug} thumbnailUrl={project.thumbnail_url} name={project.name} />
                      </Link>
                      <div className="flex flex-col gap-2 px-4 pt-3 pb-4">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            to={`/galeria/${project.slug}`}
                            className="truncate text-sm font-semibold leading-tight"
                          >
                            {project.name}
                          </Link>
                          {tier && (
                            <span
                              className="tag-cut bg-raised label shrink-0 py-[4px] pr-2 pl-[9px] text-[10px] font-bold"
                              style={{ color: tier.color, boxShadow: `inset 3px 0 0 ${tier.color}` }}
                            >
                              {tier.label}
                            </span>
                          )}
                        </div>
                        <div className="text-text-3 flex items-center gap-1.5 text-xs">
                          <span className="font-mono">{project.slug}.aulvi.com.br</span>
                          <span className="text-border">·</span>
                          <span className="font-mono">★ {project.stars}</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
