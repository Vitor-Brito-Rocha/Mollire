import { Link } from "react-router";
import { TierBadge, tierFor } from "@/modules/gallery";
import { projectHost } from "@/modules/projects";
import { SiteThumb } from "@/shared/components/site-thumb";
import type { UserProfile } from "../types";

export function ProfileProjectCard({ project }: { project: UserProfile["projects"][number] }) {
  const tier = tierFor(project.stars);

  return (
    <article
      className="corners bg-card border-border flex flex-col border"
      style={{ "--corner": tier ? tier.color : "var(--line-2)" } as React.CSSProperties}
    >
      <Link
        to={`/galeria/${project.slug}`}
        aria-label={`Abrir ${project.name}`}
        className="border-border mx-1.5 mt-1.5 block h-[130px] overflow-hidden border"
      >
        <SiteThumb slug={project.slug} thumbnailUrl={project.thumbnail_url} name={project.name} />
      </Link>
      <div className="flex flex-col gap-2 px-4 pt-3 pb-4">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/galeria/${project.slug}`} className="truncate text-sm leading-tight font-semibold">
            {project.name}
          </Link>
          {tier && <TierBadge tier={tier} />}
        </div>
        <div className="text-text-3 flex items-center gap-1.5 text-xs">
          <span className="font-mono">{projectHost(project.slug)}</span>
          <span className="text-border">·</span>
          <span className="font-mono">★ {project.stars}</span>
        </div>
      </div>
    </article>
  );
}
