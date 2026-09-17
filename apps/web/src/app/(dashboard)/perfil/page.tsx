"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError, type CurrentUser } from "@/lib/api";

// O handle é a única identidade que aparece em público (galeria, e depois
// comentários). O e-mail fica aqui, só para o próprio dono ver.
const HANDLE_RULE = /^[a-z0-9][a-z0-9._-]{1,18}[a-z0-9]$/;

export default function ProfilePage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [handle, setHandle] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<CurrentUser>("/users/me")
      .then((me) => {
        setUser(me);
        setHandle(me.handle ?? "");
      })
      .catch(() => toast.error("Não foi possível carregar seu perfil"));
  }, []);

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
      )}
    </div>
  );
}
