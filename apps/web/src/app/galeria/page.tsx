"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { HudHeader } from "@/components/hud-header";
import { LevelBar } from "@/components/level-bar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  api,
  API_URL,
  ApiError,
  type CurrentUser,
  type GalleryFilter,
  type GalleryProject,
  type StarState,
} from "@/lib/api";

// Miniaturas decorativas: usadas só enquanto o projeto ainda não tem
// thumbnail real (capturado por screenshot após o primeiro deploy público).
const LOOKS = {
  sky: { bg: "linear-gradient(160deg,#3b82f6,#7dd3fc)", fg: "#ffffff", btn: "#ffffff" },
  dark: { bg: "linear-gradient(170deg,#0f172a,#1e293b)", fg: "#e2e8f0", btn: "#6366f1" },
  light: { bg: "#ffffff", fg: "#0f172a", btn: "#10b981" },
  warm: { bg: "linear-gradient(165deg,#fff7ed,#fed7aa)", fg: "#7c2d12", btn: "#ea580c" },
} as const;
type Look = keyof typeof LOOKS;
const LOOK_KEYS = Object.keys(LOOKS) as Look[];

function lookFor(slug: string): Look {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  return LOOK_KEYS[hash % LOOK_KEYS.length];
}

// Marcos por limiar, como medalhas: você alcança, não disputa. Abaixo de 10
// não há selo — marcar o projeto de um iniciante como "comum" desanima.
const TIERS = [
  { at: 100, label: "Ouro", color: "var(--gold)" },
  { at: 50, label: "Prata", color: "var(--silver)" },
  { at: 10, label: "Bronze", color: "var(--bronze)" },
] as const;

function tierFor(stars: number) {
  return TIERS.find((t) => stars >= t.at) ?? null;
}

const FILTERS: { label: string; value: GalleryFilter }[] = [
  { label: "Recentes", value: "recentes" },
  { label: "Em destaque", value: "destaque" },
  { label: "Todos", value: "todos" },
];

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-[15px] shrink-0"
      style={{ fill: filled ? "currentColor" : "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinejoin: "round" }}
    >
      <path d="M12 2.8l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.6 6.1 20.9l1.3-6.6L2.5 9.7l6.6-.8z" />
    </svg>
  );
}

function Thumb({ project }: { project: GalleryProject }) {
  if (project.thumbnail_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external, per-project origin; not worth next/image's static config here
      <img
        src={`${API_URL}${project.thumbnail_url}`}
        alt=""
        className="h-full w-full object-cover object-top"
      />
    );
  }

  const l = LOOKS[lookFor(project.slug)];
  return (
    <div className="flex h-full flex-col" style={{ background: l.bg, color: l.fg }}>
      <div className="flex items-center gap-1.5 px-3 py-2">
        <span className="h-[7px] w-5 rounded-[3px] bg-current opacity-85" />
        <span className="h-[5px] w-[13px] rounded-sm bg-current opacity-35" />
        <span className="h-[5px] w-[13px] rounded-sm bg-current opacity-35" />
        <span className="h-[5px] w-[13px] rounded-sm bg-current opacity-35" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-3 py-1.5">
        <span className="h-[11px] w-3/4 rounded-[3px] bg-current opacity-80" />
        <span className="h-[11px] w-1/2 rounded-[3px] bg-current opacity-80" />
        <span className="h-[5px] w-[88%] rounded-sm bg-current opacity-30" />
        <span className="mt-1 h-3.5 w-[54px] rounded-[7px]" style={{ background: l.btn }} />
      </div>
      <div className="flex gap-1.5 px-3 pb-3">
        <span className="h-7 flex-1 rounded-[5px] bg-current opacity-16" />
        <span className="h-7 flex-1 rounded-[5px] bg-current opacity-16" />
        <span className="h-7 flex-1 rounded-[5px] bg-current opacity-16" />
      </div>
    </div>
  );
}

export default function GaleriaPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [projects, setProjects] = useState<GalleryProject[] | null>(null);
  const [filter, setFilter] = useState<GalleryFilter>("recentes");
  const [pending, setPending] = useState<Record<string, boolean>>({});

  const loadUser = useCallback(() => {
    api
      .get<CurrentUser>("/users/me")
      .then(setUser)
      .catch(() => undefined);
  }, []);

  const loadGallery = useCallback((f: GalleryFilter) => {
    return api
      .get<GalleryProject[]>(`/gallery?filter=${f}`)
      .then(setProjects)
      .catch(() => toast.error("Erro ao carregar a galeria"));
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    loadGallery(filter);
  }, [filter, loadGallery]);

  async function toggleStar(project: GalleryProject) {
    // Visitante anônimo pode ver a galeria, mas estrela é um gesto de quem tem conta.
    if (!user) {
      router.push("/login");
      return;
    }
    if (pending[project.slug]) return;
    setPending((prev) => ({ ...prev, [project.slug]: true }));
    try {
      const result = project.starred_by_viewer
        ? await api.delete<StarState>(`/gallery/${project.slug}/star`)
        : await api.post<StarState>(`/gallery/${project.slug}/star`);
      setProjects((prev) =>
        prev?.map((p) => (p.slug === project.slug ? { ...p, ...result } : p)) ?? prev,
      );
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Erro ao dar estrela");
    } finally {
      setPending((prev) => ({ ...prev, [project.slug]: false }));
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <HudHeader>
        {user ? (
          <>
            <LevelBar level={user.level} xp={user.xp} next={user.next} className="hidden sm:flex" />
            <span className="hex bg-raised font-display text-muted-foreground grid size-[34px] place-items-center text-xs font-bold uppercase">
              {(user.handle ?? user.email).charAt(0)}
            </span>
          </>
        ) : (
          <Button size="sm" nativeButton={false} render={<Link href="/login">Entrar</Link>} />
        )}
      </HudHeader>

      <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-7 px-5 py-10 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-2.5">
            <span className="label text-primary flex items-center gap-2.5 tracking-[0.14em]">
              <span className="bg-primary h-0.5 w-[18px]" />
              Comunidade
            </span>
            <h1 className="font-display text-[38px] leading-[1.1] font-bold">Galeria</h1>
            <p className="text-muted-foreground max-w-[56ch] text-[15.5px]">
              O que a comunidade publicou. Dê uma estrela no que você gostou — é um gesto de
              apreço, não uma nota.
            </p>
          </div>

          <div className="bg-card border-border inline-flex gap-0.5 border p-[3px]" role="group" aria-label="Filtro">
            {FILTERS.map((f) => {
              const on = filter === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setFilter(f.value)}
                  className={
                    "label min-h-[38px] px-3.5 transition-colors " +
                    (on ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")
                  }
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {projects === null ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[268px] w-full" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum projeto publicado ainda.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const tier = tierFor(project.stars);

              return (
                <article
                  key={project.id}
                  className="corners bg-card border-border flex flex-col border"
                  style={{ "--corner": tier ? tier.color : "var(--line-2)" } as React.CSSProperties}
                >
                  <a
                    href={`https://${project.slug}.aulvi.com.br`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Abrir ${project.name}`}
                    className="border-border mx-1.5 mt-1.5 block h-[150px] overflow-hidden border"
                  >
                    <Thumb project={project} />
                  </a>

                  <div className="flex flex-col gap-3 px-4 pt-3.5 pb-4">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <Link
                          href={`https://${project.slug}.aulvi.com.br`}
                          className="truncate text-base leading-tight font-semibold"
                        >
                          {project.name}
                        </Link>
                        <span className="text-muted-foreground text-[12.5px]">
                          {project.author} ·{" "}
                          <span className="text-text-3 font-mono text-[11.5px]">
                            {project.slug}.aulvi.com.br
                          </span>
                        </span>
                      </div>
                      {tier && (
                        <span
                          className="tag-cut bg-raised label shrink-0 py-[5px] pr-2 pl-[11px] text-[10px] font-bold"
                          style={{ color: tier.color, boxShadow: `inset 3px 0 0 ${tier.color}` }}
                        >
                          {tier.label}
                        </span>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => toggleStar(project)}
                      disabled={pending[project.slug]}
                      aria-pressed={project.starred_by_viewer}
                      aria-label={
                        project.starred_by_viewer
                          ? `Remover estrela de ${project.name}`
                          : `Dar estrela para ${project.name}`
                      }
                      className={
                        "font-display min-h-11 w-fit gap-2 px-3.5 text-xs font-semibold tracking-[0.08em] " +
                        (project.starred_by_viewer
                          ? "border-gold text-gold bg-gold/12 shadow-[0_0_14px_rgba(242,193,78,0.35)] hover:bg-gold/16 hover:text-gold"
                          : "bg-raised border-line-2 text-muted-foreground hover:border-gold hover:text-foreground")
                      }
                    >
                      <StarIcon filled={project.starred_by_viewer} />
                      <span className="font-mono text-[13px] font-medium tabular-nums">{project.stars}</span>
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
