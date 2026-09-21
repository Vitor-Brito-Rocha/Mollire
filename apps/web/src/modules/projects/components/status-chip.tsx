import type { DeploymentStatus } from "../types";

// Chip de estado no formato do HUD: ponto luminoso + rótulo curto. A cor
// carrega o significado (verde bom, vermelho erro, acento em andamento).
const TONE = {
  good: "text-good bg-good/10 shadow-[inset_0_0_0_1px_var(--ring-good)] [--dot:var(--good)]",
  bad: "text-destructive bg-destructive/10 shadow-[inset_0_0_0_1px_var(--ring-bad)] [--dot:var(--destructive)]",
  busy: "text-primary bg-primary/10 shadow-[inset_0_0_0_1px_var(--glow)] [--dot:var(--primary)]",
  idle: "text-muted-foreground bg-raised shadow-[inset_0_0_0_1px_var(--border)] [--dot:var(--text-3)]",
} as const;

export function StatusChip({
  tone,
  children,
  className,
}: {
  tone: keyof typeof TONE;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`label inline-flex w-fit items-center gap-1.5 px-2 py-1 text-micro font-bold whitespace-nowrap ${TONE[tone]} ${className ?? ""}`}
    >
      <span className={"size-1.5 shrink-0 bg-(--dot) shadow-[0_0_8px_var(--dot)]" + (tone === "busy" ? " animate-dot-pulse" : "")} />
      {children}
    </span>
  );
}

const DEPLOY: Record<DeploymentStatus, { label: string; tone: keyof typeof TONE }> = {
  QUEUED:    { label: "Aguardando", tone: "busy" },
  PENDING: { label: "Na fila", tone: "busy" },
  CLONING: { label: "Clonando", tone: "busy" },
  BUILDING: { label: "Construindo", tone: "busy" },
  PUBLISHING: { label: "Publicando", tone: "busy" },
  SUCCESS: { label: "Publicado", tone: "good" },
  FAILED: { label: "Falhou", tone: "bad" },
};

export function DeployStatus({ status, className }: { status: DeploymentStatus; className?: string }) {
  const s = DEPLOY[status];
  return (
    <StatusChip tone={s.tone} className={className}>
      {s.label}
    </StatusChip>
  );
}
