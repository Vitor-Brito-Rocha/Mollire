// pt-BR formatters, built once (Intl.DateTimeFormat is costly to construct and
// these run per row in lists).

const dayMonth = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
const dayMonthYear = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
const dayMonthTime = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const dayMonthNumeric = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });

type DateInput = string | number | Date;
const at = (value: DateInput) => new Date(value);

export const formatDayMonth = (value: DateInput) => dayMonth.format(at(value));
export const formatDayMonthYear = (value: DateInput) => dayMonthYear.format(at(value));
export const formatDayMonthTime = (value: DateInput) => dayMonthTime.format(at(value));
export const formatDayMonthNumeric = (value: DateInput) => dayMonthNumeric.format(at(value));

export const formatNumber = (value: number) => value.toLocaleString("pt-BR");

// "45s" / "3m 12s"; empty while the end is unknown.
export function formatDuration(start: DateInput, end: DateInput | null): string {
  if (!end) return "";
  const seconds = Math.round((at(end).getTime() - at(start).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}
