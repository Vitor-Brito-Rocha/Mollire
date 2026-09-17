"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { GalleryHeader } from "@/components/gallery-header";
import { SiteThumb } from "@/components/site-thumb";
import { StarButton } from "@/components/star-button";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError, type GalleryFilter, type GalleryProject, type StarState } from "@/lib/api";
import { tierFor } from "@/lib/tiers";
import { useCurrentUser } from "@/lib/use-current-user";

const FILTERS: { label: string; value: GalleryFilter }[] = [
  { label: "Recentes", value: "recentes" },
  { label: "Em destaque", value: "destaque" },
  { label: "Todos", value: "todos" },
];

export default function GaleriaPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [projects, setProjects] = useState<GalleryProject[] | null>(null);
  const [filter, setFilter] = useState<GalleryFilter>("recentes");
  const [pending, setPending] = useState<Record<string, boolean>>({});

  const loadGallery = useCallback((f: GalleryFilter) => {
    return api
      .get<GalleryProject[]>(`/gallery?filter=${f}`)
      .then(setProjects)
      .catch(() => toast.error("Erro ao carregar a galeria"));
  }, []);

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
      <GalleryHeader user={user} />

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

          <div className="bg-card border-border inline-flex max-w-full flex-wrap gap-0.5 border p-[3px]" role="group" aria-label="Filtro">
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
                  <Link
                    href={`/galeria/${project.slug}`}
                    aria-label={`Abrir ${project.name}`}
                    className="border-border mx-1.5 mt-1.5 block h-[150px] overflow-hidden border"
                  >
                    <SiteThumb slug={project.slug} thumbnailUrl={project.thumbnail_url} name={project.name} />
                  </Link>

                  <div className="flex flex-col gap-3 px-4 pt-3.5 pb-4">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <Link
                          href={`/galeria/${project.slug}`}
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

                    <StarButton
                      name={project.name}
                      stars={project.stars}
                      starred={project.starred_by_viewer}
                      disabled={pending[project.slug]}
                      onToggle={() => toggleStar(project)}
                    />
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
