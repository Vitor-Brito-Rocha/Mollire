import { Users } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { useJoinPublic } from "../hooks/use-turma-mutations";
import { formatStudents } from "../lib/format";
import type { PublicTurma } from "../types";

// Uma turma pública, para entrar sem código.
export function PublicTurmaCard({ turma }: { turma: PublicTurma }) {
  const join = useJoinPublic();
  const full = turma.capacity !== null && turma.students_count >= turma.capacity;

  return (
    <article className="surface flex min-w-0 flex-col gap-3 p-5">
      <div className="flex flex-col gap-1">
        <h3 className="font-display truncate text-heading font-bold">{turma.name}</h3>
        <span className="text-muted-foreground text-caption">
          por{" "}
          <Link to={`/u/${turma.owner}`} className="hover:text-foreground transition-colors">
            {turma.owner}
          </Link>
        </span>
      </div>
      {turma.description && <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">{turma.description}</p>}
      <div className="mt-auto flex items-center justify-between gap-3 pt-1">
        <span className="text-text-3 flex items-center gap-1.5 text-caption">
          <Users className="size-3.5" aria-hidden="true" />
          {formatStudents(turma.students_count, turma.capacity)}
        </span>
        {turma.is_member ? (
          <Button variant="outline" size="sm" nativeButton={false} render={<Link to={`/turmas/${turma.id}`}>Abrir</Link>} />
        ) : (
          <Button size="sm" disabled={full || join.isPending} aria-busy={join.isPending} onClick={() => join.mutate(turma.id)}>
            {join.isPending && join.variables === turma.id && <Spinner />}
            {full ? "Cheia" : "Entrar"}
          </Button>
        )}
      </div>
    </article>
  );
}
