import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/button";

function StarIcon({ filled, pending, lit }: { filled: boolean; pending: boolean; lit: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={
        "size-[15px] shrink-0 " + (pending ? "animate-pulse " : "") + (lit ? "animate-star-pop " : "")
      }
      style={{ fill: filled ? "currentColor" : "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinejoin: "round" }}
    >
      <path d="M12 2.8l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.6 6.1 20.9l1.3-6.6L2.5 9.7l6.6-.8z" />
    </svg>
  );
}

// A estrela: dourada e acesa quando é sua, neutra quando não. Um gesto, não
// uma nota — por isso não tem número de 1 a 5, só a contagem.
//
// Acender é um momento: a estrela dá um pulo e solta um anel de luz. Apagar
// não celebra nada.
export function StarButton({
  name,
  stars,
  starred,
  pending = false,
  onToggle,
}: {
  name: string;
  stars: number;
  starred: boolean;
  // The request is running: the star pulses and a second click is ignored. The
  // button keeps its look — the count already shows the (optimistic) result.
  pending?: boolean;
  onToggle: () => void;
}) {
  // Cada acendimento ganha um número novo; 0 é apagado. Derivado durante a
  // renderização (não num efeito): acender marca, apagar zera na hora. O
  // temporizador apaga só o número que o criou, então clicar várias vezes
  // rápido nunca deixa um anel preso.
  const [previousStarred, setPreviousStarred] = useState(starred);
  const [glow, setGlow] = useState(0);
  if (starred !== previousStarred) {
    setPreviousStarred(starred);
    setGlow(starred ? glow + 1 : 0);
  }
  const lit = glow > 0;

  useEffect(() => {
    if (!glow) return;
    const timer = window.setTimeout(() => setGlow((current) => (current === glow ? 0 : current)), 700);
    return () => window.clearTimeout(timer);
  }, [glow]);

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={onToggle}
      disabled={pending}
      aria-pressed={starred}
      aria-busy={pending}
      aria-label={starred ? `Remover estrela de ${name}` : `Dar estrela para ${name}`}
      className={
        "font-display relative min-h-11 w-fit gap-2 px-3.5 text-xs font-semibold transition-colors disabled:opacity-100 " +
        (starred
          ? "border-gold text-gold bg-gold/12 shadow-[0_0_14px_var(--glow-gold)] hover:bg-gold/16 hover:text-gold"
          : "bg-raised border-line-2 text-muted-foreground hover:border-gold hover:text-foreground")
      }
    >
      {/* O anel tem exatamente a caixa do ícone (inset-0, sem tamanho próprio) e
          cresce do centro por scale; nada de translate ou margem automática. */}
      <span className="relative grid place-items-center">
        {lit && (
          <span
            aria-hidden="true"
            className="animate-star-ring border-gold pointer-events-none absolute inset-0 rounded-full border"
          />
        )}
        <StarIcon filled={starred} pending={pending} lit={lit} />
      </span>
      <span className="font-mono text-caption font-medium tabular-nums">{stars}</span>
    </Button>
  );
}
