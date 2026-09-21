import { useState, type FormEvent } from "react";
import { FormField } from "@/shared/components/form-field";
import { InlineAction } from "@/shared/components/inline-action";
import { Panel } from "@/shared/components/panel";
import { SubmitButton } from "@/shared/components/submit-button";
import { Button } from "@/shared/ui/button";
import type { ProjectPatch } from "../api/projects.api";
import { useUpdateProject } from "../hooks/use-projects";
import { blocksSubmit, useRootDirCheck } from "../hooks/use-root-dir-check";
import { normalizeRootDir } from "../lib/root-dir";
import type { Project } from "../types";
import { RootDirField } from "./root-dir-field";

// Repositório, pasta, build e saída; o dono edita, o membro só lê.
export function ProjectConfig({ project, isOwner }: { project: Project; isOwner: boolean }) {
  const [editing, setEditing] = useState(false);

  return (
    <Panel
      title="Configuração"
      aside={
        isOwner && !editing ? (
          <InlineAction onClick={() => setEditing(true)}>editar</InlineAction>
        ) : undefined
      }
    >
      {editing ? (
        <ProjectConfigForm project={project} onDone={() => setEditing(false)} />
      ) : (
        <dl className="flex flex-col">
          <div className="border-border flex flex-col gap-1 border-b px-4 py-3">
            <dt className="text-muted-foreground text-xs">Repositório</dt>
            <dd className="font-mono text-xs break-all">{project.repository_url}</dd>
          </div>
          <div className="border-border flex flex-col gap-1 border-b px-4 py-3">
            <dt className="text-muted-foreground text-xs">Pasta do projeto</dt>
            <dd className="font-mono text-xs break-all">{project.root_dir || "raiz do repositório"}</dd>
          </div>
          <div className="border-border flex flex-col gap-1 border-b px-4 py-3">
            <dt className="text-muted-foreground text-xs">Build</dt>
            <dd className="font-mono text-xs break-all">{project.build_command}</dd>
          </div>
          <div className="flex flex-col gap-1 px-4 py-3">
            <dt className="text-muted-foreground text-xs">Saída</dt>
            <dd className="font-mono text-xs">{project.output_dir}</dd>
          </div>
        </dl>
      )}
    </Panel>
  );
}

// Monta só enquanto edita, então os campos sempre partem do que está salvo.
function ProjectConfigForm({ project, onDone }: { project: Project; onDone: () => void }) {
  const update = useUpdateProject(project.slug);
  const [name, setName] = useState(project.name);
  const [repositoryUrl, setRepositoryUrl] = useState(project.repository_url);
  const [rootDir, setRootDir] = useState(project.root_dir);
  const [buildCommand, setBuildCommand] = useState(project.build_command);
  const [outputDir, setOutputDir] = useState(project.output_dir);
  const { state: rootDirState } = useRootDirCheck(repositoryUrl, rootDir);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // Só o que mudou vai para o servidor.
    const patch: ProjectPatch = {};
    if (name.trim() !== project.name) patch.name = name.trim();
    if (repositoryUrl !== project.repository_url) patch.repository_url = repositoryUrl;
    if (normalizeRootDir(rootDir) !== project.root_dir) patch.root_dir = normalizeRootDir(rootDir);
    if (buildCommand !== project.build_command) patch.build_command = buildCommand;
    if (outputDir !== project.output_dir) patch.output_dir = outputDir;

    if (Object.keys(patch).length === 0) {
      onDone();
      return;
    }
    update.mutate(patch, { onSuccess: onDone });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
      <FormField id="config-name" label="Nome" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
      <FormField
        id="config-repository"
        label="Repositório"
        type="url"
        value={repositoryUrl}
        onChange={(e) => setRepositoryUrl(e.target.value)}
        className="font-mono text-xs"
        maxLength={500}
        required
      />
      <RootDirField id="config-root" value={rootDir} onChange={setRootDir} state={rootDirState} />
      <div className="flex flex-col gap-2">
        <FormField
          id="config-build"
          label="Comando de build"
          value={buildCommand}
          onChange={(e) => setBuildCommand(e.target.value)}
          className="font-mono text-xs"
          maxLength={500}
          required
        />
        <p className="text-text-3 text-xs">
          O <span className="font-mono">npm install</span> roda antes, automaticamente: aqui vai só o build.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <FormField
          id="config-output"
          label="Pasta de saída"
          value={outputDir}
          onChange={(e) => setOutputDir(e.target.value)}
          className="font-mono text-xs"
          maxLength={100}
          required
        />
        <p className="text-text-3 text-xs">Relativa à pasta do projeto.</p>
      </div>
      <p className="text-text-3 text-xs">
        O endereço ({project.slug}) não muda. O resto vale a partir do próximo deploy.
      </p>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" size="lg" onClick={onDone} disabled={update.isPending}>
          Cancelar
        </Button>
        <SubmitButton
          size="lg"
          pending={update.isPending}
          pendingLabel="Salvando…"
          disabled={blocksSubmit(rootDirState)}
        >
          Salvar
        </SubmitButton>
      </div>
    </form>
  );
}
