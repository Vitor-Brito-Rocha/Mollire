import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "../api/projects.api";
import { projectKeys } from "./keys";

// The activity feed is a side panel: if it fails the panel just stays empty
// instead of shouting over the screen that works.
export function useActivity(slug: string) {
  return useQuery({
    queryKey: projectKeys.activity(slug),
    queryFn: () => projectsApi.activity(slug),
    meta: { silent: true },
  });
}

// The analytics screen renders its own error state.
export function useAnalytics(slug: string) {
  return useQuery({
    queryKey: projectKeys.analytics(slug),
    queryFn: () => projectsApi.analytics(slug),
    meta: { silent: true },
  });
}

