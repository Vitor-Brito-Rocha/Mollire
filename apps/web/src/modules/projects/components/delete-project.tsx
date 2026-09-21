import { useState } from "react";
import { useNavigate } from "react-router";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { Panel } from "@/shared/components/panel";
import { Button } from "@/shared/ui/button";
import { useDeleteProject } from "../hooks/use-projects";
import { projectHost } from "../lib/project-url";
import type { Project } from "../types";

// Zona de perigo (só o dono). Apagar exige digitar o nome do projeto: o mesmo
// nome é conferido de novo no servidor.
export function DeleteProject({ project }: { project: Project }) {
  const navigate = useNavigate();
  const deleteProject = useDeleteProject(project.slug);
  const [open, setOpen] = useState(false);

  return (
    <Panel title="Zona de perigo">
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Apagar este projeto</p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Tira o site do ar e apaga deploys, membros, variáveis, comentários e estrelas. Não dá para desfazer.
          </p>
        </div>
        <Button variant="destructive" size="lg" className="self-start" onClick={() => setOpen(true)}>
          Apagar projeto
        </Button>
      </div>
      <ConfirmDialog
        open={open}
        title={`Apagar ${project.name}?`}
        description={`O site em ${projectHost(project.slug)} sai do ar e tudo o que está ligado ao projeto é apagado de vez.`}
        confirmLabel="Apagar projeto"
        confirmText={project.name}
        pending={deleteProject.isPending}
        onCancel={() => setOpen(false)}
        onConfirm={() =>
          deleteProject.mutate(project.name, {
            onSuccess: () => navigate("/"),
          })
        }
      />
    </Panel>
  );
}
