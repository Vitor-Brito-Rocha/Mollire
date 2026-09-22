import { invalidateSession, useCurrentUser } from "@/modules/auth";
import { GithubConnectionCard } from "@/modules/github";
import { PageHeader } from "@/shared/components/page-header";
import { Skeleton } from "@/shared/ui/skeleton";
import { AccountPanel } from "../components/account-panel";
import { AppearancePanel } from "../components/appearance-panel";
import { NotificationsPanel } from "../components/notifications-panel";
import { SessionPanel } from "../components/session-panel";
import { useGithubReturnNotice } from "../hooks/use-github-return-notice";

// A conta e as preferências: o que o menu da conta guardava, agora com espaço
// para explicar cada coisa. O perfil (/perfil) é o jogador; aqui é a máquina.
export default function ConfiguracoesPage() {
  const { user } = useCurrentUser();
  useGithubReturnNotice();

  return (
    <div className="mx-auto flex w-full max-w-(--page-narrow) flex-col gap-7">
      <PageHeader
        eyebrow="Conta"
        title="Configurações"
        description="Sua conta, a conexão com o GitHub e como o Mollire se comporta para você."
      />

      {user === null ? (
        <Skeleton className="h-56 w-full" aria-busy="true" />
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-col gap-6">
            <AccountPanel user={user} />
            {/* `github_connected` faz parte do usuário da sessão: atualiza quando uma conta sai. */}
            <GithubConnectionCard connected={user.github_connected} onDisconnected={invalidateSession} />
          </div>
          <div className="flex flex-col gap-6">
            <AppearancePanel />
            <NotificationsPanel />
            <SessionPanel />
          </div>
        </div>
      )}
    </div>
  );
}
