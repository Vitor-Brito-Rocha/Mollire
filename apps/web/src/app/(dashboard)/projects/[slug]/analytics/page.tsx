"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type ProjectAnalytics } from "@/lib/api";

const dayFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });

function BackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-3.5"
      style={{ fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}
    >
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

function BarChart({ data }: { data: { date: string; views: number }[] }) {
  const max = Math.max(...data.map((d) => d.views), 1);

  return (
    <div className="flex h-32 items-end gap-px px-4 pb-4 pt-6">
      {data.map((d, i) => {
        const date = new Date(d.date);
        const showLabel = i === 0 || i === data.length - 1 || i % 7 === 0;
        return (
          <div key={d.date} className="relative flex flex-1 flex-col items-center gap-1">
            {d.views > 0 && (
              <span className="text-text-3 absolute -top-5 w-full text-center font-mono text-[9px]">
                {d.views}
              </span>
            )}
            <div
              className="bg-primary/70 hover:bg-primary w-full transition-colors"
              style={{ height: `${Math.max((d.views / max) * 80, d.views > 0 ? 3 : 1)}px` }}
            />
            {showLabel && (
              <span className="text-text-3 absolute -bottom-5 font-mono text-[9px] whitespace-nowrap">
                {dayFmt.format(date)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RelativeBar({ value, max }: { value: number; max: number }) {
  return (
    <div className="bg-border h-1 w-full overflow-hidden">
      <div className="bg-primary/50 h-full" style={{ width: `${(value / max) * 100}%` }} />
    </div>
  );
}

export default function ProjectAnalyticsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [analytics, setAnalytics] = useState<ProjectAnalytics | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get<ProjectAnalytics>(`/analytics/${slug}`)
      .then(setAnalytics)
      .catch(() => setError(true));
  }, [slug]);

  const hasCountries = analytics ? analytics.byCountry.some((c) => c.country !== null) : false;

  const fullByDay = (() => {
    if (!analytics) return [];
    const viewsByDate = Object.fromEntries(analytics.byDay.map((d) => [d.date.split("T")[0], d.views]));
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const key = d.toISOString().split("T")[0];
      return { date: key, views: viewsByDate[key] ?? 0 };
    });
  })();
  const maxPath = analytics ? Math.max(...analytics.byPath.map((p) => p.views), 1) : 1;
  const maxCountry = analytics ? Math.max(...analytics.byCountry.map((c) => c.views), 1) : 1;

  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6">
      <div className="flex flex-col gap-2.5">
        <Link
          href={`/projects/${slug}`}
          className="label text-muted-foreground hover:text-foreground flex w-fit items-center gap-2 transition-colors"
        >
          <BackIcon />
          {slug}
        </Link>
        <h1 className="font-display text-[34px] leading-[1.1] font-bold">Analytics</h1>
      </div>

      {error ? (
        <div className="corners bg-card border-border flex flex-col items-center gap-3 border px-6 py-16 text-center">
          <p className="text-muted-foreground">Erro ao carregar analytics.</p>
        </div>
      ) : analytics === null ? (
        <div className="flex flex-col gap-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <section className="corners bg-card border-border flex items-center gap-6 border px-6 py-5">
            <div className="flex flex-col gap-0.5">
              <span className="font-display text-[48px] leading-none font-bold tabular-nums">
                {analytics.total.toLocaleString("pt-BR")}
            </span>
              <span className="text-muted-foreground text-sm">visitas únicas por dia (total)</span>
            </div>
          </section>

          <section className="corners bg-card border-border flex flex-col border">
            <h2 className="label border-border border-b px-4 py-3">Visitas por dia — últimos 30 dias</h2>
            <div className="pb-8">
              <BarChart data={fullByDay} />
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="corners bg-card border-border flex flex-col border">
              <h2 className="label border-border border-b px-4 py-3">Top páginas</h2>
              {analytics.byPath.length === 0 ? (
                <p className="text-text-3 px-4 py-8 text-center text-sm">Nenhuma visita registrada ainda.</p>
              ) : (
                <div className="flex flex-col">
                  {analytics.byPath.map((row) => (
                    <div key={row.path} className="border-border flex flex-col gap-1.5 border-b px-4 py-3 last:border-b-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-mono text-xs truncate">{row.path}</span>
                        <span className="text-muted-foreground font-mono text-xs tabular-nums shrink-0">{row.views}</span>
                      </div>
                      <RelativeBar value={row.views} max={maxPath} />
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="corners bg-card border-border flex flex-col border">
              <h2 className="label border-border border-b px-4 py-3">Top países</h2>
              {!hasCountries ? (
                <p className="text-text-3 px-4 py-8 text-center text-sm">Nenhum dado de país disponível ainda.</p>
              ) : (
                <div className="flex flex-col">
                  {analytics.byCountry.filter((c) => c.country !== null).map((row) => (
                    <div key={row.country} className="border-border flex flex-col gap-1.5 border-b px-4 py-3 last:border-b-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-mono text-xs">{row.country}</span>
                        <span className="text-muted-foreground font-mono text-xs tabular-nums shrink-0">{row.views}</span>
                      </div>
                      <RelativeBar value={row.views} max={maxCountry} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
