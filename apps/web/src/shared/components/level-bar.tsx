import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useCountUp } from "@/shared/hooks/use-count-up";
import { levelTitle, padLevel } from "@/shared/lib/level";
import { cn } from "@/shared/lib/utils";

const LAST_LEVEL_KEY = "mollire:last-level";

function readLastLevel(): number | null {
  try {
    const raw = localStorage.getItem(LAST_LEVEL_KEY);
    return raw ? Number(raw) || null : null;
  } catch {
    return null;
  }
}

function writeLastLevel(level: number) {
  try {
    localStorage.setItem(LAST_LEVEL_KEY, String(level));
  } catch {
    // storage indisponível: só perde a celebração entre sessões
  }
}

// Progresso de nível, no formato do HUD: rótulo em cima, barra segmentada
// embaixo. Não busca nada — recebe os números de quem já os tem.
//
// Recompensa: o XP conta para cima quando muda, e uma subida de nível — nesta
// sessão ou desde a última visita — ganha um selo animado e um toast.
export function LevelBar({
  level,
  xp,
  next,
  className,
}: {
  level: number;
  xp: number;
  next: number;
  className?: string;
}) {
  const pct = Math.min(100, Math.round((xp / next) * 100));
  const shownXp = useCountUp(xp);
  const [celebrating, setCelebrating] = useState(false);
  const previousLevel = useRef<number | null>(null);

  useEffect(() => {
    const previous = previousLevel.current ?? readLastLevel();
    previousLevel.current = level;
    writeLastLevel(level);
    if (previous === null || level <= previous) return;

    setCelebrating(true);
    toast.success(`Você subiu para o nível ${level} — ${levelTitle(level)}`);
    const timer = setTimeout(() => setCelebrating(false), 2200);
    return () => clearTimeout(timer);
  }, [level]);

  return (
    <div className={cn("relative flex w-[180px] flex-col gap-1.5", className)}>
      <div className="label text-muted-foreground flex items-baseline justify-between">
        <span>
          Nível <b className="text-foreground">{padLevel(level)}</b>
        </span>
        <span className="font-mono text-mini font-medium tracking-normal normal-case tabular-nums">
          {shownXp.toLocaleString("pt-BR")} / {next.toLocaleString("pt-BR")}
        </span>
      </div>
      <div
        className="xp-track h-1.5"
        role="progressbar"
        aria-label={`Nível ${level}`}
        aria-valuemin={0}
        aria-valuemax={next}
        aria-valuenow={xp}
      >
        <div className="xp-fill h-full transition-[width] duration-(--dur-slow) ease-out" style={{ width: `${pct}%` }} />
      </div>
      {celebrating && (
        // O invólucro centra sobre a barra (translate); o filho anima (scale).
        // Fica dentro da própria barra, sem invadir o que vem embaixo.
        <span role="status" className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center">
          <span className="animate-level-up chamfer-sm bg-primary text-primary-foreground label glow px-2.5 py-1 text-mini font-bold">
            Nível {padLevel(level)} · {levelTitle(level)}
          </span>
        </span>
      )}
    </div>
  );
}
