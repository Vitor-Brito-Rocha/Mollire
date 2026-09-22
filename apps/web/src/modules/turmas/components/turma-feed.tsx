import { Fragment } from "react";
import { Panel } from "@/shared/components/panel";
import { formatDayMonth } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Spinner } from "@/shared/ui/spinner";
import { useTurmaFeed } from "../hooks/use-turmas";
import type { TurmaFeedItem } from "../types";
import { FeedItem } from "./feed-item";

// "Hoje", "Ontem", ou a data: o separador entre os dias do feed.
function dayLabel(iso: string): string {
  const day = new Date(iso);
  const today = new Date();
  const diff = Math.round((today.setHours(0, 0, 0, 0) - new Date(day).setHours(0, 0, 0, 0)) / 864e5);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Ontem";
  return formatDayMonth(iso);
}

// O feed inteiro, agrupado por dia, com "ver mais" no fim. Some em silêncio
// enquanto o back não existe: o hub avisa.
export function TurmaFeed({ turmaId }: { turmaId: string }) {
  const { data, isPending, isError, hasNextPage, fetchNextPage, isFetchingNextPage } = useTurmaFeed(turmaId);

  if (isPending) return <Skeleton className="h-96 w-full" aria-busy="true" />;
  if (isError) {
    return (
      <Panel title="Feed da turma">
        <p className="text-text-3 px-4 py-10 text-center text-sm">O feed ainda não está disponível nesta turma.</p>
      </Panel>
    );
  }

  const items: TurmaFeedItem[] = data.pages.flatMap((page) => page.items);
  // Agrupa mantendo a ordem: um cabeçalho por dia.
  const groups: { label: string; items: TurmaFeedItem[] }[] = [];
  for (const item of items) {
    const label = dayLabel(item.at);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }

  return (
    <Panel title="Feed da turma" count={items.length}>
      {items.length === 0 ? (
        <p className="text-text-3 px-4 py-10 text-center text-sm">Nada aconteceu ainda. O primeiro deploy da turma aparece aqui.</p>
      ) : (
        <div className="flex flex-col px-4 pb-2">
          {groups.map((group) => (
            <Fragment key={group.label}>
              <h3 className="label text-text-3 border-border sticky top-0 border-b bg-(--card) py-2.5 text-mini">{group.label}</h3>
              <ul className="divide-border flex flex-col divide-y">
                {group.items.map((item) => (
                  <FeedItem key={item.id} item={item} />
                ))}
              </ul>
            </Fragment>
          ))}
          {hasNextPage && (
            <div className="flex justify-center py-4">
              <Button variant="outline" size="sm" onClick={() => fetchNextPage()} disabled={isFetchingNextPage} aria-busy={isFetchingNextPage}>
                {isFetchingNextPage && <Spinner />}
                Ver mais
              </Button>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
