import { useSearchParams } from "react-router";
import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";
import { SegmentedControl } from "@/shared/components/segmented-control";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { GalleryCard } from "../components/gallery-card";
import { useGalleryProjects } from "../hooks/use-gallery";
import type { GalleryFilter } from "../types";

const FILTERS = [
  { label: "Recentes", value: "recentes" },
  { label: "Em destaque", value: "destaque" },
  { label: "Todos", value: "todos" },
] as const satisfies readonly { label: string; value: GalleryFilter }[];

const DEFAULT_FILTER: GalleryFilter = "recentes";

const parseFilter = (value: string | null): GalleryFilter =>
  FILTERS.find((filter) => filter.value === value)?.value ?? DEFAULT_FILTER;

export default function GalleryPage() {
  // The filter lives in the URL (/galeria?filtro=destaque): shareable, and the
  // back button undoes it.
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = parseFilter(searchParams.get("filtro"));
  const { data: projects, isPending, isError, isPlaceholderData, refetch } = useGalleryProjects(filter);

  function changeFilter(next: GalleryFilter) {
    setSearchParams(next === DEFAULT_FILTER ? {} : { filtro: next });
  }

  return (
    <div className="mx-auto flex w-full max-w-(--page) flex-col gap-7">
      <PageHeader
        eyebrow="Comunidade"
        title="Galeria"
        description={
          <span className="block max-w-[56ch]">
            O que a comunidade publicou. Dê uma estrela no que você gostou — é um gesto de apreço, não uma nota.
          </span>
        }
        actions={<SegmentedControl label="Filtro" options={FILTERS} value={filter} onChange={changeFilter} />}
      />

      {isPending ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[268px] w-full" />
          ))}
        </div>
      ) : isError && !projects ? (
        <EmptyState action={<Button variant="outline" onClick={() => refetch()}>Tentar de novo</Button>}>
          Não foi possível carregar a galeria.
        </EmptyState>
      ) : projects && projects.length === 0 ? (
        <EmptyState>Nenhum projeto publicado ainda.</EmptyState>
      ) : (
        <div
          className={
            "grid gap-5 transition-opacity sm:grid-cols-2 xl:grid-cols-3 " + (isPlaceholderData ? "opacity-50" : "")
          }
          aria-busy={isPlaceholderData}
        >
          {projects?.map((project, index) => (
            <GalleryCard key={project.id} project={project} featured={index === 0} />
          ))}
        </div>
      )}
    </div>
  );
}
