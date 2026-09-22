import { Link } from "react-router";
import { useProjects } from "@/modules/projects";
import { projectHost } from "@/modules/projects";
import { HudDialog } from "@/shared/components/hud-dialog";
import { SiteThumb } from "@/shared/components/site-thumb";
import { StatusChip } from "@/shared/components/status-chip";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Spinner } from "@/shared/ui/spinner";
import { useSubmitProject } from "../hooks/use-turma-mutations";

type SubmitProjectDialogProps = {
  turmaId: string;
  submittedSlugs: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// "Enviar projeto": os seus projetos (só os que você é dono), um botão em cada.
export function SubmitProjectDialog({ turmaId, submittedSlugs, open, onOpenChange }: SubmitProjectDialogProps) {
  const { data: projects, isPending } = useProjects();
  const submit = useSubmitProject(turmaId);
  const own = projects?.filter((p) => p.my_role !== "MEMBER") ?? [];

  return (
    <HudDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Enviar um projeto"
      description="O projeto entra na galeria da turma com o seu grupo atual. Só o dono pode enviar."
    >
      {isPending ? (
        <Skeleton className="h-32 w-full" />
      ) : own.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Você ainda não tem projeto seu.{" "}
          <Link to="/projects/new" className="text-primary underline underline-offset-4">
            Crie o primeiro
          </Link>
          .
        </p>
      ) : (
        <ul className="border-border flex max-h-[360px] flex-col overflow-y-auto border">
          {own.map((project) => {
            const sent = submittedSlugs.includes(project.slug);
            const pending = submit.isPending && submit.variables === project.slug;
            return (
              <li key={project.id} className="border-border flex items-center gap-3 border-b px-3 py-2.5 last:border-b-0">
                <span className="border-border block h-9 w-14 shrink-0 overflow-hidden border">
                  <SiteThumb slug={project.slug} thumbnailUrl={project.thumbnail_url} name={project.name} size="thumb" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-semibold">{project.name}</span>
                  <span className="text-text-3 truncate font-mono text-xs">{projectHost(project.slug)}</span>
                </span>
                {sent ? (
                  <StatusChip tone="good">enviado</StatusChip>
                ) : (
                  <Button size="sm" onClick={() => submit.mutate(project.slug)} disabled={submit.isPending} aria-busy={pending}>
                    {pending && <Spinner />}
                    Enviar
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </HudDialog>
  );
}
