import { Star } from "lucide-react";
import { Link } from "react-router";
import { TierBadge, tierFor } from "@/modules/gallery";
import { projectHost } from "@/modules/projects";
import { CoverCard } from "@/shared/components/cover-card";
import { formatNumber } from "@/shared/lib/format";
import type { UserProfile } from "../types";

export function ProfileProjectCard({ project }: { project: UserProfile["projects"][number] }) {
  const tier = tierFor(project.stars);
  const to = `/galeria/${project.slug}`;

  return (
    <CoverCard
      to={to}
      slug={project.slug}
      thumbnailUrl={project.thumbnail_url}
      name={project.name}
      badge={tier && <TierBadge tier={tier} />}
      corner={tier?.color}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <Link to={to} className="group-hover:text-primary truncate text-body-lg leading-tight font-semibold transition-colors">
          {project.name}
        </Link>
        <span className="text-text-3 truncate font-mono text-xs">{projectHost(project.slug)}</span>
      </div>
      <span className="text-gold flex shrink-0 items-center gap-1 font-mono text-caption tabular-nums">
        <Star className="size-3.5 fill-current" />
        {formatNumber(project.stars)}
      </span>
    </CoverCard>
  );
}
