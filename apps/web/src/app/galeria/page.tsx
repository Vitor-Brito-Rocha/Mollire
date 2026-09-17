"use client";

import Link from "next/link";
import { useState } from "react";
import { HudHeader } from "@/components/hud-header";
import { LevelBar } from "@/components/level-bar";
import { Button } from "@/components/ui/button";

// Dados fictícios — a galeria ainda não tem backend. Servem para sentir a
// mecânica da estrela e o visual antes de existir tabela.
type GalleryProject = {
  id: string;
  name: string;
  slug: string;
  author: string;
  others: number; // estrelas de outras pessoas; a sua entra pelo estado
  look: keyof typeof LOOKS;
};

// Miniaturas simuladas: a cara de um site moderno qualquer, que é o que vai
// aparecer aqui quando existir captura no deploy.
const LOOKS = {
  sky: { bg: "linear-gradient(160deg,#3b82f6,#7dd3fc)", fg: "#ffffff", btn: "#ffffff" },
  dark: { bg: "linear-gradient(170deg,#0f172a,#1e293b)", fg: "#e2e8f0", btn: "#6366f1" },
  light: { bg: "#ffffff", fg: "#0f172a", btn: "#10b981" },
  warm: { bg: "linear-gradient(165deg,#fff7ed,#fed7aa)", fg: "#7c2d12", btn: "#ea580c" },
} as const;

const MOCK: GalleryProject[] = [
  { id: "1", name: "Clima Agora", slug: "clima-agora", author: "helena.r", others: 231, look: "sky" },
  { id: "2", name: "Portfólio da Marina", slug: "marina-dev", author: "marina.s", others: 126, look: "dark" },
  { id: "3", name: "Jogo da Cobrinha", slug: "cobrinha", author: "dudu", others: 89, look: "dark" },
  { id: "4", name: "Gerador de Senha", slug: "senha-forte", author: "kauan.t", others: 61, look: "light" },
  { id: "5", name: "Receitas da Vó", slug: "receitas-da-vo", author: "bia.m", others: 43, look: "warm" },
  { id: "6", name: "Agenda da Turma 3B", slug: "turma-3b", author: "prof.aline", others: 12, look: "light" },
  { id: "7", name: "Visualizador de Grafos", slug: "grafos-tcc", author: "renan.p", others: 8, look: "dark" },
  { id: "8", name: "Loja do Seu Zé", slug: "seu-ze", author: "jose.c", others: 5, look: "warm" },
];

// Marcos por limiar, como medalhas: você alcança, não disputa. Abaixo de 10
// não há selo — marcar o projeto de um iniciante como "comum" desanima.
const TIERS = [
  { at: 100, label: "Ouro", color: "var(--gold)" },
  { at: 50, label: "Prata", color: "var(--silver)" },
  { at: 10, label: "Bronze", color: "var(--bronze)" },
] as const;

function tierFor(stars: number) {
  return TIERS.find((t) => stars >= t.at) ?? null;
}

const FILTERS = ["Recentes", "Em destaque", "Todos"] as const;

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-[15px] shrink-0"
      style={{ fill: filled ? "currentColor" : "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinejoin: "round" }}
    >
      <path d="M12 2.8l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.6 6.1 20.9l1.3-6.6L2.5 9.7l6.6-.8z" />
    </svg>
  );
}

function Thumb({ look }: { look: keyof typeof LOOKS }) {
  const l = LOOKS[look];
  return (
    <div className="flex h-full flex-col" style={{ background: l.bg, color: l.fg }}>
      <div className="flex items-center gap-1.5 px-3 py-2">
        <span className="h-[7px] w-5 rounded-[3px] bg-current opacity-85" />
        <span className="h-[5px] w-[13px] rounded-sm bg-current opacity-35" />
        <span className="h-[5px] w-[13px] rounded-sm bg-current opacity-35" />
        <span className="h-[5px] w-[13px] rounded-sm bg-current opacity-35" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-3 py-1.5">
        <span className="h-[11px] w-3/4 rounded-[3px] bg-current opacity-80" />
        <span className="h-[11px] w-1/2 rounded-[3px] bg-current opacity-80" />
        <span className="h-[5px] w-[88%] rounded-sm bg-current opacity-30" />
        <span className="mt-1 h-3.5 w-[54px] rounded-[7px]" style={{ background: l.btn }} />
      </div>
      <div className="flex gap-1.5 px-3 pb-3">
        <span className="h-7 flex-1 rounded-[5px] bg-current opacity-16" />
        <span className="h-7 flex-1 rounded-[5px] bg-current opacity-16" />
        <span className="h-7 flex-1 rounded-[5px] bg-current opacity-16" />
      </div>
    </div>
  );
}

export default function GaleriaPage() {
  const [starred, setStarred] = useState<Record<string, boolean>>({ "marina-dev": true });
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Recentes");

  function toggle(slug: string) {
    setStarred((prev) => ({ ...prev, [slug]: !prev[slug] }));
  }

  return (
    <div className="flex min-h-screen flex-col">
      <HudHeader>
        {/* Nível fictício, como o resto desta página — a API ainda não expõe XP. */}
        <LevelBar level={7} xp={2340} next={3000} className="hidden sm:flex" />
        <span className="hex bg-raised font-display grid size-[34px] place-items-center text-xs font-bold">M</span>
      </HudHeader>

      <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-7 px-5 py-10 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-2.5">
            <span className="label text-primary flex items-center gap-2.5 tracking-[0.14em]">
              <span className="bg-primary h-0.5 w-[18px]" />
              Comunidade
            </span>
            <h1 className="font-display text-[38px] leading-[1.1] font-bold">Galeria</h1>
            <p className="text-muted-foreground max-w-[56ch] text-[15.5px]">
              O que a comunidade publicou. Dê uma estrela no que você gostou — é um gesto de
              apreço, não uma nota.
            </p>
          </div>

          <div className="bg-card border-border inline-flex gap-0.5 border p-[3px]" role="group" aria-label="Filtro">
            {FILTERS.map((f) => {
              const on = filter === f;
              return (
                <button
                  key={f}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setFilter(f)}
                  className={
                    "label min-h-[38px] px-3.5 transition-colors " +
                    (on ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")
                  }
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK.map((project) => {
            const on = !!starred[project.slug];
            const stars = project.others + (on ? 1 : 0);
            const tier = tierFor(stars);

            return (
              <article
                key={project.id}
                className="corners bg-card border-border flex flex-col border"
                style={{ "--corner": tier ? tier.color : "var(--line-2)" } as React.CSSProperties}
              >
                <Link
                  href="#"
                  aria-label={`Abrir ${project.name}`}
                  className="border-border mx-1.5 mt-1.5 block h-[150px] overflow-hidden border"
                >
                  <Thumb look={project.look} />
                </Link>

                <div className="flex flex-col gap-3 px-4 pt-3.5 pb-4">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <Link href="#" className="truncate text-base leading-tight font-semibold">
                        {project.name}
                      </Link>
                      <span className="text-muted-foreground text-[12.5px]">
                        {project.author} ·{" "}
                        <span className="text-text-3 font-mono text-[11.5px]">
                          {project.slug}.aulvi.com.br
                        </span>
                      </span>
                    </div>
                    {tier && (
                      <span
                        className="tag-cut bg-raised label shrink-0 py-[5px] pr-2 pl-[11px] text-[10px] font-bold"
                        style={{ color: tier.color, boxShadow: `inset 3px 0 0 ${tier.color}` }}
                      >
                        {tier.label}
                      </span>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => toggle(project.slug)}
                    aria-pressed={on}
                    aria-label={on ? `Remover estrela de ${project.name}` : `Dar estrela para ${project.name}`}
                    className={
                      "font-display min-h-11 w-fit gap-2 px-3.5 text-xs font-semibold tracking-[0.08em] " +
                      (on
                        ? "border-gold text-gold bg-gold/12 shadow-[0_0_14px_rgba(242,193,78,0.35)] hover:bg-gold/16 hover:text-gold"
                        : "bg-raised border-line-2 text-muted-foreground hover:border-gold hover:text-foreground")
                    }
                  >
                    <StarIcon filled={on} />
                    <span className="font-mono text-[13px] font-medium tabular-nums">{stars}</span>
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
