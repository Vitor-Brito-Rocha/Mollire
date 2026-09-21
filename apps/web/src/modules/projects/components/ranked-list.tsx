import { Panel } from "@/shared/components/panel";

type RankedListProps = {
  title: string;
  rows: { label: string; views: number }[];
  emptyText: string;
};

// A ranking with a bar per row, scaled to the biggest value ("Top páginas",
// "Top países").
export function RankedList({ title, rows, emptyText }: RankedListProps) {
  const max = Math.max(...rows.map((row) => row.views), 1);

  return (
    <Panel title={title}>
      {rows.length === 0 ? (
        <p className="text-text-3 px-4 py-8 text-center text-sm">{emptyText}</p>
      ) : (
        <div className="flex flex-col">
          {rows.map((row) => (
            <div key={row.label} className="border-border flex flex-col gap-1.5 border-b px-4 py-3 last:border-b-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate font-mono text-xs">{row.label}</span>
                <span className="text-muted-foreground shrink-0 font-mono text-xs tabular-nums">{row.views}</span>
              </div>
              <div className="bg-border h-1 w-full overflow-hidden">
                <div className="bg-primary/50 h-full" style={{ width: `${(row.views / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
