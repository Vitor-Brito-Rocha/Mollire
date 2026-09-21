import { API_URL } from "@/shared/lib/http";

// <img> não envia headers, então o aviso do ngrok (dev) é pulado pela query string.
export function thumbnailSrc(thumbnailUrl: string): string {
  const url = `${API_URL}${thumbnailUrl}`;
  return `${url}${url.includes("?") ? "&" : "?"}ngrok-skip-browser-warning=1`;
}
