import { invalidateSession, useCurrentUser } from "@/modules/auth";
import { GithubConnectionCard } from "@/modules/github";
import { AchievementGrid, XpHistory, useAchievements, useXpHistory } from "@/modules/progress";
import { ProgressPanel, useProjects } from "@/modules/projects";
import { PageHeader } from "@/shared/components/page-header";
import { Skeleton } from "@/shared/ui/skeleton";
import { ProfileForm } from "../components/profile-form";
import { useGithubReturnNotice } from "../hooks/use-github-return-notice";

// A conta de quem está logado: apelido público, a conexão com o GitHub e o
// seu nível — o mesmo painel do dashboard, com os mesmos números.
export default function PerfilPage() {
  const { user } = useCurrentUser();
  const { data: projects } = useProjects();
  const { data: achievements } = useAchievements(user ? "me" : null);
  const { data: xpEvents } = useXpHistory(!!user);
  useGithubReturnNotice();

  return (
    <div className="mx-auto flex w-full max-w-(--page-narrow) flex-col gap-7">
      <PageHeader eyebrow="Conta" title="Perfil" description="Seu apelido é como a galeria te conhece. O e-mail fica só com você." />

      {user === null ? (
        <Skeleton className="h-56 w-full" aria-busy="true" />
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-col gap-6">
            <ProfileForm user={user} />
            {/* `github_connected` is part of the session user: refresh it when an account is removed. */}
            <GithubConnectionCard connected={user.github_connected} onDisconnected={invalidateSession} />
            {achievements && <AchievementGrid achievements={achievements} showLocked />}
          </div>
          <div className="flex flex-col gap-6">
            <ProgressPanel user={user} projects={projects ?? []} />
            {xpEvents && <XpHistory events={xpEvents} />}
          </div>
        </div>
      )}
    </div>
  );
}
