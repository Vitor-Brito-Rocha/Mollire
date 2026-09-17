"use client";

import { Button } from "@/components/ui/button";

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

// A estrela: dourada e acesa quando é sua, neutra quando não. Um gesto, não
// uma nota — por isso não tem número de 1 a 5, só a contagem.
export function StarButton({
  name,
  stars,
  starred,
  disabled,
  onToggle,
  className,
}: {
  name: string;
  stars: number;
  starred: boolean;
  disabled?: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <Button
      variant="outline"
      size="lg"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={starred}
      aria-label={starred ? `Remover estrela de ${name}` : `Dar estrela para ${name}`}
      className={
        "font-display min-h-11 w-fit gap-2 px-3.5 text-xs font-semibold tracking-[0.08em] " +
        (starred
          ? "border-gold text-gold bg-gold/12 shadow-[0_0_14px_rgba(242,193,78,0.35)] hover:bg-gold/16 hover:text-gold"
          : "bg-raised border-line-2 text-muted-foreground hover:border-gold hover:text-foreground") +
        (className ? ` ${className}` : "")
      }
    >
      <StarIcon filled={starred} />
      <span className="font-mono text-[13px] font-medium tabular-nums">{stars}</span>
    </Button>
  );
}
