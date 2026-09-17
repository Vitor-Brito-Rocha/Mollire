"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type Project } from "@/lib/api";

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="corners bg-card border-border flex flex-col gap-1 border px-4 py-3.5">
      <span className="label text-text-3">{label}</span>
      <span className="font-display text-[26px] leading-none font-bold tabular-nums">{value}</span>
    </div>
  );
}

// /admin/projects devolve os projetos com o e-mail do dono, sem deployments —
// por isso a tabela não tem coluna de estado; ela entra quando a API incluir
// o último deploy de cada projeto.
export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    api.get<Project[]>("/admin/projects").then(setProjects);
  }, []);

  if (projects === null) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const owners = new Set(projects.map((p) => p.user?.email).filter(Boolean)).size;
  const newest = projects[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Projetos" value={projects.length} />
        <Stat label="Donos" value={owners} />
        <Stat label="Último cadastro" value={newest ? dateFmt.format(new Date(newest.created_at)) : "—"} />
      </div>

      {projects.length === 0 ? (
        <div className="corners bg-card border-border border px-6 py-12 text-center">
          <p className="text-muted-foreground">Nenhum projeto no sistema ainda.</p>
        </div>
      ) : (
        <div className="corners bg-card border-border flex flex-col border">
          <div className="label text-text-3 border-border grid grid-cols-12 gap-3 border-b px-4 py-2.5 text-[10px]">
            <span className="col-span-6 sm:col-span-5">Projeto</span>
            <span className="col-span-6 sm:col-span-4">Dono</span>
            <span className="hidden sm:col-span-3 sm:block">Criado em</span>
          </div>
          {projects.map((project, index) => (
            <Link
              key={project.id}
              href={`/admin/projects/${project.slug}`}
              className={
                "hover:bg-raised grid grid-cols-12 items-center gap-3 px-4 py-3.5 transition-colors " +
                (index < projects.length - 1 ? "border-border border-b" : "")
              }
            >
              <div className="col-span-6 flex min-w-0 flex-col gap-0.5 sm:col-span-5">
                <span className="truncate text-[15px] font-semibold">{project.name}</span>
                <span className="text-text-3 truncate font-mono text-xs">{project.slug}.aulvi.com.br</span>
              </div>
              <span className="text-muted-foreground col-span-6 truncate font-mono text-xs sm:col-span-4">
                {project.user?.email ?? "—"}
              </span>
              <span className="text-muted-foreground hidden text-[13px] sm:col-span-3 sm:block">
                {dateFmt.format(new Date(project.created_at))}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
