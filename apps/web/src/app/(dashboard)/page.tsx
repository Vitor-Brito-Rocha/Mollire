"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type Project } from "@/lib/api";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    api.get<Project[]>("/projects").then(setProjects);
  }, []);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Seus projetos</h1>
        <Button nativeButton={false} render={<Link href="/projects/new">Novo projeto</Link>} />
      </div>

      {projects === null && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {projects?.length === 0 && (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center">
            Nenhum projeto ainda. Crie o primeiro.
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {projects?.map((project) => (
          <Link key={project.id} href={`/projects/${project.slug}`}>
            <Card className="hover:border-primary transition-colors">
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle>{project.name}</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    {project.slug}.aulvi.com.br
                  </p>
                </div>
                <Badge variant="secondary">{project.slug}</Badge>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
