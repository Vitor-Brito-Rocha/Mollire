import { Loader2Icon } from "lucide-react";
import { cn } from "@/shared/lib/utils";

// Inline pending indicator: inside buttons ("Salvando…"), next to a refetching
// list, or centred on its own via <PageSpinner />.
function Spinner({ className, ...props }: React.ComponentProps<typeof Loader2Icon>) {
  return <Loader2Icon role="status" aria-label="Carregando" className={cn("size-4 animate-spin", className)} {...props} />;
}

function PageSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("text-muted-foreground flex flex-1 items-center justify-center p-10", className)}>
      <Spinner className="size-6" />
    </div>
  );
}

export { PageSpinner, Spinner };
