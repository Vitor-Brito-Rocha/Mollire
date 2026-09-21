import { AchievementGrid, useAchievements } from "@/modules/progress";
import { EmptyState } from "@/shared/components/empty-state";
import { useRequiredParam } from "@/shared/hooks/use-required-param";
import { ApiError } from "@/shared/lib/http";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { ActivityHeatmap } from "../components/activity-heatmap";
import { ProfileHeader } from "../components/profile-header";
import { ProfileProjectCard } from "../components/profile-project-card";
import { useUserProfile } from "../hooks/use-profile";
import { Eyebrow } from "@/shared/components/eyebrow";

export default function PublicProfilePage() {
  const handle = useRequiredParam("handle");
  const { data: profile, isPending, error, refetch } = useUserProfile(handle);
  const { data: achievements } = useAchievements(handle);

  return (
    <div className="mx-auto flex w-full max-w-(--page-narrow) flex-col gap-10">
      {isPending ? (
        <div className="flex flex-col gap-10" aria-busy="true">
          <Skeleton className="h-20 w-full max-w-xs" />
          <Skeleton className="h-28 w-full" />
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[220px] w-full" />
            ))}
          </div>
        </div>
      ) : !profile ? (
        error instanceof ApiError && error.status_code === 404 ? (
          <EmptyState className="py-16">
            Perfil não encontrado. Nenhum usuário com o apelido <span className="font-mono">@{handle}</span>.
          </EmptyState>
        ) : (
          <EmptyState
            className="py-16"
            action={<Button variant="outline" onClick={() => refetch()}>Tentar de novo</Button>}
          >
            Erro ao carregar o perfil.
          </EmptyState>
        )
      ) : (
        <>
          <ProfileHeader profile={profile} />
          {achievements && <AchievementGrid achievements={achievements} showLocked={false} />}
          <ActivityHeatmap data={profile.heatmap} />

          <div className="flex flex-col gap-5">
            <Eyebrow as="h2" tone="section">
              Projetos públicos
              <span className="text-text-3 font-mono text-xs tracking-normal normal-case">
                {profile.projects.length}
              </span>
            </Eyebrow>

            {profile.projects.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum projeto publicado ainda.</p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {profile.projects.map((project) => (
                  <ProfileProjectCard key={project.slug} project={project} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
