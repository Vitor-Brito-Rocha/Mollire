import { cn } from "@/shared/lib/utils";

// Chip de estado no formato do HUD: ponto luminoso + rótulo curto. A cor
// carrega o significado: verde bom, vermelho erro, acento em andamento (pulsa)
// ou em evidência (parado), cinza neutro. É o único rótulo pequeno do app
// além do selo de conquista.
const TONE = {
  good: "text-good bg-good/10 shadow-[inset_0_0_0_1px_var(--ring-good)] [--dot:var(--good)]",
  bad: "text-destructive bg-destructive/10 shadow-[inset_0_0_0_1px_var(--ring-bad)] [--dot:var(--destructive)]",
  busy: "text-primary bg-primary/10 shadow-[inset_0_0_0_1px_var(--glow)] [--dot:var(--primary)]",
  accent: "text-primary bg-primary/10 shadow-[inset_0_0_0_1px_var(--glow)] [--dot:var(--primary)]",
  idle: "text-muted-foreground bg-raised shadow-[inset_0_0_0_1px_var(--border)] [--dot:var(--text-3)]",
} as const;

export type ChipTone = keyof typeof TONE;

export function StatusChip({
  tone,
  live = false,
  children,
  className,
}: {
  tone: ChipTone;
  // Anuncia mudanças a leitores de tela (estado de um deploy em andamento).
  live?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      role={live ? "status" : undefined}
      className={cn(
        "label text-mini inline-flex w-fit shrink-0 items-center gap-1.5 px-2 py-1 font-bold whitespace-nowrap",
        TONE[tone],
        className,
      )}
    >
      <span className={cn("size-1.5 shrink-0 bg-(--dot) shadow-[0_0_8px_var(--dot)]", tone === "busy" && "animate-dot-pulse")} />
      {children}
    </span>
  );
}
