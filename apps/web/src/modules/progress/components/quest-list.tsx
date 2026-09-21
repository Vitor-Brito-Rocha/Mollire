import { Check } from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/shared/lib/utils";
import { QUESTS } from "../lib/catalog";
import type { QuestsResponse } from "../types";

// As missões de estreia: o onboarding vestido de quest. Cada uma leva ao
// lugar onde se cumpre e vale XP; concluída, fica marcada e apagada.
export function QuestList({ data }: { data: QuestsResponse }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <h3 className="label text-text-3 text-mini">Missões de estreia</h3>
        <span className="text-text-3 font-mono text-xs tabular-nums">
          {data.completed}/{data.total}
        </span>
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        {data.quests.map((quest) => {
          const meta = QUESTS[quest.code];
          const done = quest.completed_at !== null;
          const Icon = done ? Check : meta.icon;
          const inner = (
            <>
              <span
                className={cn(
                  "grid size-5 shrink-0 place-items-center",
                  done ? "bg-primary text-primary-foreground hex" : "border-line-2 text-text-3 rounded-full border border-dashed",
                )}
              >
                <Icon className="size-3" strokeWidth={2.5} />
              </span>
              <span className={cn("min-w-0 flex-1 truncate text-caption", done ? "text-text-3 line-through decoration-border" : "font-medium")}>
                {meta.title}
              </span>
              <span className={cn("font-mono text-xs tabular-nums", done ? "text-text-3" : "text-primary font-semibold")}>+{quest.xp}</span>
            </>
          );
          return (
            <li key={quest.code} title={meta.hint}>
              {done ? (
                <div className="flex h-6 items-center gap-2">{inner}</div>
              ) : (
                <Link to={meta.href} className="hover:bg-raised/70 focus-ring -mx-1 flex h-6 items-center gap-2 px-1 transition-colors">
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
