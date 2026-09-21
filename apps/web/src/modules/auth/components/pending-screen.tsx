import { Spinner } from "@/shared/ui/spinner";

// Landing pages that work on their own and then redirect (e-mail link, OAuth
// return): a spinner and one line so the wait never looks like a dead page.
export function PendingScreen({ label }: { label: string }) {
  return (
    <div role="status" className="text-muted-foreground flex items-center justify-center gap-2.5 p-6 text-sm">
      <Spinner />
      {label}
    </div>
  );
}
