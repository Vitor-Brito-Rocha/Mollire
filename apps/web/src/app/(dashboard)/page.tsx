"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type Project } from "@/lib/api";

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

// Só o que a API devolve hoje: nome, slug e data. Estado do último deploy,
// estrelas e visibilidade entram nesta tabela quando /projects passar a
// incluí-los — o modelo (canvas "Seus projetos") já reserva as colunas.
export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    api.get<Project[]>("/projects").then(setProjects);
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-2.5">
          <span className="label text-primary flex items-center gap-2.5 tracking-[0.14em]">
            <span className="bg-primary h-0.5 w-[18px]" />
            Painel
          </span>
          <h1 className="font-display text-[34px] leading-[1.1] font-bold">Seus projetos</h1>
          {projects && (
            <p className="text-muted-foreground text-[15px]">
              {projects.length === 1 ? "1 projeto" : `${projects.length} projetos`}
            </p>
          )}
        </div>
        <Button size="lg" nativeButton={false} render={<Link href="/projects/new">Novo projeto</Link>} />
      </div>

      {projects === null && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {projects?.length === 0 && (
        <div className="corners bg-card border-border border px-6 py-12 text-center">
          <p className="text-muted-foreground">Nenhum projeto ainda. Publique o primeiro.</p>
        </div>
      )}

      {projects && projects.length > 0 && (
        <div className="corners bg-card border-border flex flex-col border">
          <div className="label text-text-3 border-border grid grid-cols-12 gap-3 border-b px-4 py-2.5 text-[10px]">
            <span className="col-span-8 sm:col-span-9">Projeto</span>
            <span className="col-span-4 sm:col-span-3">Criado em</span>
          </div>
          {projects.map((project, index) => (
            <Link
              key={project.id}
              href={`/projects/${project.slug}`}
              className={
                "hover:bg-raised grid grid-cols-12 items-center gap-3 px-4 py-3.5 transition-colors " +
                (index < projects.length - 1 ? "border-border border-b" : "")
              }
            >
              <div className="col-span-8 flex min-w-0 flex-col gap-0.5 sm:col-span-9">
                <span className="flex items-center gap-2">
                  <span className="truncate text-[15px] font-semibold">{project.name}</span>
                  {project.my_role === "MEMBER" && (
                    <span className="label text-text-3 shrink-0 text-[9.5px]">membro</span>
                  )}
                </span>
                <span className="text-text-3 truncate font-mono text-xs">{project.slug}.aulvi.com.br</span>
              </div>
              <span className="text-muted-foreground col-span-4 text-[13px] sm:col-span-3">
                {dateFmt.format(new Date(project.created_at))}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
