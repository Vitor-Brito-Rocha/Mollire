import { Link } from "react-router";
import { SiteThumb } from "@/shared/components/site-thumb";
import { useSpotlight } from "@/shared/hooks/use-spotlight";
import { cn } from "@/shared/lib/utils";

type CoverCardProps = {
  to: string;
  slug: string;
  thumbnailUrl: string | null;
  name: string;
  // Canto superior esquerdo da capa (o selo Bronze/Prata/Ouro).
  badge?: React.ReactNode;
  // Canto superior direito ("Destaque").
  tag?: React.ReactNode;
  // Cor das ferragens de canto; sem ela, a cor de linha.
  corner?: string;
  // Duas colunas e capa mais larga: o primeiro item de uma vitrine.
  featured?: boolean;
  className?: string;
  // O rodapé: nome, autor, estrela — cada tela põe o seu.
  children: React.ReactNode;
};

// Um item de vitrine, como numa loja de launcher: capa inteira com zoom leve,
// selo por cima, brilho que segue o ponteiro, e o rodapé que a tela quiser.
export function CoverCard({ to, slug, thumbnailUrl, name, badge, tag, corner, featured = false, className, children }: CoverCardProps) {
  const onPointerMove = useSpotlight();

  return (
    <article
      onPointerMove={onPointerMove}
      className={cn(
        "group corners surface hover:border-line-2 relative flex flex-col transition-[border-color,transform] duration-(--dur) hover:-translate-y-0.5",
        featured && "sm:col-span-2",
        className,
      )}
      style={{ "--corner": corner ?? "var(--line-2)" } as React.CSSProperties}
    >
      <span className="spot-glow z-10" aria-hidden="true" />
      <Link
        to={to}
        aria-label={`Abrir ${name}`}
        className={cn("relative block overflow-hidden", featured ? "aspect-[21/9]" : "aspect-[16/10]")}
      >
        <SiteThumb
          slug={slug}
          thumbnailUrl={thumbnailUrl}
          name={name}
          size={featured ? "banner" : "card"}
          className="transition-transform duration-(--dur-slow) ease-out group-hover:scale-[1.03]"
        />
        {badge && <span className="absolute top-3 left-3">{badge}</span>}
        {tag && (
          <span className="label bg-background/70 text-primary text-micro absolute top-3 right-3 px-2 py-1 backdrop-blur">
            {tag}
          </span>
        )}
      </Link>
      <div className="flex items-start justify-between gap-3 px-4 pt-3.5 pb-4">{children}</div>
    </article>
  );
}
