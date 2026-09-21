import type { UserProfile } from "../types";

export type HeatmapCell = { date: string | null; count: number };

// A 7-row (days of the week) × N-column (weeks) grid for the last 365 days,
// weeks starting on Monday. Days after today are empty placeholders.
export function buildHeatmapGrid(heatmap: UserProfile["heatmap"]): HeatmapCell[][] {
  const counts = new Map(heatmap.map((h) => [h.date, h.count]));

  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 364);

  // Pad start back to Monday (0=Sun → go back 6; 1=Mon → 0; ...; 6=Sat → 5)
  const dow = start.getDay();
  start.setDate(start.getDate() - (dow === 0 ? 6 : dow - 1));

  const weeks: HeatmapCell[][] = [];
  const cursor = new Date(start);

  while (cursor <= today) {
    const week: HeatmapCell[] = [];
    for (let d = 0; d < 7; d++) {
      if (cursor <= today) {
        const date = cursor.toISOString().slice(0, 10);
        week.push({ date, count: counts.get(date) ?? 0 });
      } else {
        week.push({ date: null, count: 0 });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  return weeks;
}

export function heatmapColor(count: number): string {
  if (count === 0) return "var(--muted)";
  if (count === 1) return "color-mix(in srgb, var(--primary) 30%, transparent)";
  if (count <= 3) return "color-mix(in srgb, var(--primary) 55%, transparent)";
  if (count <= 6) return "color-mix(in srgb, var(--primary) 80%, transparent)";
  return "var(--primary)";
}

export const contributionsLabel = (count: number) => `${count} ${count === 1 ? "contribuição" : "contribuições"}`;
