import { Panel } from "@/shared/components/panel";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Spinner } from "@/shared/ui/spinner";
import { useDisconnectGithub, useGithubAccounts } from "../hooks/use-github";
import { githubInstallUrl } from "../lib/install-url";

// Connect / manage the GitHub App installations. `connected` comes from the
// caller (it is part of the session user), so this module needs no session.
export function GithubConnectionCard({
  connected,
  onDisconnected,
}: {
  connected: boolean;
  // Called after an account is removed, e.g. to refresh what the session says.
  onDisconnected?: () => void;
}) {
  const { data: accounts, isLoading } = useGithubAccounts(connected);
  const disconnect = useDisconnectGithub();

  return (
    <Panel className="gap-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">GitHub</span>
          <p className="text-text-3 text-xs">
            Conecte sua conta para acessar repositórios privados e receber deploys automáticos no push.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<a href={githubInstallUrl()}>{connected ? "Adicionar conta" : "Conectar GitHub"}</a>}
        />
      </div>

      {isLoading && <Skeleton className="h-6 w-full" />}

      {accounts && accounts.length > 0 && (
        <ul className="flex flex-col gap-2">
          {accounts.map((account) => {
            const removing = disconnect.isPending && disconnect.variables === account.installation_id;
            return (
              <li key={account.installation_id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <img
                    src={account.account_avatar_url}
                    alt=""
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                  <span className="font-mono text-sm">{account.account_login}</span>
                  <span className="text-text-3 text-xs">
                    {account.account_type === "Organization" ? "Organização" : "Pessoal"}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={disconnect.isPending}
                  aria-busy={removing}
                  onClick={() => disconnect.mutate(account.installation_id, { onSuccess: onDisconnected })}
                >
                  {removing && <Spinner />}
                  {removing ? "Removendo…" : "Remover"}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
