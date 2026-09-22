import { Panel } from "@/shared/components/panel";
import { formatNumber } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";
import { useTurmaProgress } from "../hooks/use-turmas";

// A turma inteira contra a própria meta: quantos já estão no ar, quantos na
// galeria, quantos cumpriram cada entrega. Nenhum número por pessoa — é
// objetivo compartilhado, não ranking. Some enquanto o back não responde.
export function TurmaProgressPanel({ turmaId }: { turmaId: string }) {
  const { data, isPending, isError } = useTurmaProgress(turmaId);

  if (isError) return null;
  if (isPending) return <Skeleton className="h-40 w-full" aria-busy="true" />;

  const rows = [
    { key: "deploy", label: "No ar", value: data.with_deploy, total: data.students },
    { key: "gallery", label: "Na galeria", value: data.published, total: data.students },
    ...data.milestones.map((m) => ({ key: m.id, label: m.title, value: m.completed, total: m.total })),
  ];

  return (
    <Panel title="Progresso da turma">
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-display font-bold tabular-nums">{data.with_deploy}</span>
          <span className="text-muted-foreground text-sm">
            de {data.students} {data.students === 1 ? "aluno" : "alunos"} com site no ar
          </span>
        </div>
        <ul className="flex flex-col gap-2.5">
          {rows.map((row) => {
            const pct = row.total > 0 ? Math.min(100, Math.round((row.value / row.total) * 100)) : 0;
            return (
              <li key={row.key} className="flex flex-col gap-1">
                <span className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-muted-foreground truncate">{row.label}</span>
                  <span className="text-text-3 shrink-0 font-mono tabular-nums">
                    {row.value}/{row.total}
                  </span>
                </span>
                <span className="bg-raised h-1.5 w-full overflow-hidden">
                  <span className={cn("block h-full transition-[width] duration-(--dur-slow)", pct === 100 ? "bg-good" : "bg-primary")} style={{ width: `${pct}%` }} />
                </span>
              </li>
            );
          })}
        </ul>
        <p className="text-text-3 text-xs">{formatNumber(data.xp_week)} XP ganhos pela turma nos últimos sete dias.</p>
      </div>
    </Panel>
  );
}
