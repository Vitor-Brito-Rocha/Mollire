import type { CurrentUser } from "@/modules/auth";
import { Panel } from "@/shared/components/panel";
import { formatNumber } from "@/shared/lib/format";
import { levelTitle } from "@/shared/lib/level";
import { XP_RULES } from "../lib/xp-rules";
import type { Project } from "../types";

// O que a barra lateral não mostra: quanto falta, o que você já tem e como
// se ganha XP. Nível e barra ficam no cartão do jogador; aqui não se repete.
// Compacto de propósito: a tela inicial não rola por causa dele.
export function ProgressPanel({ user, projects }: { user: CurrentUser; projects: Project[] }) {
  const remaining = Math.max(0, user.next - user.xp);
  const publicCount = projects.filter((p) => p.is_public).length;
  const memberOf = projects.filter((p) => p.my_role === "MEMBER").length;

  return (
    <Panel title="Progresso" aside={<span className="text-text-3 font-mono text-xs">{levelTitle(user.level)}</span>}>
      <div className="flex flex-col gap-4 p-4">
        <p className="text-muted-foreground text-sm">
          Faltam <b className="text-foreground font-mono">{formatNumber(remaining)} XP</b> para o nível {user.level + 1}.
        </p>

        <dl className="grid grid-cols-3 gap-3">
          {[
            ["Projetos", projects.length],
            ["Na galeria", publicCount],
            ["Como membro", memberOf],
          ].map(([name, value]) => (
            <div key={name} className="flex flex-col gap-1">
              <dt className="label text-text-3 text-mini">{name}</dt>
              <dd className="font-display text-title leading-none font-bold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="border-border flex flex-col gap-2 border-t pt-3">
          <h3 className="label text-text-3 text-mini">Como ganhar XP</h3>
          <ul className="grid grid-cols-4 gap-2">
            {XP_RULES.map((rule) => (
              <li
                key={rule.label}
                title={rule.note}
                className="bg-raised/60 flex min-w-0 flex-col gap-0.5 px-2 py-1.5"
              >
                <span className="label text-text-3 text-micro truncate">{rule.label}</span>
                <span className="text-primary font-mono text-body-lg font-semibold tabular-nums">+{rule.xp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Panel>
  );
}
