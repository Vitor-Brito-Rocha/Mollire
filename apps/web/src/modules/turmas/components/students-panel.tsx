import { Link } from "react-router";
import { Panel } from "@/shared/components/panel";
import { StatusChip } from "@/shared/components/status-chip";
import { formatDayMonth } from "@/shared/lib/format";
import { Skeleton } from "@/shared/ui/skeleton";
import { useTurmaStudents } from "../hooks/use-turmas";

// A lista de alunos, só para o professor: quem entrou, em que grupo, quando.
export function StudentsPanel({ turmaId }: { turmaId: string }) {
  const { data: students, isPending, isError } = useTurmaStudents(turmaId, true);

  if (isPending) return <Skeleton className="h-40 w-full" />;
  if (isError) {
    return (
      <Panel title="Alunos">
        <p className="text-text-3 px-4 py-6 text-center text-sm">Não foi possível carregar.</p>
      </Panel>
    );
  }

  return (
    <Panel title="Alunos" count={students.length}>
      {students.length === 0 ? (
        <p className="text-text-3 px-4 py-5 text-sm">Ninguém entrou ainda. Compartilhe o código da turma.</p>
      ) : (
        <ul className="flex flex-col">
          {students.map((student) => (
            <li key={student.user_id} className="border-border flex items-center gap-3 border-b px-4 py-2.5 last:border-b-0">
              <span className="hex bg-raised font-display text-muted-foreground grid size-7 shrink-0 place-items-center text-mini font-bold uppercase">
                {student.handle.charAt(0)}
              </span>
              <Link to={`/u/${student.handle}`} className="hover:text-primary min-w-0 flex-1 truncate text-sm transition-colors">
                {student.handle}
              </Link>
              {student.group ? (
                <StatusChip tone="idle">{student.group.name}</StatusChip>
              ) : (
                <span className="text-text-3 text-xs">sem grupo</span>
              )}
              <span className="text-text-3 shrink-0 text-xs">{formatDayMonth(student.joined_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
