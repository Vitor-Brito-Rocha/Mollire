import { ArrowUpRight, Star } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { StarButton, tierFor } from "@/modules/gallery";
import { projectHost, projectUrl } from "@/modules/projects";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { CoverCard } from "@/shared/components/cover-card";
import { InlineAction } from "@/shared/components/inline-action";
import { StatusChip } from "@/shared/components/status-chip";
import { useGradeProject, useRemoveSubmission, useToggleTurmaStar } from "../hooks/use-turma-mutations";
import { formatGrade } from "../lib/format";
import type { TurmaProject } from "../types";
import { GradeField } from "./grade-field";
import { TeamAvatars } from "./team-avatars";

type TurmaProjectCardProps = {
  turmaId: string;
  project: TurmaProject;
  // Apelido de quem está vendo: dono retira o projeto; dono e equipe veem a nota.
  viewerHandle: string | null;
  // Professor: dá nota e vê todas.
  canGrade: boolean;
};

// Um projeto enviado à turma: capa, grupo, equipe, estrela dos colegas, e a
// nota — que só o professor e a equipe enxergam. O feedback escrito segue a
// escolha do professor: só a equipe, ou a turma inteira. Nota não é ranking.
export function TurmaProjectCard({ turmaId, project, viewerHandle, canGrade }: TurmaProjectCardProps) {
  const toggleStar = useToggleTurmaStar(turmaId);
  const grade = useGradeProject(turmaId);
  const remove = useRemoveSubmission(turmaId);
  const [removing, setRemoving] = useState(false);
  const mine = viewerHandle !== null && viewerHandle === project.author;
  const onTeam = mine || (viewerHandle !== null && (project.team?.some((m) => m.handle === viewerHandle) ?? false));
  const tier = tierFor(project.stars);
  // O back só manda o texto para quem pode ler; ausente = back sem o campo.
  const commentSupported = project.grade_comment !== undefined;
  const comment = project.grade_comment ?? null;
  const showTeam = (project.team?.length ?? 0) > 1;

  return (
    <CoverCard
      to={`/u/${project.author}`}
      slug={project.slug}
      thumbnailUrl={project.thumbnail_url}
      name={project.name}
      badge={project.group && <StatusChip tone="idle">{project.group.name}</StatusChip>}
      corner={tier?.color}
    >
      <div className="flex w-full flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <a
              href={projectUrl(project.slug)}
              target="_blank"
              rel="noreferrer"
              className="group-hover:text-primary flex items-center gap-1 truncate text-base leading-tight font-semibold transition-colors"
            >
              {project.name}
              <ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" />
            </a>
            <span className="text-muted-foreground text-caption">
              <Link to={`/u/${project.author}`} className="hover:text-foreground transition-colors">
                {project.author}
              </Link>
              {" ·"}{" "}
              <span className="text-text-3 font-mono text-xs">{projectHost(project.slug)}</span>
            </span>
          </div>
          {onTeam ? (
            <span className="text-text-3 flex shrink-0 items-center gap-1 font-mono text-caption tabular-nums" title="Estrelas dos colegas">
              <Star className="size-3.5" aria-hidden="true" />
              {project.stars}
            </span>
          ) : (
            <StarButton
              name={project.name}
              stars={project.stars}
              starred={project.starred_by_viewer}
              pending={toggleStar.isPending && toggleStar.variables?.slug === project.slug}
              onToggle={() => toggleStar.mutate({ slug: project.slug, starred: project.starred_by_viewer })}
            />
          )}
        </div>

        {showTeam && project.team && <TeamAvatars team={project.team} />}

        {(canGrade || onTeam || comment) && (
          <div className="border-border flex flex-col gap-3 border-t pt-3">
            {canGrade ? (
              <GradeField
                key={`${project.grade ?? "none"}|${comment ?? ""}|${project.grade_comment_public ?? false}`}
                value={project.grade}
                comment={comment}
                commentPublic={project.grade_comment_public}
                commentSupported={commentSupported}
                pending={grade.isPending && grade.variables?.slug === project.slug}
                onSave={(input) => grade.mutate({ slug: project.slug, ...input })}
              />
            ) : (
              <>
                {onTeam && (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {project.grade !== null ? (
                      <StatusChip tone="good">Nota {formatGrade(project.grade)}</StatusChip>
                    ) : (
                      <span className="text-text-3 text-xs">Ainda sem nota</span>
                    )}
                    {mine && (
                      <InlineAction destructive onClick={() => setRemoving(true)} disabled={remove.isPending}>
                        retirar da turma
                      </InlineAction>
                    )}
                  </div>
                )}
                {comment && (
                  <blockquote className="border-primary/40 text-muted-foreground border-l-2 pl-3 text-sm leading-relaxed">
                    <span className="label text-text-3 mb-1 block text-micro">
                      Feedback do professor{onTeam && project.grade_comment_public ? " · visível para a turma" : ""}
                    </span>
                    {comment}
                  </blockquote>
                )}
              </>
            )}
          </div>
        )}
      </div>
      <ConfirmDialog
        open={removing}
        title={`Retirar ${project.name} da turma?`}
        description="Ele some da galeria da turma e perde a nota. O projeto continua existindo normalmente."
        confirmLabel="Retirar"
        pending={remove.isPending}
        onCancel={() => setRemoving(false)}
        onConfirm={() => remove.mutate(project.slug, { onSettled: () => setRemoving(false) })}
      />
    </CoverCard>
  );
}
