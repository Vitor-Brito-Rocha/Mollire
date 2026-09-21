import { useThumbnailSrc } from "@/shared/hooks/use-thumbnail-src";
import { Skeleton } from "@/shared/ui/skeleton";

// The captured screenshot of a published site (see useThumbnailSrc for why it
// isn't a plain <img src>). When it can't be loaded, says so instead of
// shimmering forever.
export function ThumbnailImage({
  thumbnailUrl,
  alt,
  className,
  fallback,
}: {
  thumbnailUrl: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}) {
  const { src, isLoading, isError } = useThumbnailSrc(thumbnailUrl);
  if (isLoading) return <Skeleton className="h-full min-h-24 w-full" aria-busy="true" />;
  if (isError || !src) {
    return fallback ?? <p className="text-text-3 px-3 py-6 text-center text-xs">Não foi possível carregar a captura.</p>;
  }
  return <img src={src} alt={alt} className={className} />;
}
