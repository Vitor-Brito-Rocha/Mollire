import { useQuery } from "@tanstack/react-query";
import { API_URL } from "@/shared/lib/http";

// <img> can't send headers, and in dev the API sits behind ngrok, whose free
// tier answers with an HTML warning page unless `ngrok-skip-browser-warning`
// is present. So in dev the image is fetched with that header and shown from
// a blob URL; in production the API URL is used directly.
async function fetchThumbnail(url: string): Promise<string> {
  const response = await fetch(url, { headers: { "ngrok-skip-browser-warning": "1" } });
  if (!response.ok) throw new Error(`thumbnail ${response.status}`);
  return URL.createObjectURL(await response.blob());
}

export function useThumbnailSrc(thumbnailUrl: string) {
  const url = `${API_URL}${thumbnailUrl}`;
  const { data, isPending, isError } = useQuery({
    queryKey: ["thumbnail", url],
    queryFn: () => fetchThumbnail(url),
    enabled: import.meta.env.DEV,
    // The blob URL lives as long as the cache entry; the file changes only on a new deploy.
    staleTime: Infinity,
    meta: { silent: true },
  });

  if (!import.meta.env.DEV) return { src: url, isLoading: false, isError: false };
  return { src: data, isLoading: isPending, isError };
}
