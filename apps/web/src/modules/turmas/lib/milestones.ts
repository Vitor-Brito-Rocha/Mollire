import type { ChipTone } from "@/shared/components/status-chip";
import type { MilestoneRequirements, MilestoneStatus } from "../types";

// O estado de uma entrega para a unidade (grupo ou aluno). Verde bom, acento
// para "cumpriu, mas depois do prazo", vermelho para prazo perdido.
export const MILESTONE_STATUS: Record<MilestoneStatus, { label: string; tone: ChipTone }> = {
  done: { label: "Entregue", tone: "good" },
  late: { label: "Entregue atrasada", tone: "accent" },
  pending: { label: "Em aberto", tone: "idle" },
  missed: { label: "Não entregue", tone: "bad" },
};

// "no ar · na galeria · 3 estrelas": o que a entrega exige do projeto.
export function requirementLabels(r: MilestoneRequirements): string[] {
  const out: string[] = [];
  if (r.deployed) out.push("no ar");
  if (r.published) out.push("na galeria");
  if (r.min_stars) out.push(`${r.min_stars} ${r.min_stars === 1 ? "estrela" : "estrelas"}`);
  return out.length > 0 ? out : ["projeto enviado"];
}

const pad = (n: number) => String(n).padStart(2, "0");

// O prazo é um dia inteiro: o campo de data vira o fim daquele dia, no fuso
// de quem está criando, e a API guarda em UTC.
export const dueAtFromDate = (date: string) => new Date(`${date}T23:59:59`).toISOString();

// A volta: o instante da API no formato do <input type="date">.
export function dateFromDueAt(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const isPastDue = (iso: string) => new Date(iso).getTime() < Date.now();
