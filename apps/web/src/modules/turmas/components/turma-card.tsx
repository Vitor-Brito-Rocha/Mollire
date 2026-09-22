import { Globe, Lock, Users } from "lucide-react";
import { Link } from "react-router";
import { StatusChip } from "@/shared/components/status-chip";
import { useSpotlight } from "@/shared/hooks/use-spotlight";
import { formatMonthYear } from "@/shared/lib/format";
import { formatStudents } from "../lib/format";
import type { TurmaSummary } from "../types";

// Uma turma sua, na lista: nome, seu papel, quantos alunos, pública ou não.
export function TurmaCard({ turma }: { turma: TurmaSummary }) {
  const onPointerMove = useSpotlight();
  const professor = turma.my_role === "PROFESSOR";

  return (
    <Link
      to={`/turmas/${turma.id}`}
      onPointerMove={onPointerMove}
      // `min-w-0`: sem isso o nome (sem quebra) empurra a coluna da grade além da tela no celular.
      className="group surface hover:border-line-2 focus-ring relative flex min-w-0 flex-col gap-3 p-5 transition-[border-color,transform] duration-(--dur) hover:-translate-y-0.5"
    >
      <span className="spot-glow" aria-hidden="true" />
      <span className="flex items-start justify-between gap-3">
        <span className="font-display group-hover:text-primary min-w-0 truncate text-heading font-bold transition-colors">
          {turma.name}
        </span>
        <StatusChip tone={professor ? "accent" : "idle"} className="shrink-0">
          {professor ? "Professor" : "Aluno"}
        </StatusChip>
      </span>
      <span className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-caption">
        <span className="flex items-center gap-1.5">
          <Users className="size-3.5" aria-hidden="true" />
          {formatStudents(turma.students_count, turma.capacity)}
        </span>
        <span className="flex items-center gap-1.5">
          {turma.is_public ? <Globe className="size-3.5" aria-hidden="true" /> : <Lock className="size-3.5" aria-hidden="true" />}
          {turma.is_public ? "Pública" : "Privada"}
        </span>
        <span className="text-text-3">desde {formatMonthYear(turma.created_at)}</span>
      </span>
    </Link>
  );
}
