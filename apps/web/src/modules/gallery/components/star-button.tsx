import { useEffect, useRef, useState } from "react";
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
  const [lit, setLit] = useState(false);
  const wasStarred = useRef(starred);

  useEffect(() => {
    const turnedOn = starred && !wasStarred.current;
    wasStarred.current = starred;
    if (!turnedOn) return;
    setLit(true);
    const timer = setTimeout(() => setLit(false), 700);
    return () => clearTimeout(timer);
  }, [starred]);

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
      {lit && (
        <span
          aria-hidden="true"
          className="animate-star-ring border-gold pointer-events-none absolute top-1/2 left-[19px] size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border"
        />
      )}
      <StarIcon filled={starred} pending={pending} lit={lit} />
      <span className="font-mono text-caption font-medium tabular-nums">{stars}</span>
    </Button>
  );
}
