import { Panel } from "@/shared/components/panel";
import { ThumbnailImage } from "@/shared/components/thumbnail-image";
import { Label } from "@/shared/ui/label";
import { Spinner } from "@/shared/ui/spinner";
import { Switch } from "@/shared/ui/switch";
import type { Project } from "../types";
import { StatusChip } from "./status-chip";

type VisibilityCardProps = {
  project: Project;
  isOwner: boolean;
  pending: boolean;
  onChange: (isPublic: boolean) => void;
};

// Gallery visibility (owner only) and the thumbnail the gallery shows.
export function VisibilityCard({ project, isOwner, pending, onChange }: VisibilityCardProps) {
  return (
    <Panel className="gap-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="gallery-visibility">Publicar na galeria</Label>
          <p className="text-muted-foreground text-xs">
            {project.is_public
              ? "Qualquer pessoa vê este projeto em /galeria e pode dar estrela."
              : "Só você vê este projeto. Publicar rende XP na primeira vez."}
          </p>
        </div>
        {isOwner ? (
          <div className="flex items-center gap-2">
            {pending && <Spinner />}
            <Switch
              id="gallery-visibility"
              checked={project.is_public}
              disabled={pending}
              onCheckedChange={onChange}
            />
          </div>
        ) : (
          <StatusChip tone="idle">só o dono</StatusChip>
        )}
      </div>
      {project.thumbnail_url ? (
        <div className="border-border overflow-hidden border">
          <ThumbnailImage
            thumbnailUrl={project.thumbnail_url}
            alt={`Captura de ${project.name}`}
            className="block w-full object-cover object-top"
          />
        </div>
      ) : (
        project.is_public && (
          <p className="text-text-3 text-xs">A miniatura da galeria é capturada no próximo deploy bem-sucedido.</p>
        )
      )}
    </Panel>
  );
}
