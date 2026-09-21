import { StatusChip } from "@/modules/projects";
import { SiteThumb } from "@/shared/components/site-thumb";
import type { GalleryProjectDetail } from "../types";

// The project's site inside a browser-window frame; the whole thing opens it.
export function SitePreview({ project }: { project: GalleryProjectDetail }) {
  return (
    <a
      href={project.url}
      target="_blank"
      rel="noreferrer"
      aria-label={`Abrir ${project.name} em nova aba`}
      className="corners border-border block border"
    >
      <div className="border-border bg-card flex items-center gap-2 border-b px-3.5 py-2.5">
        <span className="bg-line-2 size-2" />
        <span className="bg-line-2 size-2" />
        <span className="bg-line-2 size-2" />
        <span className="text-text-3 ml-2 truncate font-mono text-xs">{project.url.replace(/^https?:\/\//, "")}</span>
        <StatusChip tone="good" className="ml-auto">
          No ar
        </StatusChip>
      </div>
      <div className="h-[280px] overflow-hidden sm:h-[420px]">
        <SiteThumb slug={project.slug} thumbnailUrl={project.thumbnail_url} name={project.name} />
      </div>
    </a>
  );
}
