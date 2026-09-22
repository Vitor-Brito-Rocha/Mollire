import { Link } from "react-router";
import { HudDialog } from "@/shared/components/hud-dialog";
import { StatusChip } from "@/shared/components/status-chip";
import { formatDayMonth } from "@/shared/lib/format";
import { Skeleton } from "@/shared/ui/skeleton";
import { useMilestoneDetail } from "../hooks/use-turmas";
import { MILESTONE_STATUS } from "../lib/milestones";

// "Quem entregou": uma linha por grupo (ou aluno), só para o professor.
export function MilestoneRowsDialog({ turmaId, milestoneId, onClose }: { turmaId: string; milestoneId: string | null; onClose: () => void }) {
  const { data, isPending } = useMilestoneDetail(turmaId, milestoneId);

  return (
    <HudDialog
      open={milestoneId !== null}
      onOpenChange={(open) => !open && onClose()}
      title={data?.title ?? "Entrega"}
      description={data ? `Prazo ${formatDayMonth(data.due_at)}. Quem cumpriu, e com que projeto.` : undefined}
      className="w-[min(92vw,560px)]"
    >
      {isPending || !data ? (
        <Skeleton className="h-32 w-full" aria-busy="true" />
      ) : data.rows.length === 0 ? (
        <p className="text-text-3 text-sm">Ninguém para acompanhar ainda: sem grupos ou sem alunos.</p>
      ) : (
        <ul className="flex max-h-[60dvh] flex-col overflow-y-auto">
          {data.rows.map((row) => {
            const status = MILESTONE_STATUS[row.status];
            return (
              <li key={row.unit.id} className="border-border flex items-center gap-3 border-b py-2.5 last:border-b-0">
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm font-semibold">{row.unit.type === "student" ? `@${row.unit.name}` : row.unit.name}</span>
                  <span className="text-text-3 truncate text-xs">
                    {row.project ? (
                      <Link to={`/galeria/${row.project.slug}`} className="hover:text-foreground transition-colors">
                        {row.project.name}
                      </Link>
                    ) : (
                      "sem projeto enviado"
                    )}
                    {row.completed_at && ` · ${formatDayMonth(row.completed_at)}`}
                  </span>
                </span>
                <StatusChip tone={status.tone}>{status.label}</StatusChip>
              </li>
            );
          })}
        </ul>
      )}
    </HudDialog>
  );
}
