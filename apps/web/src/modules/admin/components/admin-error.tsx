import { EmptyState } from "@/shared/components/empty-state";
import { Button } from "@/shared/ui/button";

export function AdminError({ onRetry, children }: { onRetry: () => void; children: React.ReactNode }) {
  return (
    <EmptyState
      action={
        <Button variant="outline" onClick={onRetry}>
          Tentar de novo
        </Button>
      }
    >
      {children}
    </EmptyState>
  );
}
