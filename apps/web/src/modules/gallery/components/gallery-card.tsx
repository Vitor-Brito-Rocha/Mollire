import { memo } from "react";
import { Link } from "react-router";
import { projectHost } from "@/modules/projects";
import { SiteThumb } from "@/shared/components/site-thumb";
import { useSpotlight } from "@/shared/hooks/use-spotlight";
import { cn } from "@/shared/lib/utils";
import { tierFor } from "../lib/tiers";
import type { GalleryProject } from "../types";
import { ProjectStarButton } from "./project-star-button";
import { TierBadge } from "./tier-badge";

// Um projeto da galeria, como um item de loja de launcher: capa inteira, selo
// por cima, nome e autor embaixo, a estrela à mão. O primeiro da lista pode
// ser o destaque — ocupa duas colunas e ganha uma capa mais larga.
//
// Memoised: starring one project rewrites that project's object only (the rest
// of the list keeps the same references), so the other cards skip rendering.
export const GalleryCard = memo(function GalleryCard({
  project,
  featured = false,
}: {
  project: GalleryProject;
  featured?: boolean;
}) {
  const tier = tierFor(project.stars);
  const onPointerMove = useSpotlight();

  return (
    <article
      onPointerMove={onPointerMove}
      className={cn(
        "group corners surface hover:border-line-2 relative flex flex-col transition-[border-color,transform] duration-300 hover:-translate-y-0.5",
        featured && "sm:col-span-2",
      )}
      style={{ "--corner": tier ? tier.color : "var(--line-2)" } as React.CSSProperties}
    >
      <span className="spot-glow z-10" aria-hidden="true" />

      <Link
        to={`/galeria/${project.slug}`}
        aria-label={`Abrir ${project.name}`}
        className={cn("relative block overflow-hidden", featured ? "aspect-[21/9]" : "aspect-[16/10]")}
      >
        <SiteThumb
          slug={project.slug}
          thumbnailUrl={project.thumbnail_url}
          name={project.name}
          size={featured ? "banner" : "card"}
          className="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
        {tier && <TierBadge tier={tier} className="absolute top-3 left-3" />}
        {featured && (
          <span className="label bg-background/70 text-primary absolute top-3 right-3 px-2 py-1 text-[9.5px] backdrop-blur">
            Destaque
          </span>
        )}
      </Link>

      <div className="flex items-start justify-between gap-3 px-4 pt-3.5 pb-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Link
            to={`/galeria/${project.slug}`}
            className={cn(
              "group-hover:text-primary truncate leading-tight font-semibold transition-colors",
              featured ? "font-display text-[22px]" : "text-base",
            )}
          >
            {project.name}
          </Link>
          <span className="text-muted-foreground text-[12.5px]">
            <Link to={`/u/${project.author}`} className="hover:text-foreground transition-colors">
              {project.author}
            </Link>
            {" ·"}{" "}
            <span className="text-text-3 font-mono text-[11.5px]">{projectHost(project.slug)}</span>
          </span>
        </div>
        <ProjectStarButton
          slug={project.slug}
          name={project.name}
          stars={project.stars}
          starred={project.starred_by_viewer}
        />
      </div>
    </article>
  );
});
