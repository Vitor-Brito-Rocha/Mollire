import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { API_URL } from "@/shared/lib/http";
import { isTerminal } from "../lib/deployments";
import type { DeploymentStreamEvent, Project } from "../types";
import { projectKeys } from "./keys";

// Live view of a running deploy over server-sent events. The server pushes each
// status change and log chunk: statuses are written straight into the cached
// project (so every reader updates), the log accumulates here. On a terminal
// status the full project is refetched so commit_sha, finished_at and the
// stored log are fresh. Returns the log streamed so far.
export function useDeploymentStream(slug: string, active: boolean): string {
  const queryClient = useQueryClient();
  const [liveLog, setLiveLog] = useState("");

  useEffect(() => {
    if (!active) return;

    const source = new EventSource(`${API_URL}/projects/${slug}/status`, { withCredentials: true });

    source.onmessage = (message: MessageEvent<string>) => {
      const event = JSON.parse(message.data) as DeploymentStreamEvent;

      if (event.type === "log") {
        setLiveLog((previous) => previous + event.chunk);
        return;
      }

      queryClient.setQueryData<Project>(projectKeys.detail(slug), (previous) =>
        previous
          ? {
              ...previous,
              deployments: previous.deployments?.map((deployment) =>
                deployment.id === event.deploymentId ? { ...deployment, status: event.status } : deployment,
              ),
            }
          : previous,
      );

      if (isTerminal(event.status)) {
        source.close();
        void queryClient.invalidateQueries({ queryKey: projectKeys.detail(slug) });
      }
    };
    // The browser would retry on its own, but a dead stream is better replaced
    // by the (slower) polling in useProject than by a reconnect loop.
    source.onerror = () => source.close();

    return () => {
      source.close();
      // The next deploy starts from an empty log.
      setLiveLog("");
    };
  }, [slug, active, queryClient]);

  return liveLog;
}
