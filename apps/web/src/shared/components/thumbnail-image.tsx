import { useThumbnailSrc } from "@/shared/hooks/use-thumbnail-src";
import { Skeleton } from "@/shared/ui/skeleton";

// The captured screenshot of a published site (see useThumbnailSrc for why it
// isn't a plain <img src>).
export function ThumbnailImage({
  thumbnailUrl,
  alt,
  className,
}: {
  thumbnailUrl: string;
  alt: string;
  className?: string;
}) {
  const { src, isLoading } = useThumbnailSrc(thumbnailUrl);
  if (isLoading || !src) return <Skeleton className="h-full min-h-24 w-full" aria-busy="true" />;
  return <img src={src} alt={alt} className={className} />;
}
