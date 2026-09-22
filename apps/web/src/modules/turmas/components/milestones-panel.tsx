import { AlertTriangle, Check, Clock, Plus } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { InlineAction } from "@/shared/components/inline-action";
import { Panel } from "@/shared/components/panel";
import { StatusChip } from "@/shared/components/status-chip";
import { formatDayMonth } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { useRemoveMilestone } from "../hooks/use-turma-mutations";
import { useTurmaMilestones } from "../hooks/use-turmas";
import { MILESTONE_STATUS, isPastDue, requirementLabels } from "../lib/milestones";
import type { MilestoneStatus, TurmaDetail, TurmaMilestone } from "../types";
import { MilestoneDialog } from "./milestone-dialog";
import { MilestoneRowsDialog } from "./milestone-rows-dialog";

// A marca à esquerda de cada entrega: cumprida, em aberto ou perdida.
function StatusMark({ status }: { status: MilestoneStatus | "open" | "closed" }) {
  const cls = {
    done: "bg-good/15 text-good",
    late: "bg-primary/15 text-primary",
    pending: "bg-raised text-muted-foreground",
    missed: "bg-destructive/15 text-destructive",
    open: "bg-raised text-muted-foreground",
    closed: "bg-raised text-text-3",
  }[status];
  const Icon = status === "done" || status === "late" ? Check : status === "missed" ? AlertTriangle : Clock;
  return (
    <span className={cn("hex grid size-8 shrink-0 place-items-center", cls)} aria-hidden="true">
      <Icon className="size-3.5" strokeWidth={2.5} />
    </span>
  );
}

// As entregas da turma: o professor cria e acompanha quantos cumpriram; o
// aluno vê o estado da unidade dele. Some enquanto o back não responde.
export function MilestonesPanel({ turma }: { turma: TurmaDetail }) {
  const professor = turma.my_role === "PROFESSOR";
  const { data: milestones, isPending, isError } = useTurmaMilestones(turma.id);
  const remove = useRemoveMilestone(turma.id);
  const [editing, setEditing] = useState<TurmaMilestone | "new" | null>(null);
  const [rowsFor, setRowsFor] = useState<string | null>(null);
  const [removing, setRemoving] = useState<TurmaMilestone | null>(null);

  if (isError) return null;
  if (isPending) return <Skeleton className="h-28 w-full" aria-busy="true" />;

  const noUnit = !professor && turma.group_mode === "GROUPS" && !turma.my_group_id;

  return (
    <Panel
      title="Entregas"
      count={milestones.length}
      aside={
        professor ? (
          <Button size="sm" variant="outline" onClick={() => setEditing("new")}>
            <Plus className="size-3.5" strokeWidth={2.5} />
            Nova entrega
          </Button>
        ) : undefined
      }
    >
      {milestones.length === 0 ? (
        <p className="text-text-3 px-4 py-5 text-sm">
          {professor
            ? "Nenhuma entrega ainda. Crie a primeira: um título, um prazo e o que o projeto precisa ter."
            : "O professor ainda não criou entregas."}
        </p>
      ) : (
        <ul className="flex flex-col">
          {noUnit && (
            <li className="border-border text-text-3 border-b px-4 py-2.5 text-xs">
              Entre num grupo para acompanhar as entregas do seu.
            </li>
          )}
          {milestones.map((milestone) => {
            const status = milestone.mine?.status ?? (isPastDue(milestone.due_at) ? "closed" : "open");
            const chip = milestone.mine ? MILESTONE_STATUS[milestone.mine.status] : null;
            const stats = milestone.stats;
            const pct = stats && stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
            return (
              <li key={milestone.id} className="border-border flex flex-wrap items-start gap-3 border-b px-4 py-3 last:border-b-0">
                <StatusMark status={status} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="truncate text-sm font-semibold">{milestone.title}</span>
                    {chip && <StatusChip tone={chip.tone}>{chip.label}</StatusChip>}
                  </span>
                  <span className="text-text-3 text-xs">
                    até {formatDayMonth(milestone.due_at)} · {requirementLabels(milestone.requirements).join(" · ")}
                  </span>
                  {milestone.description && <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">{milestone.description}</p>}
                  {milestone.mine?.project && milestone.mine.status !== "pending" && (
                    <span className="text-text-3 text-xs">com {milestone.mine.project.name}</span>
                  )}
                </div>
                {/* No celular a barra e as ações descem para a linha de baixo, alinhadas ao texto. */}
                {professor && stats && (
                  <div className="flex w-full items-center justify-between gap-3 pl-11 sm:w-auto sm:flex-col sm:items-end sm:gap-1.5 sm:pl-0">
                    <span className="flex items-center gap-2">
                      <span className="bg-raised h-1 w-16 overflow-hidden">
                        <span className={cn("block h-full", pct === 100 ? "bg-good" : "bg-primary")} style={{ width: `${pct}%` }} />
                      </span>
                      <span className="text-text-3 font-mono text-xs tabular-nums">
                        {stats.completed}/{stats.total}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <InlineAction onClick={() => setRowsFor(milestone.id)}>quem entregou</InlineAction>
                      <InlineAction onClick={() => setEditing(milestone)}>editar</InlineAction>
                      <InlineAction destructive onClick={() => setRemoving(milestone)} disabled={remove.isPending}>
                        remover
                      </InlineAction>
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {professor && (
        <>
          <MilestoneDialog turmaId={turma.id} target={editing} onClose={() => setEditing(null)} />
          <MilestoneRowsDialog turmaId={turma.id} milestoneId={rowsFor} onClose={() => setRowsFor(null)} />
          <ConfirmDialog
            open={removing !== null}
            title={removing ? `Remover a entrega ${removing.title}?` : ""}
            description="Ela some para todo mundo. O XP que os grupos já ganharam com ela fica."
            confirmLabel="Remover"
            pending={remove.isPending}
            onCancel={() => setRemoving(null)}
            onConfirm={() => removing && remove.mutate(removing.id, { onSettled: () => setRemoving(null) })}
          />
        </>
      )}
    </Panel>
  );
}
