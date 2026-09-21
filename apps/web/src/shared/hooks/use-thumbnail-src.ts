import { useQuery } from "@tanstack/react-query";
import { API_URL } from "@/shared/lib/http";

// <img> can't send headers, and the API may sit behind ngrok, whose free tier
// answers browser requests with an HTML warning page unless
// `ngrok-skip-browser-warning` is present. So the image is fetched with that
// header (harmless when the API isn't behind ngrok, same as the HTTP client)
// and shown from a blob URL — in every build, not only in dev: a production
// build pointed at an ngrok API (a Vercel preview) broke every thumbnail.
async function fetchThumbnail(url: string): Promise<string> {
  const response = await fetch(url, { headers: { "ngrok-skip-browser-warning": "1" } });
  if (!response.ok) throw new Error(`thumbnail ${response.status}`);
  return URL.createObjectURL(await response.blob());
}

// `null` when the project has no capture yet: nothing is fetched.
export function useThumbnailSrc(thumbnailUrl: string | null) {
  const url = thumbnailUrl ? `${API_URL}${thumbnailUrl}` : null;
  const { data, isPending, isError } = useQuery({
    queryKey: ["thumbnail", url],
    queryFn: () => fetchThumbnail(url ?? ""),
    enabled: url !== null,
    // A missing file won't appear by retrying, and TanStack pauses retries
    // while the tab is hidden — which would hold the skeleton instead of
    // showing the fallback cover. Fail on the first answer; the next mount asks again.
    retry: 0,
    // The blob URL lives as long as the cache entry; the file changes only on a new deploy.
    staleTime: Infinity,
    meta: { silent: true },
  });

  return { src: url ? data : undefined, isLoading: url !== null && isPending, isError };
}
