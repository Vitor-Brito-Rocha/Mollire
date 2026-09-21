import { invalidateSession, useCurrentUser } from "@/modules/auth";
import { GithubConnectionCard } from "@/modules/github";
import { LevelPanel, useProjects } from "@/modules/projects";
import { PageHeader } from "@/shared/components/page-header";
import { Skeleton } from "@/shared/ui/skeleton";
import { ProfileForm } from "../components/profile-form";
import { useGithubReturnNotice } from "../hooks/use-github-return-notice";

// A conta de quem está logado: apelido público, a conexão com o GitHub e o
// seu nível — o mesmo painel do dashboard, com os mesmos números.
export default function PerfilPage() {
  const { user } = useCurrentUser();
  const { data: projects } = useProjects();
  useGithubReturnNotice();

  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-7">
      <PageHeader eyebrow="Conta" title="Perfil" description="Seu apelido é como a galeria te conhece. O e-mail fica só com você." />

      {user === null ? (
        <Skeleton className="h-56 w-full" aria-busy="true" />
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-col gap-6">
            <ProfileForm user={user} />
            {/* `github_connected` is part of the session user: refresh it when an account is removed. */}
            <GithubConnectionCard connected={user.github_connected} onDisconnected={invalidateSession} />
          </div>
          <LevelPanel user={user} projects={projects ?? []} />
        </div>
      )}
    </div>
  );
}
