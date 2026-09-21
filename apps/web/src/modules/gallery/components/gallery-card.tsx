import { memo } from "react";
import { Link } from "react-router";
import { projectHost } from "@/modules/projects";
import { SiteThumb } from "@/shared/components/site-thumb";
import { tierFor } from "../lib/tiers";
import type { GalleryProject } from "../types";
import { ProjectStarButton } from "./project-star-button";
import { TierBadge } from "./tier-badge";

// Memoised: starring one project rewrites that project's object only (the rest
// of the list keeps the same references), so the other cards skip rendering.
export const GalleryCard = memo(function GalleryCard({ project }: { project: GalleryProject }) {
  const tier = tierFor(project.stars);

  return (
    <article
      className="corners bg-card border-border flex flex-col border"
      style={{ "--corner": tier ? tier.color : "var(--line-2)" } as React.CSSProperties}
    >
      <Link
        to={`/galeria/${project.slug}`}
        aria-label={`Abrir ${project.name}`}
        className="border-border mx-1.5 mt-1.5 block h-[150px] overflow-hidden border"
      >
        <SiteThumb slug={project.slug} thumbnailUrl={project.thumbnail_url} name={project.name} />
      </Link>

      <div className="flex flex-col gap-3 px-4 pt-3.5 pb-4">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex min-w-0 flex-col gap-0.5">
            <Link to={`/galeria/${project.slug}`} className="truncate text-base leading-tight font-semibold">
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
          {tier && <TierBadge tier={tier} />}
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
