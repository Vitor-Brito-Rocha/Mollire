import type { ProjectAnalytics } from "../types";

// The API only returns days that had visits; the chart wants every one of the
// last `days` days, zeros included, oldest first.
export function fillLastDays(byDay: ProjectAnalytics["byDay"], days: number): { date: string; views: number }[] {
  const viewsByDate = Object.fromEntries(byDay.map((d) => [d.date.split("T")[0], d.views]));
  return Array.from({ length: days }, (_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - (days - 1 - i));
    const date = day.toISOString().split("T")[0];
    return { date, views: viewsByDate[date] ?? 0 };
  });
}
