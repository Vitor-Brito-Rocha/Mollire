import { ChevronLeft, ChevronRight, Maximize, Minimize, Star, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router";
import { projectHost, projectUrl } from "@/modules/projects";
import { Eyebrow } from "@/shared/components/eyebrow";
import { QrCode } from "@/shared/components/qr-code";
import { SiteThumb } from "@/shared/components/site-thumb";
import { StatusChip } from "@/shared/components/status-chip";
import { useRequiredParam } from "@/shared/hooks/use-required-param";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { TeamAvatars } from "../components/team-avatars";
import { useTurma, useTurmaGallery } from "../hooks/use-turmas";

// O dia de apresentar: tela cheia, um projeto por vez, capa grande, QR code
// para a turma abrir no celular e as estrelas contando ao vivo. Só front:
// é a galeria da turma, lida a cada poucos segundos.
export default function TurmaPresentPage() {
  const id = useRequiredParam("id");
  const navigate = useNavigate();
  const { data: turma } = useTurma(id);
  const { data: projects, isPending } = useTurmaGallery(id, { live: true });
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const total = projects?.length ?? 0;
  const project = projects?.[Math.min(index, Math.max(total - 1, 0))];

  const next = useCallback(() => setIndex((i) => Math.min(i + 1, Math.max(total - 1, 0))), [total]);
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);
  const exit = useCallback(() => navigate(`/turmas/${id}`), [navigate, id]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === " " || event.key === "Enter") {
        event.preventDefault();
        next();
      } else if (event.key === "ArrowLeft") {
        prev();
      } else if (event.key === "Escape" && !document.fullscreenElement) {
        exit();
      } else if (event.key.toLowerCase() === "f") {
        toggleFullscreen();
      }
    };
    const onFullscreen = () => setFullscreen(!!document.fullscreenElement);
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFullscreen);
      if (document.fullscreenElement) void document.exitFullscreen();
    };
  }, [next, prev, exit, toggleFullscreen]);

  // Portal no body: a animação de rota (transform) faria o `fixed` se
  // prender ao <main>, deixando a barra lateral à mostra.
  return createPortal(
    <div className="bg-background hud-grid fixed inset-0 z-50 flex flex-col overflow-x-hidden overflow-y-auto">
      <header className="flex items-center justify-between gap-4 px-6 py-4 md:px-10">
        <Eyebrow className="min-w-0">
          <span className="truncate">{turma?.name ?? "Turma"}</span>
        </Eyebrow>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleFullscreen}>
            {fullscreen ? <Minimize className="size-3.5" /> : <Maximize className="size-3.5" />}
            {fullscreen ? "Sair da tela cheia" : "Tela cheia"}
          </Button>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link to={`/turmas/${id}`} />}>
            <X className="size-3.5" />
            Sair
          </Button>
        </div>
      </header>

      <main className="flex flex-1 items-center px-6 py-4 md:px-10">
        {isPending ? (
          <Skeleton className="aspect-[16/10] w-full max-w-4xl" aria-busy="true" />
        ) : !project ? (
          <p className="text-muted-foreground mx-auto text-center">Nenhum projeto enviado à turma ainda.</p>
        ) : (
          <div className="grid w-full items-center gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-14">
            <div key={project.slug} className="corners border-border bg-raised route-enter aspect-[16/10] w-full min-w-0 overflow-hidden border">
              <SiteThumb slug={project.slug} thumbnailUrl={project.thumbnail_url} name={project.name} size="card" />
            </div>

            <div key={`${project.slug}-info`} className="route-enter flex min-w-0 flex-col gap-5">
              {project.group && <StatusChip tone="idle">{project.group.name}</StatusChip>}
              <h1 className="font-display text-display-lg tracking-display font-bold break-words md:text-display-xl">{project.name}</h1>
              {project.team && project.team.length > 1 ? (
                <TeamAvatars team={project.team} className="text-body-lg" />
              ) : (
                <span className="text-muted-foreground text-body-lg">por {project.author}</span>
              )}
              <div className="flex items-baseline gap-3" aria-live="polite">
                <Star className="text-gold size-7 self-center" aria-hidden="true" />
                <span className="font-display text-display-lg font-bold tabular-nums">{project.stars}</span>
                <span className="text-muted-foreground text-body-lg">{project.stars === 1 ? "estrela" : "estrelas"}</span>
              </div>
              <div className="flex items-center gap-5 pt-2">
                <div className="w-[136px] shrink-0 p-2" style={{ background: "#fff" }}>
                  <QrCode value={projectUrl(project.slug)} label={`QR code de ${projectHost(project.slug)}`} />
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="label text-text-3 text-mini">Aponte a câmera</span>
                  <a href={projectUrl(project.slug)} target="_blank" rel="noreferrer" className="hover:text-primary truncate font-mono text-sm transition-colors">
                    {projectHost(project.slug)}
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 md:px-10">
        <span className="text-text-3 font-mono text-sm tabular-nums">
          {total === 0 ? "0 / 0" : `${index + 1} / ${total}`}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-lg" aria-label="Projeto anterior" onClick={prev} disabled={index === 0}>
            <ChevronLeft />
          </Button>
          <Button size="icon-lg" aria-label="Próximo projeto" onClick={next} disabled={index >= total - 1}>
            <ChevronRight />
          </Button>
        </div>
        <span className="text-text-3 hidden text-xs sm:inline">← → passam · F tela cheia · Esc sai</span>
      </footer>
    </div>,
    document.body,
  );
}
