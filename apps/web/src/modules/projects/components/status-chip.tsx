import { StatusChip, type ChipTone } from "@/shared/components/status-chip";
import type { DeploymentStatus } from "../types";

export { StatusChip };

const DEPLOY: Record<DeploymentStatus, { label: string; tone: ChipTone }> = {
  QUEUED: { label: "Aguardando", tone: "busy" },
  PENDING: { label: "Na fila", tone: "busy" },
  CLONING: { label: "Clonando", tone: "busy" },
  BUILDING: { label: "Construindo", tone: "busy" },
  PUBLISHING: { label: "Publicando", tone: "busy" },
  SUCCESS: { label: "Publicado", tone: "good" },
  FAILED: { label: "Falhou", tone: "bad" },
};

// O estado de um deploy, anunciado a leitores de tela quando muda.
export function DeployStatus({ status, className }: { status: DeploymentStatus; className?: string }) {
  const s = DEPLOY[status];
  return (
    <StatusChip tone={s.tone} live className={className}>
      {s.label}
    </StatusChip>
  );
}
