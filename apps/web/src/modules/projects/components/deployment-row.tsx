import { ChevronDown, RefreshCw, RotateCcw } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import { StatusChip } from "@/shared/components/status-chip";
import { formatDayMonthTime, formatDuration } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { isInFlight } from "../lib/deployments";
import type { Deployment } from "../types";
import { DeployStatus } from "./status-chip";

type DeploymentRowProps = {
  deployment: Deployment;
  // The stored log, or the live one while this deployment is the running one.
  log: string | null;
  // Expanded from the start (the running deploy, once output arrives).
  defaultOpen: boolean;
  // A versão que está no ar agora (o deploy publicado mais recente).
  current: boolean;
  canRedeploy: boolean;
  redeploying: boolean;
  onRedeploy: (commitSha: string) => void;
};

// Uma linha por deploy: o estado, a mensagem do commit como texto principal,
// os metadados numa linha discreta, e as ações à direita. Voltar a uma versão
// antiga se chama "Restaurar"; refazer a atual, "Refazer".
//
// Memoised on purpose: while a deploy runs the log grows chunk by chunk and the
// page re-renders on each one — only the running row's `log` changes, so every
// other row (each with its own <pre>) skips the work.
export const DeploymentRow = memo(function DeploymentRow({
  deployment,
  log,
  defaultOpen,
  current,
  canRedeploy,
  redeploying,
  onRedeploy,
}: DeploymentRowProps) {
  const hasLog = !!log;
  const duration = formatDuration(deployment.created_at, deployment.finished_at);
  const sha = deployment.commit_sha;
  const running = isInFlight(deployment.status);

  // O momento: um deploy que estava rodando e acabou nesta sessão ganha uma
  // varredura de luz na linha — verde se publicou, vermelha se falhou.
  const [sweep, setSweep] = useState<"good" | "bad" | null>(null);
  const previousStatus = useRef(deployment.status);
  useEffect(() => {
    const was = previousStatus.current;
    previousStatus.current = deployment.status;
    if (!isInFlight(was) || isInFlight(deployment.status)) return;
    setSweep(deployment.status === "SUCCESS" ? "good" : "bad");
    const timer = setTimeout(() => setSweep(null), 1500);
    return () => clearTimeout(timer);
  }, [deployment.status]);

  const Icon = current ? RefreshCw : RotateCcw;

  return (
    <details
      className={cn("group border-border border-b last:border-b-0", sweep === "good" && "sweep-good", sweep === "bad" && "sweep-bad")}
      open={defaultOpen}
    >
      <summary
        className={cn(
          "flex items-center gap-4 px-4 py-3 [&::-webkit-details-marker]:hidden",
          hasLog ? "hover:bg-raised/60 cursor-pointer" : "cursor-default",
        )}
      >
        <DeployStatus status={deployment.status} className="w-[118px] justify-center" />

        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-medium">
              {deployment.commit_message || (running ? "Deploy em andamento" : "Deploy manual")}
            </span>
            {current && <StatusChip tone="accent">no ar</StatusChip>}
          </span>
          <span className="text-text-3 flex flex-wrap items-center gap-x-2 text-xs">
            {sha && <span className="font-mono">{sha.slice(0, 7)}</span>}
            {sha && <span aria-hidden="true">·</span>}
            <span>{formatDayMonthTime(deployment.created_at)}</span>
            {duration && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{duration}</span>
              </>
            )}
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-2">
          {sha && canRedeploy && (
            <Button
              variant="outline"
              size="sm"
              disabled={redeploying}
              aria-busy={redeploying}
              onClick={(event) => {
                // Inside <summary>: don't toggle the log open/closed.
                event.preventDefault();
                onRedeploy(sha);
              }}
              title={current ? "Rodar o build de novo com este commit" : "Voltar o site para esta versão"}
            >
              {redeploying ? <Spinner /> : <Icon className="size-3.5" />}
              <span className="hidden sm:inline">{current ? "Refazer" : "Restaurar"}</span>
            </Button>
          )}
          {hasLog && (
            <span className="label text-text-3 group-open:text-foreground flex items-center gap-1 text-mini transition-colors">
              log
              <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" aria-hidden="true" />
            </span>
          )}
        </span>
      </summary>
      {hasLog && (
        <pre className="bg-background border-border text-muted-foreground mx-4 mb-4 max-h-64 overflow-auto border p-3 font-mono text-xs whitespace-pre-wrap">
          {log}
        </pre>
      )}
    </details>
  );
});
