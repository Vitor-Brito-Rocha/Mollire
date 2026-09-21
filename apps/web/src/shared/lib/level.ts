// Título por faixa de nível: identidade em vez de número. Só no cliente — a
// API devolve level/xp/next e nunca precisou saber disso.
const TITLES: [minLevel: number, title: string][] = [
  [15, "Lenda"],
  [10, "Veterano"],
  [7, "Arquiteto"],
  [4, "Construtor"],
  [2, "Aprendiz"],
  [1, "Recruta"],
];

export function levelTitle(level: number): string {
  return TITLES.find(([min]) => level >= min)?.[1] ?? "Recruta";
}

export const padLevel = (level: number) => String(level).padStart(2, "0");
