import { invalidateSession, useCurrentUser } from "@/modules/auth";
import { GithubConnectionCard } from "@/modules/github";
import { PageHeader } from "@/shared/components/page-header";
import { Skeleton } from "@/shared/ui/skeleton";
import { ProfileForm } from "../components/profile-form";
import { useGithubReturnNotice } from "../hooks/use-github-return-notice";

// A conta de quem está logado: apelido público e a conexão com o GitHub.
export default function PerfilPage() {
  const { user } = useCurrentUser();
  useGithubReturnNotice();

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-6">
      <PageHeader eyebrow="Conta" title="Perfil" />

      {user === null ? (
        <Skeleton className="h-56 w-full" aria-busy="true" />
      ) : (
        <>
          <ProfileForm user={user} />
          {/* `github_connected` is part of the session user: refresh it when an account is removed. */}
          <GithubConnectionCard connected={user.github_connected} onDisconnected={invalidateSession} />
        </>
      )}
    </div>
  );
}
