"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError, type Deployment, type Project } from "@/lib/api";

const STATUS_VARIANT: Record<Deployment["status"], "default" | "secondary" | "destructive"> = {
  PENDING: "secondary",
  CLONING: "secondary",
  BUILDING: "secondary",
  PUBLISHING: "secondary",
  SUCCESS: "default",
  FAILED: "destructive",
};

const IN_FLIGHT: Deployment["status"][] = ["PENDING", "CLONING", "BUILDING", "PUBLISHING"];

export default function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [deploying, setDeploying] = useState(false);

  const load = useCallback(() => {
    api
      .get<Project>(`/projects/${slug}`)
      .then(setProject)
      .catch(() => undefined);
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  // Poll while the latest deployment is still in flight.
  useEffect(() => {
    const latest = project?.deployments?.[0];
    if (!latest || !IN_FLIGHT.includes(latest.status)) return;
    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  }, [project, load]);

  async function handleDeploy() {
    setDeploying(true);
    try {
      await api.post(`/projects/${slug}/deploy`);
      toast.success("Deploy disparado");
      load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Erro ao disparar deploy");
    } finally {
      setDeploying(false);
    }
  }

  if (!project) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <a
            href={`https://${project.slug}.aulvi.com.br`}
            target="_blank"
            rel="noreferrer"
            className="text-primary text-sm underline underline-offset-4"
          >
            {project.slug}.aulvi.com.br
          </a>
        </div>
        <Button onClick={handleDeploy} disabled={deploying}>
          {deploying ? "Disparando..." : "Deploy"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuração</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground flex flex-col gap-1 text-sm">
          <p>Repositório: {project.repository_url}</p>
          <p>Build: {project.build_command}</p>
          <p>Saída: {project.output_dir}</p>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Histórico de deploys</h2>
        <div className="flex flex-col gap-3">
          {project.deployments?.length === 0 && (
            <p className="text-muted-foreground text-sm">Nenhum deploy ainda.</p>
          )}
          {project.deployments?.map((deployment) => (
            <Card key={deployment.id}>
              <CardHeader className="flex-row items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_VARIANT[deployment.status]}>{deployment.status}</Badge>
                  <span className="text-muted-foreground text-xs">
                    {new Date(deployment.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>
                {deployment.commit_sha && (
                  <code className="text-muted-foreground text-xs">
                    {deployment.commit_sha.slice(0, 7)}
                  </code>
                )}
              </CardHeader>
              {deployment.log && (
                <CardContent className="pt-0">
                  <Separator className="mb-3" />
                  <pre className="bg-muted max-h-48 overflow-auto rounded-md p-3 text-xs whitespace-pre-wrap">
                    {deployment.log}
                  </pre>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
