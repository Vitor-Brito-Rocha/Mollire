import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { StatusChip } from "@/shared/components/status-chip";
import { useThumbnailSrc } from "@/shared/hooks/use-thumbnail-src";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

export type TimeMachineFrame = {
  id: string;
  // Caminho da captura na API (o hook põe o domínio e o cabeçalho do ngrok).
  url: string;
  title: string;
  meta: string;
  note?: string | null;
};

const STEP_MS = 1400;

// Todas as capturas ficam montadas, empilhadas, e só a atual aparece: assim o
// "ver evolução" passa sem piscar. Quem chama limita a quantidade.
function FrameImage({ frame, active }: { frame: TimeMachineFrame; active: boolean }) {
  const { src } = useThumbnailSrc(frame.url);
  if (!src) return null;
  return (
    <img
      src={src}
      alt={active ? `Captura: ${frame.title}` : ""}
      aria-hidden={!active}
      className={cn(
        "absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-(--dur)",
        active ? "opacity-100" : "opacity-0",
      )}
    />
  );
}

// A máquina do tempo: as capturas de um site, uma por deploy, do primeiro ao
// atual. Um controle deslizante, setas, e o botão que passa tudo sozinho.
// `frames` em ordem cronológica (a mais antiga primeiro).
export function TimeMachine({ frames, className }: { frames: TimeMachineFrame[]; className?: string }) {
  const last = frames.length - 1;
  const [index, setIndex] = useState(last);
  const [playing, setPlaying] = useState(false);
  const atEnd = index >= last;
  // Tocando de verdade: no fim, o botão vira "ver de novo" sem efeito nenhum.
  const running = playing && !atEnd;
  const current = frames[Math.min(index, last)];

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setIndex((i) => Math.min(i + 1, last)), STEP_MS);
    return () => window.clearInterval(timer);
  }, [running, last]);

  function go(next: number) {
    setPlaying(false);
    setIndex(Math.max(0, Math.min(next, last)));
  }

  function togglePlay() {
    if (running) {
      setPlaying(false);
      return;
    }
    if (atEnd) setIndex(0);
    setPlaying(true);
  }

  if (!current) return null;

  return (
    <div className={cn("grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]", className)}>
      <div className="flex flex-col gap-3">
        <div className="corners border-border bg-raised relative aspect-[16/10] w-full overflow-hidden border">
          {frames.map((frame, i) => (
            <FrameImage key={frame.id} frame={frame} active={i === index} />
          ))}
          <StatusChip tone="accent" className="absolute top-3 left-3 tabular-nums">
            {index + 1} / {frames.length}
          </StatusChip>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="icon-lg" aria-label="Deploy anterior" onClick={() => go(index - 1)} disabled={index === 0}>
            <ChevronLeft />
          </Button>
          <input
            type="range"
            min={0}
            max={last}
            value={index}
            onChange={(event) => go(Number(event.target.value))}
            aria-label="Deploy"
            aria-valuetext={`${index + 1} de ${frames.length}: ${current.title}`}
            className="accent-primary h-9 min-w-0 flex-1 cursor-pointer"
          />
          <Button variant="outline" size="icon-lg" aria-label="Próximo deploy" onClick={() => go(index + 1)} disabled={atEnd}>
            <ChevronRight />
          </Button>
          {/* No celular o botão desce para a própria linha; a barra fica com as setas. */}
          <Button variant={running ? "default" : "outline"} size="sm" onClick={togglePlay} className="w-full sm:ml-1 sm:w-auto">
            {running ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            {running ? "Pausar" : atEnd ? "Ver de novo" : "Ver evolução"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 lg:pt-1">
        <span className="label text-text-3 text-mini">Deploy {index + 1} de {frames.length}</span>
        <span className="text-heading font-semibold leading-snug">{current.title}</span>
        <span className="text-text-3 font-mono text-xs">{current.meta}</span>
        {current.note ? (
          <blockquote className="border-primary/40 text-muted-foreground mt-2 border-l-2 pl-3 text-sm leading-relaxed">
            <span className="label text-text-3 mb-1 block text-micro">Diário de bordo</span>
            {current.note}
          </blockquote>
        ) : (
          <span className="text-text-3 mt-2 text-xs">Sem anotação neste deploy.</span>
        )}
      </div>
    </div>
  );
}
