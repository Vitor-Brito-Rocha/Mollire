"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { GalleryHeader } from "@/components/gallery-header";
import { SiteThumb } from "@/components/site-thumb";
import { StarButton } from "@/components/star-button";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  api,
  ApiError,
  type GalleryComment,
  type GalleryProjectDetail,
  type StarState,
} from "@/lib/api";
import { tierFor } from "@/lib/tiers";
import { useCurrentUser } from "@/lib/use-current-user";

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
const whenFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

function timeAgo(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `há ${days} ${days === 1 ? "dia" : "dias"}`;
  return whenFmt.format(new Date(iso));
}

function BackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-3.5"
      style={{ fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}
    >
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export default function GalleryProjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useCurrentUser();
  const [project, setProject] = useState<GalleryProjectDetail | null>(null);
  const [missing, setMissing] = useState(false);
  const [comments, setComments] = useState<GalleryComment[] | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [starPending, setStarPending] = useState(false);

  useEffect(() => {
    api
      .get<GalleryProjectDetail>(`/gallery/${slug}`)
      .then(setProject)
      .catch((error) => {
        if (error instanceof ApiError && error.status_code === 404) setMissing(true);
        else toast.error("Erro ao carregar o projeto");
      });
    api
      .get<GalleryComment[]>(`/gallery/${slug}/comments`)
      .then(setComments)
      .catch(() => setComments([]));
  }, [slug]);

  async function toggleStar() {
    if (!project) return;
    if (!user) {
      router.push("/login");
      return;
    }
    setStarPending(true);
    try {
      const result = project.starred_by_viewer
        ? await api.delete<StarState>(`/gallery/${slug}/star`)
        : await api.post<StarState>(`/gallery/${slug}/star`);
      setProject({ ...project, ...result });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Erro ao dar estrela");
    } finally {
      setStarPending(false);
    }
  }

  async function submitComment(event: FormEvent) {
    event.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }
    const text = body.trim();
    if (!text) return;
    setSending(true);
    try {
      const created = await api.post<GalleryComment>(`/gallery/${slug}/comments`, { body: text });
      setComments((prev) => [...(prev ?? []), created]);
      setProject((prev) => (prev ? { ...prev, comments: prev.comments + 1 } : prev));
      setBody("");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Erro ao comentar");
    } finally {
      setSending(false);
    }
  }

  async function deleteComment(comment: GalleryComment) {
    try {
      await api.delete(`/gallery/${slug}/comments/${comment.id}`);
      setComments((prev) => prev?.filter((c) => c.id !== comment.id) ?? prev);
      setProject((prev) => (prev ? { ...prev, comments: Math.max(0, prev.comments - 1) } : prev));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Erro ao remover comentário");
    }
  }

  const tier = project ? tierFor(project.stars) : null;

  return (
    <div className="flex min-h-screen flex-col">
      <GalleryHeader user={user} />

      <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-5 py-8 md:px-10">
        <Link
          href="/galeria"
          className="label text-muted-foreground hover:text-foreground flex w-fit items-center gap-2 transition-colors"
        >
          <BackIcon />
          Galeria
        </Link>

        {missing ? (
          <div className="corners bg-card border-border flex flex-col items-center gap-3 border px-6 py-16 text-center">
            <h1 className="font-display text-2xl font-bold">Projeto não encontrado</h1>
            <p className="text-muted-foreground max-w-[40ch]">
              Ou ele não existe, ou o dono ainda não publicou na galeria.
            </p>
            <Button size="lg" nativeButton={false} render={<Link href="/galeria">Voltar à galeria</Link>} />
          </div>
        ) : project === null ? (
          <div className="grid gap-8 lg:grid-cols-3">
            <Skeleton className="h-[420px] w-full lg:col-span-2" />
            <Skeleton className="h-[320px] w-full" />
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="flex flex-col gap-6 lg:col-span-2">
              <a
                href={project.url}
                target="_blank"
                rel="noreferrer"
                aria-label={`Abrir ${project.name} em nova aba`}
                className="corners border-border block border"
              >
                <div className="border-border bg-card flex items-center gap-2 border-b px-3.5 py-2.5">
                  <span className="bg-line-2 size-2" />
                  <span className="bg-line-2 size-2" />
                  <span className="bg-line-2 size-2" />
                  <span className="text-text-3 ml-2 truncate font-mono text-xs">{project.url.replace(/^https?:\/\//, "")}</span>
                  <StatusChip tone="good" className="ml-auto">No ar</StatusChip>
                </div>
                <div className="h-[280px] overflow-hidden sm:h-[420px]">
                  <SiteThumb slug={project.slug} thumbnailUrl={project.thumbnail_url} name={project.name} />
                </div>
              </a>

              <section className="flex flex-col gap-4">
                <h2 className="label flex items-center gap-2.5">
                  <span className="bg-primary h-0.5 w-[18px]" />
                  Comentários
                  <span className="text-text-3 font-mono text-xs tracking-normal normal-case">{project.comments}</span>
                </h2>

                {user ? (
                  <form onSubmit={submitComment} className="flex flex-col gap-2">
                    <Label htmlFor="comentario">Deixe um comentário</Label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        id="comentario"
                        value={body}
                        onChange={(event) => setBody(event.target.value)}
                        placeholder="O que você achou do projeto?"
                        maxLength={1000}
                        className="bg-card"
                      />
                      <Button type="submit" size="lg" disabled={sending || !body.trim()}>
                        {sending ? "Enviando..." : "Publicar"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="corners bg-card border-border flex flex-wrap items-center justify-between gap-3 border px-4 py-3">
                    <span className="text-muted-foreground text-sm">Entre para deixar um comentário.</span>
                    <Button size="sm" nativeButton={false} render={<Link href="/login">Entrar</Link>} />
                  </div>
                )}

                {comments === null ? (
                  <Skeleton className="h-24 w-full" />
                ) : comments.length === 0 ? (
                  <p className="text-text-3 text-sm">Ninguém comentou ainda. Seja a primeira pessoa.</p>
                ) : (
                  <div className="corners bg-card border-border flex flex-col border">
                    {comments.map((comment) => (
                      <div key={comment.id} className="border-border flex gap-3 border-b p-4 last:border-b-0">
                        <span className="hex bg-raised font-display text-muted-foreground grid size-8 shrink-0 place-items-center text-xs font-bold uppercase">
                          {comment.author.charAt(0)}
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                            <span className="text-sm font-semibold">{comment.author}</span>
                            {comment.is_project_owner && (
                              <span className="label text-primary border-primary border px-1.5 py-0.5 text-[9.5px]">autor</span>
                            )}
                            <span className="text-text-3 text-xs">{timeAgo(comment.created_at)}</span>
                            {comment.can_delete && (
                              <button
                                type="button"
                                onClick={() => deleteComment(comment)}
                                className="text-text-3 hover:text-destructive ml-auto text-xs underline underline-offset-4"
                              >
                                remover
                              </button>
                            )}
                          </div>
                          <p className="text-[14.5px] leading-relaxed break-words whitespace-pre-line">{comment.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <aside className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                {tier && (
                  <span
                    className="tag-cut bg-raised label w-fit py-[5px] pr-2 pl-[11px] text-[10px] font-bold"
                    style={{ color: tier.color, boxShadow: `inset 3px 0 0 ${tier.color}` }}
                  >
                    {tier.label}
                  </span>
                )}
                <h1 className="font-display text-[30px] leading-[1.1] font-bold">{project.name}</h1>
                <span className="text-muted-foreground text-sm">por {project.author}</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {!project.is_owner && (
                  <StarButton
                    name={project.name}
                    stars={project.stars}
                    starred={project.starred_by_viewer}
                    disabled={starPending}
                    onToggle={toggleStar}
                  />
                )}
                <Button
                  variant="outline"
                  size="lg"
                  nativeButton={false}
                  render={
                    <a href={project.url} target="_blank" rel="noreferrer">
                      Abrir site
                    </a>
                  }
                />
              </div>
              {project.is_owner && (
                <p className="text-text-3 text-xs">
                  Este projeto é seu — quem dá estrela é a comunidade.{" "}
                  <Link href={`/projects/${project.slug}`} className="text-muted-foreground hover:text-foreground underline underline-offset-4">
                    Gerenciar
                  </Link>
                </p>
              )}

              <dl className="corners bg-card border-border flex flex-col border">
                <div className="border-border flex justify-between gap-3 border-b px-4 py-3 text-sm">
                  <dt className="text-muted-foreground">Publicado</dt>
                  <dd>{project.published_at ? dateFmt.format(new Date(project.published_at)) : "—"}</dd>
                </div>
                <div className="border-border flex justify-between gap-3 border-b px-4 py-3 text-sm">
                  <dt className="text-muted-foreground">Último deploy</dt>
                  <dd>{project.last_deploy_at ? whenFmt.format(new Date(project.last_deploy_at)) : "—"}</dd>
                </div>
                <div className="border-border flex justify-between gap-3 border-b px-4 py-3 text-sm">
                  <dt className="text-muted-foreground">Estrelas</dt>
                  <dd className="font-mono tabular-nums">{project.stars}</dd>
                </div>
                <div className="flex justify-between gap-3 px-4 py-3 text-sm">
                  <dt className="text-muted-foreground">Comentários</dt>
                  <dd className="font-mono tabular-nums">{project.comments}</dd>
                </div>
              </dl>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
