"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError, type CurrentUser } from "@/lib/api";

const GITHUB_INSTALL_URL = `https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_SLUG}/installations/new`;

type GithubAccount = {
  installation_id: string;
  account_login: string;
  account_avatar_url: string;
  account_type: string;
  repository_selection: string;
};

// O handle é a única identidade que aparece em público (galeria, e depois
// comentários). O e-mail fica aqui, só para o próprio dono ver.
const HANDLE_RULE = /^[a-z0-9][a-z0-9._-]{1,18}[a-z0-9]$/;

export default function ProfilePage() {
  return (
    <Suspense>
      <Profile />
    </Suspense>
  );
}

function Profile() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [handle, setHandle] = useState("");
  const [saving, setSaving] = useState(false);
  const [githubAccounts, setGithubAccounts] = useState<GithubAccount[]>([]);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<CurrentUser>("/users/me")
      .then((me) => {
        setUser(me);
        setHandle(me.handle ?? "");
        if (me.github_connected) {
          api.get<GithubAccount[]>("/github/accounts").then(setGithubAccounts).catch(() => {});
        }
      })
      .catch(() => toast.error("Não foi possível carregar seu perfil"));
  }, []);

  useEffect(() => {
    const github = searchParams.get("github");
    if (github === "conectado") {
      toast.success("GitHub conectado com sucesso");
      setUser((prev) => (prev ? { ...prev, github_connected: true } : prev));
      api.get<GithubAccount[]>("/github/accounts").then(setGithubAccounts).catch(() => {});
      router.replace("/perfil");
    } else if (github === "erro") {
      toast.error(searchParams.get("msg") ?? "Erro ao conectar GitHub");
      router.replace("/perfil");
    }
  }, [searchParams, router]);

  async function handleDisconnect(installationId: string) {
    setDisconnecting(installationId);
    try {
      await api.delete(`/github/install/${installationId}`);
      const remaining = githubAccounts.filter((a) => a.installation_id !== installationId);
      setGithubAccounts(remaining);
      if (remaining.length === 0) {
        setUser((prev) => (prev ? { ...prev, github_connected: false } : prev));
      }
      toast.success("Conta GitHub desconectada");
    } catch {
      toast.error("Erro ao desconectar GitHub");
    } finally {
      setDisconnecting(null);
    }
  }

  const valid = HANDLE_RULE.test(handle);
  const dirty = !!user && handle !== (user.handle ?? "");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!valid) return;
    setSaving(true);
    try {
      const updated = await api.patch<CurrentUser>("/users/me", { handle });
      setUser(updated);
      setHandle(updated.handle ?? "");
      toast.success(`Agora você aparece como ${updated.handle}`);
    } catch (error) {
      toast.error(
        error instanceof ApiError && error.status_code === 409
          ? "Esse apelido já está em uso"
          : error instanceof ApiError
            ? error.message
            : "Erro ao salvar",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-6">
      <div className="flex flex-col gap-2.5">
        <span className="label text-primary flex items-center gap-2.5 tracking-[0.14em]">
          <span className="bg-primary h-0.5 w-[18px]" />
          Conta
        </span>
        <h1 className="font-display text-[34px] leading-[1.1] font-bold">Perfil</h1>
      </div>

      {user === null ? (
        <Skeleton className="h-56 w-full" />
      ) : (
        <>
          <form onSubmit={handleSubmit} className="corners bg-card border-border flex flex-col gap-5 border p-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" value={user.email} readOnly className="font-mono text-sm" />
              <p className="text-text-3 text-xs">Só você vê o e-mail. Ele nunca aparece na galeria.</p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="handle">Apelido público</Label>
              <Input
                id="handle"
                value={handle}
                onChange={(event) => setHandle(event.target.value.toLowerCase())}
                placeholder="seu-apelido"
                autoComplete="username"
                spellCheck={false}
                aria-invalid={handle.length > 0 && !valid}
                className="font-mono text-sm"
                required
              />
              <p className="text-text-3 text-xs">
                3 a 20 caracteres: letras minúsculas, números, ponto, traço ou sublinhado. É assim que você
                aparece na galeria.
              </p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground text-xs">
                Nível <b className="text-foreground">{user.level}</b> ·{" "}
                <span className="font-mono">{user.xp.toLocaleString("pt-BR")} XP</span>
              </span>
              <Button type="submit" size="lg" disabled={saving || !dirty || !valid}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>

          <div className="corners bg-card border-border flex flex-col gap-4 border p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">GitHub</span>
                <p className="text-text-3 text-xs">
                  Conecte sua conta para acessar repositórios privados e receber deploys automáticos no push.
                </p>
              </div>
              <a href={GITHUB_INSTALL_URL}>
                <Button variant="outline" size="sm" type="button">
                  {user.github_connected ? "Adicionar conta" : "Conectar GitHub"}
                </Button>
              </a>
            </div>
            {githubAccounts.length > 0 && (
              <ul className="flex flex-col gap-2">
                {githubAccounts.map((account) => (
                  <li key={account.installation_id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Image
                        src={account.account_avatar_url}
                        alt={account.account_login}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                      <span className="text-sm font-mono">{account.account_login}</span>
                      <span className="text-text-3 text-xs">{account.account_type === "Organization" ? "Organização" : "Pessoal"}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={disconnecting === account.installation_id}
                      onClick={() => handleDisconnect(account.installation_id)}
                    >
                      {disconnecting === account.installation_id ? "Removendo..." : "Remover"}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
