import { Panel } from "@/shared/components/panel";
import { formatDayMonthYear } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { ACHIEVEMENTS, TIER_COLOR } from "../lib/catalog";
import type { Achievement, AchievementCode } from "../types";

// As conquistas como insígnias hexagonais: acesa na cor do metal quando
// desbloqueada, tracejada quando não. Marco pessoal, não ranking.
// `showLocked`: no próprio perfil aparecem todas; no público, só as ganhas.
export function AchievementGrid({ achievements, showLocked }: { achievements: Achievement[]; showLocked: boolean }) {
  const byCode = new Map(achievements.map((a) => [a.code, a]));
  const codes = (Object.keys(ACHIEVEMENTS) as AchievementCode[]).filter((code) =>
    showLocked ? true : byCode.get(code)?.unlocked_at,
  );
  const unlocked = achievements.filter((a) => a.unlocked_at).length;

  if (codes.length === 0) return null;

  return (
    <Panel title="Conquistas" count={unlocked}>
      <ul className="grid grid-cols-3 gap-4 p-5 sm:grid-cols-4 lg:grid-cols-5">
        {codes.map((code) => {
          const meta = ACHIEVEMENTS[code];
          const state = byCode.get(code);
          const on = !!state?.unlocked_at;
          const Icon = meta.icon;
          const color = TIER_COLOR[meta.tier];
          const pct = state?.progress ? Math.round((state.progress.current / state.progress.target) * 100) : null;
          return (
            <li
              key={code}
              className="flex flex-col items-center gap-2 text-center"
              title={on && state?.unlocked_at ? `${meta.description} Em ${formatDayMonthYear(state.unlocked_at)}.` : meta.description}
            >
              <span className="relative grid size-14 place-items-center" aria-hidden="true">
                <span
                  className={cn("hex absolute inset-0", !on && "opacity-40")}
                  style={{ background: on ? color : "var(--line-2)" }}
                />
                <span className="hex bg-card absolute inset-[2px]" />
                <Icon className={cn("relative size-5", !on && "text-text-3")} style={on ? { color } : undefined} />
              </span>
              <span className={cn("text-caption leading-tight font-semibold", !on && "text-text-3")}>{meta.title}</span>
              {!on && pct !== null && state?.progress && (
                <span className="flex w-full flex-col items-center gap-1">
                  <span className="xp-track h-1 w-full">
                    <span className="xp-fill block h-full" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="text-text-3 font-mono text-micro tabular-nums">
                    {state.progress.current}/{state.progress.target}
                  </span>
                </span>
              )}
              {on && <span className="label text-micro" style={{ color }}>{meta.tier === "gold" ? "Ouro" : meta.tier === "silver" ? "Prata" : "Bronze"}</span>}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
