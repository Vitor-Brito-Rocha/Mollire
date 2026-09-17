"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type Project } from "@/lib/api";

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    api.get<Project[]>("/admin/projects").then(setProjects);
  }, []);

  if (projects === null) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {projects.length === 0 && (
        <p className="text-muted-foreground text-sm">Nenhum projeto no sistema ainda.</p>
      )}
      {projects.map((project) => (
        <Link key={project.id} href={`/admin/projects/${project.slug}`}>
          <Card className="hover:border-primary transition-colors">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>{project.name}</CardTitle>
                <p className="text-muted-foreground text-sm">
                  {project.slug}.aulvi.com.br · {project.user?.email}
                </p>
              </div>
              <Badge variant="secondary">{project.slug}</Badge>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
