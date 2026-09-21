import { cn } from "@/shared/lib/utils";

type PanelProps = {
  title?: string;
  // Small mono number next to the title (rows, members…). Hidden when undefined.
  count?: number;
  className?: string;
  children: React.ReactNode;
};

// The HUD card every content block sits in: cornered frame, optional
// uppercase title with a counter. Children bring their own padding.
export function Panel({ title, count, className, children }: PanelProps) {
  return (
    <section className={cn("corners bg-card border-border flex flex-col border", className)}>
      {title && (
        <h2 className="label border-border flex items-center gap-2 border-b px-4 py-3">
          {title}
          {count !== undefined && (
            <span className="text-text-3 font-mono text-xs tracking-normal normal-case">{count}</span>
          )}
        </h2>
      )}
      {children}
    </section>
  );
}
