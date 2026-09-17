"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type Deployment, type Project } from "@/lib/api";

const STATUS_VARIANT: Record<Deployment["status"], "default" | "secondary" | "destructive"> = {
  PENDING: "secondary",
  CLONING: "secondary",
  BUILDING: "secondary",
  PUBLISHING: "secondary",
  SUCCESS: "default",
  FAILED: "destructive",
};

export default function AdminProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    api.get<Project>(`/admin/projects/${slug}`).then(setProject);
  }, [slug]);

  if (!project) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold">{project.name}</h2>
        <p className="text-muted-foreground text-sm">
          {project.slug}.aulvi.com.br · dono: {project.user?.email}
        </p>
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
        <h3 className="mb-3 text-lg font-semibold">Histórico de deploys</h3>
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
