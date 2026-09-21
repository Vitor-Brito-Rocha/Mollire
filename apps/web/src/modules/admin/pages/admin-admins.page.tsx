import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { StatusChip } from "@/modules/projects";
import { http, ApiError } from "@/shared/lib/http";
import type { AdminsList, InviteAdminResponse } from "../types";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Skeleton } from "@/shared/ui/skeleton";

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

export default function AdminAdminsPage() {
  const [data, setData] = useState<AdminsList | null>(null);
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  function reload() {
    return http.get<AdminsList>("/admin/admins").then(setData);
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setInviting(true);
    try {
      const result = await http.post<InviteAdminResponse>("/admin/admins", { email });
      if (result.status === "already_admin") {
        toast.info(`${result.user.email} já é admin`);
      } else if (result.status === "promoted") {
        toast.success(`${result.user.email} agora é admin`);
      } else {
        toast.success(`Convite criado — ${result.invite.email} vira admin no próximo login`);
      }
      setEmail("");
      await reload();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Erro ao convidar admin");
    } finally {
      setInviting(false);
    }
  }

  const total = data ? data.admins.length + data.pendingInvites.length : 0;

  return (
    <div className="flex flex-col gap-6">
      <section className="corners bg-card border-border flex flex-col gap-4 border p-5">
        <div className="flex flex-col gap-1.5">
          <span className="label text-primary flex items-center gap-2.5 tracking-[0.14em]">
            <span className="bg-primary h-0.5 w-[18px]" />
            Conceder acesso
          </span>
          <p className="text-muted-foreground text-sm">
            Quem já fez login vira admin na hora. Quem nunca entrou fica pendente e vira admin no primeiro
            login. Só concede — nunca remove.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="pessoa@exemplo.com"
              required
            />
          </div>
          <Button type="submit" size="lg" disabled={inviting}>
            {inviting ? "Enviando..." : "Tornar admin"}
          </Button>
        </form>
      </section>

      {data === null ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <section className="corners bg-card border-border flex flex-col border">
          <div className="border-border flex items-center justify-between gap-3 border-b px-4 py-3">
            <h2 className="label flex items-center gap-2">
              Admins
              <span className="text-text-3 font-mono text-xs tracking-normal normal-case">{data.admins.length}</span>
            </h2>
            {data.pendingInvites.length > 0 && (
              <span className="text-muted-foreground text-xs">
                {data.pendingInvites.length === 1
                  ? "1 convite pendente"
                  : `${data.pendingInvites.length} convites pendentes`}
              </span>
            )}
          </div>

          {total === 0 ? (
            <p className="text-muted-foreground px-4 py-10 text-center">Nenhum admin ainda.</p>
          ) : (
            <>
              <div className="label text-text-3 border-border grid grid-cols-12 gap-3 border-b px-4 py-2.5 text-[10px]">
                <span className="col-span-7 sm:col-span-6">E-mail</span>
                <span className="col-span-5 sm:col-span-3">Estado</span>
                <span className="hidden sm:col-span-3 sm:block">Desde</span>
              </div>
              {data.admins.map((admin) => (
                <div
                  key={admin.id}
                  className="border-border grid grid-cols-12 items-center gap-3 border-b px-4 py-3 last:border-b-0"
                >
                  <span className="col-span-7 truncate font-mono text-[13px] sm:col-span-6">{admin.email}</span>
                  <StatusChip tone="good" className="col-span-5 sm:col-span-3">Admin</StatusChip>
                  <span className="text-muted-foreground hidden text-[13px] sm:col-span-3 sm:block">
                    {dateFmt.format(new Date(admin.created_at))}
                  </span>
                </div>
              ))}
              {data.pendingInvites.map((invite) => (
                <div
                  key={invite.email}
                  className="border-border grid grid-cols-12 items-center gap-3 border-b px-4 py-3 last:border-b-0"
                >
                  <span className="col-span-7 truncate font-mono text-[13px] sm:col-span-6">{invite.email}</span>
                  <StatusChip tone="busy" className="col-span-5 sm:col-span-3">Pendente · 1º login</StatusChip>
                  <span className="text-muted-foreground hidden text-[13px] sm:col-span-3 sm:block">
                    convidado em {dateFmt.format(new Date(invite.created_at))}
                  </span>
                </div>
              ))}
            </>
          )}
        </section>
      )}
    </div>
  );
}
