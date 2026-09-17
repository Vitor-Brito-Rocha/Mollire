// Marcos por limiar, como medalhas: você alcança, não disputa. Abaixo de 10
// não há selo — marcar o projeto de um iniciante como "comum" desanima.
export const TIERS = [
  { at: 100, label: "Ouro", color: "var(--gold)" },
  { at: 50, label: "Prata", color: "var(--silver)" },
  { at: 10, label: "Bronze", color: "var(--bronze)" },
] as const;

export type Tier = (typeof TIERS)[number];

export function tierFor(stars: number): Tier | null {
  return TIERS.find((t) => stars >= t.at) ?? null;
}
