import { cn } from "@/shared/lib/utils";

// "Nothing here" and "could not load" blocks: same frame, one message, and an
// optional action underneath.
export function EmptyState({
  children,
  action,
  className,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "corners bg-card border-border flex flex-col items-center gap-3 border px-6 py-12 text-center",
        className,
      )}
    >
      <p className="text-muted-foreground">{children}</p>
      {action}
    </div>
  );
}
