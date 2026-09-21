import { Star } from "lucide-react";
import { Link } from "react-router";
import { TierBadge, tierFor } from "@/modules/gallery";
import { projectHost } from "@/modules/projects";
import { SiteThumb } from "@/shared/components/site-thumb";
import { useSpotlight } from "@/shared/hooks/use-spotlight";
import { formatNumber } from "@/shared/lib/format";
import type { UserProfile } from "../types";

export function ProfileProjectCard({ project }: { project: UserProfile["projects"][number] }) {
  const tier = tierFor(project.stars);
  const onPointerMove = useSpotlight();

  return (
    <article
      onPointerMove={onPointerMove}
      className="group corners surface hover:border-line-2 relative flex flex-col transition-[border-color,transform] duration-300 hover:-translate-y-0.5"
      style={{ "--corner": tier ? tier.color : "var(--line-2)" } as React.CSSProperties}
    >
      <span className="spot-glow z-10" aria-hidden="true" />
      <Link
        to={`/galeria/${project.slug}`}
        aria-label={`Abrir ${project.name}`}
        className="relative block aspect-[16/10] overflow-hidden"
      >
        <SiteThumb
          slug={project.slug}
          thumbnailUrl={project.thumbnail_url}
          name={project.name}
          className="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
        {tier && <TierBadge tier={tier} className="absolute top-3 left-3" />}
      </Link>
      <div className="flex items-start justify-between gap-3 px-4 pt-3 pb-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Link
            to={`/galeria/${project.slug}`}
            className="group-hover:text-primary truncate text-[15px] leading-tight font-semibold transition-colors"
          >
            {project.name}
          </Link>
          <span className="text-text-3 truncate font-mono text-xs">{projectHost(project.slug)}</span>
        </div>
        <span className="text-gold flex shrink-0 items-center gap-1 font-mono text-[13px] tabular-nums">
          <Star className="size-3.5 fill-current" />
          {formatNumber(project.stars)}
        </span>
      </div>
    </article>
  );
}
