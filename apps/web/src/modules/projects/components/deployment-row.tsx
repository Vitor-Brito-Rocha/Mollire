import { memo, useEffect, useRef, useState } from "react";
import { InlineAction } from "@/shared/components/inline-action";
import { formatDayMonthTime, formatDuration } from "@/shared/lib/format";
import { isInFlight } from "../lib/deployments";
import type { Deployment } from "../types";
import { DeployStatus } from "./status-chip";

type DeploymentRowProps = {
  deployment: Deployment;
  // The stored log, or the live one while this deployment is the running one.
  log: string | null;
  // Expanded from the start (the running deploy, once output arrives).
  defaultOpen: boolean;
  canRedeploy: boolean;
  redeploying: boolean;
  onRedeploy: (commitSha: string) => void;
};

// Memoised on purpose: while a deploy runs the log grows chunk by chunk and the
// page re-renders on each one — only the running row's `log` changes, so every
// other row (each with its own <pre>) skips the work.
export const DeploymentRow = memo(function DeploymentRow({
  deployment,
  log,
  defaultOpen,
  canRedeploy,
  redeploying,
  onRedeploy,
}: DeploymentRowProps) {
  const hasLog = !!log;
  const duration = formatDuration(deployment.created_at, deployment.finished_at);
  const sha = deployment.commit_sha;

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

  return (
    <details
      className={
        "group border-border border-b last:border-b-0" +
        (sweep === "good" ? " sweep-good" : sweep === "bad" ? " sweep-bad" : "")
      }
      open={defaultOpen}
    >
      <summary
        className={
          "grid grid-cols-12 items-center gap-3 px-4 py-3 " +
          (hasLog ? "hover:bg-raised cursor-pointer" : "cursor-default [&::-webkit-details-marker]:hidden")
        }
      >
        <span className="col-span-5 sm:col-span-3">
          <DeployStatus status={deployment.status} />
        </span>
        <span className="text-muted-foreground col-span-7 flex flex-wrap items-center gap-x-2 text-caption whitespace-nowrap sm:col-span-4">
          {formatDayMonthTime(deployment.created_at)}
          {duration && <span className="text-text-3 font-mono text-mini">{duration}</span>}
        </span>
        <span className="text-text-3 hidden font-mono text-xs sm:col-span-3 sm:block">
          {sha ? sha.slice(0, 7) : "—"}
          {deployment.commit_message && (
            <span className="text-text-3 ml-2 hidden truncate font-sans not-italic sm:inline">
              {deployment.commit_message}
            </span>
          )}
        </span>
        <span className="col-span-2 flex justify-end gap-3">
          {sha && canRedeploy && (
            <InlineAction
              className="label hidden text-mini sm:inline-flex"
              pending={redeploying}
              onClick={(event) => {
                // Inside <summary>: don't toggle the log open/closed.
                event.preventDefault();
                onRedeploy(sha);
              }}
            >
              re-deploy
            </InlineAction>
          )}
          {hasLog && (
            <span className="text-text-3 label group-open:text-foreground hidden text-mini sm:block">log</span>
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
