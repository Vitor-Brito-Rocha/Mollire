// Progresso de nível, no formato do HUD: rótulo em cima, barra segmentada
// embaixo. Não busca nada — recebe os números de quem já os tem.
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

  return (
    <div className={`flex w-[180px] flex-col gap-1.5 ${className ?? ""}`}>
      <div className="label text-muted-foreground flex items-baseline justify-between tracking-[0.08em]">
        <span>
          Nível <b className="text-foreground">{String(level).padStart(2, "0")}</b>
        </span>
        <span className="font-mono text-[11px] font-medium tracking-normal normal-case tabular-nums">
          {xp.toLocaleString("pt-BR")} / {next.toLocaleString("pt-BR")}
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
        <div className="xp-fill h-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
