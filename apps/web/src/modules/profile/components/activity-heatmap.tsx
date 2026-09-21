import { useMemo } from "react";
import { contributionsLabel, buildHeatmapGrid, heatmapColor } from "../lib/heatmap";
import type { UserProfile } from "../types";
import { Eyebrow } from "@/shared/components/eyebrow";

export function ActivityHeatmap({ data }: { data: UserProfile["heatmap"] }) {
  // ~370 cells of date math: only redo it when the data changes.
  const weeks = useMemo(() => buildHeatmapGrid(data), [data]);
  const total = useMemo(() => data.reduce((sum, h) => sum + h.count, 0), [data]);

  return (
    <div className="flex flex-col gap-3">
      <Eyebrow as="h2" tone="section">
        Atividade
        <span className="text-text-3 font-mono text-xs tracking-normal normal-case">
          {contributionsLabel(total)} no último ano
        </span>
      </Eyebrow>
      <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
        <div className="flex gap-[3px]" style={{ width: "max-content" }}>
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[3px]">
              {week.map((cell, dayIndex) =>
                cell.date === null ? (
                  <div key={dayIndex} className="size-[11px]" />
                ) : (
                  <div
                    key={dayIndex}
                    className="size-[11px] rounded-[2px]"
                    style={{ background: heatmapColor(cell.count) }}
                    title={cell.count === 0 ? cell.date : `${contributionsLabel(cell.count)} em ${cell.date}`}
                  />
                ),
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
