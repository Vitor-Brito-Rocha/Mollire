"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DeployStatus } from "@/components/status-chip";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type Project } from "@/lib/api";

const whenFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

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

  const deployments = project.deployments ?? [];
  const url = `https://${project.slug}.aulvi.com.br`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2.5">
        <Link
          href="/admin"
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
          Projetos
        </Link>
        <h2 className="font-display text-[28px] leading-[1.1] font-bold">{project.name}</h2>
        <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-sm">
          <a href={url} target="_blank" rel="noreferrer" className="text-text-3 hover:text-foreground font-mono text-xs">
            {project.slug}.aulvi.com.br
          </a>
          <span aria-hidden="true">·</span>
          <span>
            dono <span className="font-mono text-xs">{project.user?.email ?? "—"}</span>
          </span>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="corners bg-card border-border flex flex-col border lg:col-span-1">
          <h3 className="label border-border border-b px-4 py-3">Configuração</h3>
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

        <section className="corners bg-card border-border flex flex-col border lg:col-span-2">
          <h3 className="label border-border flex items-center gap-2 border-b px-4 py-3">
            Histórico de deploys
            <span className="text-text-3 font-mono text-xs tracking-normal normal-case">{deployments.length}</span>
          </h3>

          {deployments.length === 0 ? (
            <p className="text-muted-foreground px-4 py-10 text-center">Nenhum deploy ainda.</p>
          ) : (
            deployments.map((deployment) => (
              <details key={deployment.id} className="group border-border border-b last:border-b-0">
                <summary
                  className={
                    "grid grid-cols-12 items-center gap-3 px-4 py-3 " +
                    (deployment.log ? "hover:bg-raised cursor-pointer" : "cursor-default [&::-webkit-details-marker]:hidden")
                  }
                >
                  <span className="col-span-5 sm:col-span-3">
                    <DeployStatus status={deployment.status} />
                  </span>
                  <span className="text-muted-foreground col-span-5 text-[13px] sm:col-span-4">
                    {whenFmt.format(new Date(deployment.created_at))}
                  </span>
                  <span className="text-text-3 col-span-2 font-mono text-xs sm:col-span-3">
                    {deployment.commit_sha ? deployment.commit_sha.slice(0, 7) : "—"}
                  </span>
                  {deployment.log && (
                    <span className="text-text-3 label hidden text-[10px] group-open:text-foreground sm:col-span-2 sm:block sm:text-right">
                      log
                    </span>
                  )}
                </summary>
                {deployment.log && (
                  <pre className="bg-background border-border text-muted-foreground mx-4 mb-4 max-h-64 overflow-auto border p-3 font-mono text-xs whitespace-pre-wrap">
                    {deployment.log}
                  </pre>
                )}
              </details>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
