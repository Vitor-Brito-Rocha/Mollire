import { cn } from "@/shared/lib/utils";
import { Spinner } from "@/shared/ui/spinner";

type InlineActionProps = Omit<React.ComponentProps<"button">, "type"> & {
  // A request from this very action is running: spinner + no second click.
  pending?: boolean;
  destructive?: boolean;
};

// The small underlined text button used inside lists ("remover", "cancelar",
// "re-deploy"). Shows its own pending state so a row never looks frozen.
export function InlineAction({ pending, destructive, className, children, disabled, ...props }: InlineActionProps) {
  return (
    <button
      type="button"
      disabled={pending || disabled}
      aria-busy={pending}
      className={cn(
        "text-text-3 focus-ring inline-flex shrink-0 items-center gap-1 text-xs underline underline-offset-4 disabled:opacity-60",
        destructive ? "hover:text-destructive" : "hover:text-foreground",
        className,
      )}
      {...props}
    >
      {pending && <Spinner className="size-3" />}
      {children}
    </button>
  );
}
