import { memo } from "react";
import { Link } from "react-router";
import { projectHost } from "@/modules/projects";
import { CoverCard } from "@/shared/components/cover-card";
import { cn } from "@/shared/lib/utils";
import { tierFor } from "../lib/tiers";
import type { GalleryProject } from "../types";
import { ProjectStarButton } from "./project-star-button";
import { TierBadge } from "./tier-badge";

// Um projeto da galeria. O primeiro da lista pode ser o destaque.
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
  const to = `/galeria/${project.slug}`;

  return (
    <CoverCard
      to={to}
      slug={project.slug}
      thumbnailUrl={project.thumbnail_url}
      name={project.name}
      badge={tier && <TierBadge tier={tier} />}
      tag={featured ? "Destaque" : undefined}
      corner={tier?.color}
      featured={featured}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <Link
          to={to}
          className={cn(
            "group-hover:text-primary truncate leading-tight font-semibold transition-colors",
            featured ? "font-display text-heading" : "text-base",
          )}
        >
          {project.name}
        </Link>
        <span className="text-muted-foreground text-caption">
          <Link to={`/u/${project.author}`} className="hover:text-foreground transition-colors">
            {project.author}
          </Link>
          {" ·"}{" "}
          <span className="text-text-3 font-mono text-xs">{projectHost(project.slug)}</span>
        </span>
      </div>
      <ProjectStarButton
        slug={project.slug}
        name={project.name}
        stars={project.stars}
        starred={project.starred_by_viewer}
      />
    </CoverCard>
  );
});
