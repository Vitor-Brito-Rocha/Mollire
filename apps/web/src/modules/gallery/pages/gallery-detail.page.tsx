import { Link } from "react-router";
import { EmptyState } from "@/shared/components/empty-state";
import { BackLink } from "@/shared/components/page-header";
import { useRequiredParam } from "@/shared/hooks/use-required-param";
import { ApiError } from "@/shared/lib/http";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { CommentsSection } from "../components/comments-section";
import { ProjectCrew } from "../components/project-crew";
import { ProjectFacts } from "../components/project-facts";
import { ProjectStarButton } from "../components/project-star-button";
import { SitePreview } from "../components/site-preview";
import { TierBadge } from "../components/tier-badge";
import { useGalleryProject } from "../hooks/use-gallery";
import { tierFor } from "../lib/tiers";

export default function GalleryDetailPage() {
  const slug = useRequiredParam("slug");
  const { data: project, isPending, error, refetch } = useGalleryProject(slug);

  const backToGallery = <BackLink to="/galeria">Galeria</BackLink>;

  if (isPending) {
    return (
      <div className="mx-auto flex w-full max-w-(--page) flex-col gap-6" aria-busy="true">
        {backToGallery}
        <div className="grid gap-8 xl:grid-cols-3">
          <Skeleton className="h-[420px] w-full xl:col-span-2" />
          <Skeleton className="h-[320px] w-full" />
        </div>
      </div>
    );
  }

  if (!project) {
    const missing = error instanceof ApiError && error.status_code === 404;
    return (
      <div className="mx-auto flex w-full max-w-(--page) flex-col gap-6">
        {backToGallery}
        {missing ? (
          <EmptyState
            className="py-16"
            action={<Button size="lg" nativeButton={false} render={<Link to="/galeria">Voltar à galeria</Link>} />}
          >
            Projeto não encontrado. Ou ele não existe, ou o dono ainda não publicou na galeria.
          </EmptyState>
        ) : (
          <EmptyState
            className="py-16"
            action={<Button variant="outline" onClick={() => refetch()}>Tentar de novo</Button>}
          >
            Erro ao carregar o projeto.
          </EmptyState>
        )}
      </div>
    );
  }

  const tier = tierFor(project.stars);

  return (
    <div className="mx-auto flex w-full max-w-(--page) flex-col gap-6">
      {backToGallery}

      <div className="grid gap-8 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <SitePreview project={project} />
          <CommentsSection slug={slug} count={project.comments} />
        </div>

        <aside className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            {tier && <TierBadge tier={tier} />}
            <h1 className="font-display text-title-lg font-bold">{project.name}</h1>
            <span className="text-muted-foreground text-sm">
              por{" "}
              <Link to={`/u/${project.author}`} className="hover:text-foreground transition-colors">
                {project.author}
              </Link>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!project.is_owner && (
              <ProjectStarButton
                slug={project.slug}
                name={project.name}
                stars={project.stars}
                starred={project.starred_by_viewer}
              />
            )}
            <Button
              variant="outline"
              size="lg"
              nativeButton={false}
              render={
                <a href={project.url} target="_blank" rel="noreferrer">
                  Abrir site
                </a>
              }
            />
          </div>
          {project.is_owner && (
            <p className="text-text-3 text-xs">
              Este projeto é seu — quem dá estrela é a comunidade.{" "}
              <Link
                to={`/projects/${project.slug}`}
                className="text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                Gerenciar
              </Link>
            </p>
          )}

          <ProjectFacts project={project} />
          <ProjectCrew members={project.members} />
        </aside>
      </div>
    </div>
  );
}
