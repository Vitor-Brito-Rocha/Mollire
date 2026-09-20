"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ProjectActivityFeed } from "@/components/project-activity";
import { ProjectEnvVars } from "@/components/project-env-vars";
import { ProjectMembers } from "@/components/project-members";
import { DeployStatus, StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { api, API_URL, ApiError, type Deployment, type Project } from "@/lib/api";

const IN_FLIGHT: Deployment["status"][] = ["PENDING", "CLONING", "BUILDING", "PUBLISHING"];

const whenFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function deployDuration(start: string, end: string | null): string {
  if (!end) return "";
  const s = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export default function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [deploying, setDeploying] = useState(false);
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  const [liveLog, setLiveLog] = useState('');

  const load = useCallback(() => {
    api
      .get<Project>(`/projects/${slug}`)
      .then(setProject)
      .catch(() => undefined);
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  // Poll slowly when idle to catch deploys triggered externally (webhook).
  // Once inFlight becomes true the SSE below takes over and this stops.
  const latest = project?.deployments?.[0];
  const inFlight = !!latest && IN_FLIGHT.includes(latest.status);
  useEffect(() => {
    if (!project || inFlight) return;
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [inFlight, project, load]);

  // Stream status updates and live log via SSE while the latest deployment is in flight.
  // The server pushes each status change; on terminal state we reload the full
  // project so the log, commit_sha and finished_at are fresh.
  useEffect(() => {
    if (!project || !inFlight) return;
    setLiveLog('');
    const source = new EventSource(`${API_URL}/projects/${slug}/status`, {
      withCredentials: true,
    });
    source.onmessage = (e: MessageEvent<string>) => {
      const event = JSON.parse(e.data) as
        | { type: 'status'; deploymentId: string; status: Deployment["status"] }
        | { type: 'log'; deploymentId: string; chunk: string };

      if (event.type === 'log') {
        setLiveLog((prev) => prev + event.chunk);
        return;
      }

      const { deploymentId, status } = event;
      setProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          deployments: prev.deployments?.map((d) =>
            d.id === deploymentId ? { ...d, status } : d,
          ),
        };
      });
      if (status === "SUCCESS" || status === "FAILED") {
        source.close();
        load();
      }
    };
    source.onerror = () => source.close();
    return () => source.close();
  }, [inFlight, project?.id, slug, load]);

  async function handleDeploy(commitSha?: string) {
    setDeploying(true);
    try {
      await api.post(`/projects/${slug}/deploy`, commitSha ? { commit_sha: commitSha } : undefined);
      toast.success(commitSha ? `Re-deploy de ${commitSha.slice(0, 7)} disparado` : "Deploy disparado");
      load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Erro ao disparar deploy");
    } finally {
      setDeploying(false);
    }
  }

  async function handleToggleVisibility(isPublic: boolean) {
    setTogglingVisibility(true);
    try {
      const updated = await api.patch<Project>(`/projects/${slug}/visibility`, {
        is_public: isPublic,
      });
      setProject((prev) => (prev ? { ...prev, ...updated } : updated));
      toast.success(isPublic ? "Projeto publicado na galeria" : "Projeto removido da galeria");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Erro ao mudar visibilidade");
    } finally {
      setTogglingVisibility(false);
    }
  }

  if (!project) {
    return (
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const deployments = project.deployments ?? [];
  const url = `https://${project.slug}.aulvi.com.br`;
  const isOwner = project.my_role !== "MEMBER";

  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-2.5">
          <Link
            href="/"
            className="label text-muted-foreground hover:text-foreground flex w-fit items-center gap-2 transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="size-3.5"
              style={{ fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}
            >
              <path d="M15 6l-6 6 6 6" />
            </svg>
            Seus projetos
          </Link>
          <h1 className="font-display text-[34px] leading-[1.1] font-bold">{project.name}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <a href={url} target="_blank" rel="noreferrer" className="text-text-3 hover:text-foreground font-mono text-xs">
              {project.slug}.aulvi.com.br
            </a>
            {project.is_public ? (
              <StatusChip tone="good">Na galeria</StatusChip>
            ) : (
              <StatusChip tone="idle">Privado</StatusChip>
            )}
            {inFlight && <StatusChip tone="busy">Deploy em andamento</StatusChip>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${slug}/analytics`}
            className="label text-muted-foreground hover:text-foreground transition-colors text-xs"
          >
            Analytics
          </Link>
          <Button size="lg" onClick={() => handleDeploy()} disabled={deploying || inFlight}>
            {deploying ? "Disparando..." : "Deploy"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="corners bg-card border-border flex flex-col border lg:col-span-2">
          <h2 className="label border-border flex items-center gap-2 border-b px-4 py-3">
            Histórico de deploys
            <span className="text-text-3 font-mono text-xs tracking-normal normal-case">{deployments.length}</span>
          </h2>

          {deployments.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
              <p className="text-muted-foreground">Nenhum deploy ainda.</p>
              <p className="text-text-3 max-w-[38ch] text-sm">
                O primeiro deploy clona o repositório, roda o build e publica em {project.slug}.aulvi.com.br.
              </p>
            </div>
          ) : (
            deployments.map((deployment, i) => {
              const isLatestInFlight = i === 0 && inFlight;
              const displayLog = isLatestInFlight ? liveLog : deployment.log;
              const hasLog = !!displayLog;
              return (
                <details key={deployment.id} className="group border-border border-b last:border-b-0" open={isLatestInFlight && !!liveLog}>
                  <summary
                    className={
                      "grid grid-cols-12 items-center gap-3 px-4 py-3 " +
                      (hasLog ? "hover:bg-raised cursor-pointer" : "cursor-default [&::-webkit-details-marker]:hidden")
                    }
                  >
                    <span className="col-span-5 sm:col-span-3">
                      <DeployStatus status={deployment.status} />
                    </span>
                    <span className="text-muted-foreground col-span-7 flex flex-wrap items-center gap-x-2 whitespace-nowrap text-[13px] sm:col-span-4">
                      {whenFmt.format(new Date(deployment.created_at))}
                      {deployDuration(deployment.created_at, deployment.finished_at) && (
                        <span className="text-text-3 font-mono text-[11px]">
                          {deployDuration(deployment.created_at, deployment.finished_at)}
                        </span>
                      )}
                    </span>
                    <span className="text-text-3 hidden font-mono text-xs sm:col-span-3 sm:block">
                      {deployment.commit_sha ? deployment.commit_sha.slice(0, 7) : "—"}
                      {deployment.commit_message && (
                        <span className="text-text-3 ml-2 font-sans not-italic truncate hidden sm:inline">
                          {deployment.commit_message}
                        </span>
                      )}
                    </span>
                    <span className="col-span-2 flex justify-end gap-3">
                      {deployment.commit_sha && !inFlight && (
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); handleDeploy(deployment.commit_sha!); }}
                          disabled={deploying}
                          className="text-text-3 hover:text-foreground label hidden text-[10px] underline underline-offset-4 sm:block"
                        >
                          re-deploy
                        </button>
                      )}
                      {hasLog && (
                        <span className="text-text-3 label hidden text-[10px] group-open:text-foreground sm:block">
                          log
                        </span>
                      )}
                    </span>
                  </summary>
                  {hasLog && (
                    <pre className="bg-background border-border text-muted-foreground mx-4 mb-4 max-h-64 overflow-auto border p-3 font-mono text-xs whitespace-pre-wrap">
                      {displayLog}
                    </pre>
                  )}
                </details>
              );
            })
          )}
        </section>

        <div className="flex flex-col gap-6">
          <section className="corners bg-card border-border flex flex-col gap-4 border p-4">
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
                <Switch
                  id="gallery-visibility"
                  checked={project.is_public}
                  disabled={togglingVisibility}
                  onCheckedChange={handleToggleVisibility}
                />
              ) : (
                <span className="label text-text-3 text-[9.5px]">só o dono</span>
              )}
            </div>
            {project.thumbnail_url ? (
              <div className="border-border overflow-hidden border">
                {/* eslint-disable-next-line @next/next/no-img-element -- served by the API, per-project */}
                <img
                  src={`${API_URL}${project.thumbnail_url}`}
                  alt={`Captura de ${project.name}`}
                  className="block w-full object-cover object-top"
                />
              </div>
            ) : (
              project.is_public && (
                <p className="text-text-3 text-xs">
                  A miniatura da galeria é capturada no próximo deploy bem-sucedido.
                </p>
              )
            )}
          </section>

          <ProjectMembers slug={slug} />
          {isOwner && <ProjectEnvVars slug={slug} />}
          <ProjectActivityFeed slug={slug} />

          <section className="corners bg-card border-border flex flex-col border">
            <h2 className="label border-border border-b px-4 py-3">Configuração</h2>
            <dl className="flex flex-col">
              <div className="border-border flex flex-col gap-1 border-b px-4 py-3">
                <dt className="text-muted-foreground text-xs">Repositório</dt>
                <dd className="font-mono text-xs break-all">{project.repository_url}</dd>
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
          </section>
        </div>
      </div>
    </div>
  );
}
