import { Check, Lock } from "lucide-react";
import { Panel } from "@/shared/components/panel";
import { LevelInsignia } from "@/shared/components/level-insignia";
import { cn } from "@/shared/lib/utils";
import { FRAMES } from "../lib/catalog";
import type { FrameId } from "../types";

type FramePickerProps = {
  level: number;
  current: FrameId;
  pending: boolean;
  onSelect: (frame: FrameId) => void;
};

// As molduras da insígnia: as liberadas são escolhíveis, as outras mostram o
// nível que falta. Só aparece quando a API devolve `frame` no usuário.
export function FramePicker({ level, current, pending, onSelect }: FramePickerProps) {
  return (
    <Panel title="Moldura da insígnia">
      <ul className="grid grid-cols-5 gap-3 p-5">
        {FRAMES.map((frame) => {
          const unlocked = level >= frame.minLevel;
          const selected = current === frame.id;
          return (
            <li key={frame.id}>
              <button
                type="button"
                disabled={!unlocked || pending}
                aria-pressed={selected}
                onClick={() => onSelect(frame.id)}
                title={unlocked ? frame.label : `Libera no nível ${frame.minLevel}`}
                className={cn(
                  "focus-ring flex w-full flex-col items-center gap-2 py-2 transition-colors",
                  unlocked ? "hover:bg-raised/70" : "cursor-not-allowed opacity-50",
                  selected && "bg-primary/8",
                )}
              >
                <span className="relative">
                  <LevelInsignia level={level} size="md" color={unlocked ? frame.color : "var(--line-2)"} />
                  {selected && (
                    <span className="bg-primary text-primary-foreground absolute -top-1 -right-1 grid size-4 place-items-center rounded-full">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  )}
                </span>
                <span className="text-caption font-medium">{frame.label}</span>
                {!unlocked && (
                  <span className="label text-text-3 text-micro flex items-center gap-1">
                    <Lock className="size-3" aria-hidden="true" />
                    nível {frame.minLevel}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
