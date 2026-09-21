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
const longDate = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
const dayMonthNumeric = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });

type DateInput = string | number | Date;
const at = (value: DateInput) => new Date(value);

export const formatDayMonth = (value: DateInput) => dayMonth.format(at(value));
export const formatDayMonthYear = (value: DateInput) => dayMonthYear.format(at(value));
export const formatDayMonthTime = (value: DateInput) => dayMonthTime.format(at(value));
export const formatDayMonthNumeric = (value: DateInput) => dayMonthNumeric.format(at(value));

export const formatLongDate = (value: DateInput) => longDate.format(at(value));

export const formatNumber = (value: number) => value.toLocaleString("pt-BR");

// "45s" / "3m 12s"; empty while the end is unknown.
export function formatDuration(start: DateInput, end: DateInput | null): string {
  if (!end) return "";
  const seconds = Math.round((at(end).getTime() - at(start).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

// "agora" / "há 5 min" / "há 3 h" / "há 2 dias"; older than a month falls back to the date.
export function formatTimeAgo(value: DateInput): string {
  const minutes = Math.round((Date.now() - at(value).getTime()) / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `há ${days} ${days === 1 ? "dia" : "dias"}`;
  return formatDayMonthTime(value);
}
