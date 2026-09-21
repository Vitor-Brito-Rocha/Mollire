import { formatDayMonthNumeric } from "@/shared/lib/format";

// Daily views as bars; the date label shows every 7th day plus both ends.
export function AnalyticsBarChart({ data }: { data: { date: string; views: number }[] }) {
  const max = Math.max(...data.map((d) => d.views), 1);

  return (
    <div className="flex h-32 items-end gap-px px-4 pt-6 pb-4">
      {data.map((d, i) => {
        const showLabel = i === 0 || i === data.length - 1 || i % 7 === 0;
        return (
          <div key={d.date} className="relative flex flex-1 flex-col items-center gap-1">
            {d.views > 0 && (
              <span className="text-text-3 absolute -top-5 w-full text-center font-mono text-micro">{d.views}</span>
            )}
            <div
              className="bg-primary/70 hover:bg-primary w-full transition-colors"
              style={{ height: `${Math.max((d.views / max) * 80, d.views > 0 ? 3 : 1)}px` }}
            />
            {showLabel && (
              <span className="text-text-3 absolute -bottom-5 font-mono text-micro whitespace-nowrap">
                {formatDayMonthNumeric(d.date)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
