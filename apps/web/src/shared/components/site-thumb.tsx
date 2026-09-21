import { useThumbnailSrc } from "@/shared/hooks/use-thumbnail-src";
import { tintFor } from "@/shared/lib/tint";
import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";

// Miniatura de um site publicado: a captura real quando existe e carrega.
// Sem captura — ou se ela falhar — uma capa honesta: a inicial do projeto e o
// endereço sobre uma malha, na cor do projeto. Nunca um ícone de imagem
// quebrada, nunca um esqueleto eterno.
type Size = "thumb" | "card" | "banner";

const LETTER: Record<Size, string> = {
  thumb: "text-[30px]",
  card: "text-[72px]",
  banner: "text-[220px] opacity-[0.16] md:text-[300px]",
};

export function SiteThumb({
  slug,
  thumbnailUrl,
  name,
  size = "card",
  className,
}: {
  slug: string;
  thumbnailUrl: string | null;
  name: string;
  size?: Size;
  className?: string;
}) {
  const { src, isLoading } = useThumbnailSrc(thumbnailUrl);

  if (isLoading) return <Skeleton className={cn("h-full w-full", className)} aria-busy="true" />;
  if (src) {
    return <img src={src} alt={`Captura de ${name}`} className={cn("h-full w-full object-cover object-top", className)} />;
  }

  const tint = tintFor(slug);
  return (
    <div
      className={cn("relative flex h-full w-full flex-col justify-between overflow-hidden", size === "thumb" ? "p-1.5" : "p-3", className)}
      style={{
        color: tint,
        background: `linear-gradient(135deg, color-mix(in srgb, ${tint} 10%, var(--raised)) 0%, var(--raised) 55%, color-mix(in srgb, ${tint} 16%, var(--card)) 100%)`,
      }}
      aria-hidden="true"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: `linear-gradient(90deg, color-mix(in srgb, ${tint} 10%, transparent) 1px, transparent 1px), linear-gradient(color-mix(in srgb, ${tint} 10%, transparent) 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 60% 55% at 85% 100%, color-mix(in srgb, ${tint} 22%, transparent), transparent 70%)`,
        }}
      />
      {size === "card" && <span className="label text-micro relative opacity-70">sem captura</span>}
      <span
        className={cn(
          "font-display relative self-end leading-none font-bold select-none",
          size === "banner" ? "absolute -right-4 -bottom-10 md:-bottom-16" : "opacity-90",
          LETTER[size],
        )}
      >
        {name.trim().charAt(0).toUpperCase() || "?"}
      </span>
      {size === "card" && <span className="text-text-3 text-micro relative font-mono">{slug}</span>}
    </div>
  );
}
