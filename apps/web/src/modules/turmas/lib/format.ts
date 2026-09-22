// "12 alunos de 40" / "1 aluno" / "nenhum aluno ainda".
export function formatStudents(count: number, capacity: number | null): string {
  const base = count === 0 ? "nenhum aluno ainda" : count === 1 ? "1 aluno" : `${count} alunos`;
  return capacity && count > 0 ? `${base} de ${capacity}` : base;
}

// Nota no formato da escola: 8,5 / 10.
export const formatGrade = (grade: number) => grade.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
