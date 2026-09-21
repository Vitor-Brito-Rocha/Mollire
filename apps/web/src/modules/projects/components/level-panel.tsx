import type { CurrentUser } from "@/modules/auth";
import { useCountUp } from "@/shared/hooks/use-count-up";
import { formatNumber } from "@/shared/lib/format";
import { levelTitle } from "@/shared/lib/level";
import type { Project } from "../types";
import { LevelInsignia } from "@/shared/components/level-insignia";

// O painel de nível: insígnia hexagonal, título da faixa, a barra grande de
// XP e três números que só vêm do que a API já devolve.
export function LevelPanel({ user, projects }: { user: CurrentUser; projects: Project[] }) {
  const pct = Math.min(100, Math.round((user.xp / user.next) * 100));
  const remaining = Math.max(0, user.next - user.xp);
  const shownXp = useCountUp(user.xp);
  const publicCount = projects.filter((p) => p.is_public).length;
  const memberOf = projects.filter((p) => p.my_role === "MEMBER").length;

  return (
    <section className="surface relative flex flex-col gap-6 p-5 md:p-6" aria-label="Seu nível">
      <div className="flex items-center gap-4">
        <LevelInsignia level={user.level} size="lg" />
        <div className="flex min-w-0 flex-col gap-1">
          <span className="label text-text-3">Seu nível</span>
          <span className="font-display text-heading leading-tight font-bold">{levelTitle(user.level)}</span>
          <span className="text-muted-foreground text-caption">
            Faltam <b className="text-foreground">{formatNumber(remaining)} XP</b> para o nível {user.level + 1}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div
          className="xp-track h-2.5"
          role="progressbar"
          aria-label={`Nível ${user.level}`}
          aria-valuemin={0}
          aria-valuemax={user.next}
          aria-valuenow={user.xp}
        >
          <div className="xp-fill h-full transition-[width] duration-(--dur-slow) ease-out" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-baseline justify-between font-mono tabular-nums">
          <span className="text-foreground text-sm font-medium">{formatNumber(shownXp)} XP</span>
          <span className="text-text-3 text-mini">{formatNumber(user.next)}</span>
        </div>
      </div>

      <dl className="border-border grid grid-cols-3 gap-3 border-t pt-5">
        {[
          ["Projetos", projects.length],
          ["Na galeria", publicCount],
          ["Como membro", memberOf],
        ].map(([name, value]) => (
          <div key={name} className="flex flex-col gap-1">
            <dt className="label text-text-3 text-micro">{name}</dt>
            <dd className="font-display text-title leading-none font-bold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
