import { useMemo } from "react";
import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";
import { useRequiredParam } from "@/shared/hooks/use-required-param";
import { formatNumber } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { AnalyticsBarChart } from "../components/analytics-bar-chart";
import { RankedList } from "../components/ranked-list";
import { useAnalytics } from "../hooks/use-project-reads";
import { fillLastDays } from "../lib/analytics";
import { Panel } from "@/shared/components/panel";

const DAYS = 30;

export default function ProjectAnalyticsPage() {
  const slug = useRequiredParam("slug");
  const { data: analytics, isPending, isError, refetch } = useAnalytics(slug);

  // Derived from the response only: recomputed when it changes, not on every render.
  const byDay = useMemo(() => (analytics ? fillLastDays(analytics.byDay, DAYS) : []), [analytics]);
  const topPaths = useMemo(
    () => (analytics ? analytics.byPath.map((row) => ({ label: row.path, views: row.views })) : []),
    [analytics],
  );
  const topCountries = useMemo(
    () =>
      analytics
        ? analytics.byCountry.filter((row) => row.country !== null).map((row) => ({ label: row.country!, views: row.views }))
        : [],
    [analytics],
  );

  return (
    <div className="mx-auto flex w-full max-w-(--page) flex-col gap-6">
      <PageHeader back={{ to: `/projects/${slug}`, label: slug }} title="Analytics" />

      {isError ? (
        <EmptyState
          className="py-16"
          action={<Button variant="outline" onClick={() => refetch()}>Tentar de novo</Button>}
        >
          Erro ao carregar analytics.
        </EmptyState>
      ) : isPending ? (
        <div className="flex flex-col gap-6" aria-busy="true">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <Panel className="flex-row items-center gap-6 px-6 py-5">
            <div className="flex flex-col gap-0.5">
              <span className="font-display text-display-lg leading-none font-bold tabular-nums">
                {formatNumber(analytics.total)}
              </span>
              <span className="text-muted-foreground text-sm">visitas únicas por dia (total)</span>
            </div>
          </Panel>

          <Panel title={`Visitas por dia — últimos ${DAYS} dias`}>
            <div className="pb-8">
              <AnalyticsBarChart data={byDay} />
            </div>
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <RankedList title="Top páginas" rows={topPaths} emptyText="Nenhuma visita registrada ainda." />
            <RankedList
              title="Top países"
              rows={topCountries}
              emptyText="Nenhum dado de país disponível ainda."
            />
          </div>
        </div>
      )}
    </div>
  );
}
