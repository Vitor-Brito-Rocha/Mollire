import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Skeleton } from "@/shared/ui/skeleton";
import { http, ApiError } from "@/shared/lib/http";
import type { InviteMemberResponse, MembersList } from "../types";

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

// Quem trabalha no projeto. Membros veem a lista; só o dono convida, remove e
// enxerga os convites pendentes (que carregam e-mail).
export function ProjectMembers({ slug }: { slug: string }) {
  const [data, setData] = useState<MembersList | null>(null);
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  function reload() {
    return http
      .get<MembersList>(`/projects/${slug}/members`)
      .then(setData)
      .catch(() => undefined);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só o slug importa
  }, [slug]);

  async function invite(event: FormEvent) {
    event.preventDefault();
    setInviting(true);
    try {
      const result = await http.post<InviteMemberResponse>(`/projects/${slug}/invitations`, { email });
      toast.success(
        result.status === "added"
          ? `${result.member.handle} entrou no projeto`
          : `Convite criado — ${result.invitation.email} entra no primeiro login`,
      );
      setEmail("");
      await reload();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Erro ao convidar");
    } finally {
      setInviting(false);
    }
  }

  async function remove(userId: string, handle: string) {
    try {
      await http.delete(`/projects/${slug}/members/${userId}`);
      toast.success(`${handle} removido do projeto`);
      await reload();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Erro ao remover");
    }
  }

  async function revoke(id: string) {
    try {
      await http.delete(`/projects/${slug}/invitations/${id}`);
      await reload();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Erro ao cancelar convite");
    }
  }

  if (data === null) return <Skeleton className="h-40 w-full" />;

  const isOwner = data.my_role === "OWNER";

  return (
    <section className="corners bg-card border-border flex flex-col border">
      <h2 className="label border-border flex items-center gap-2 border-b px-4 py-3">
        Membros
        <span className="text-text-3 font-mono text-xs tracking-normal normal-case">{data.members.length}</span>
      </h2>

      <ul className="flex flex-col">
        {data.members.map((member) => (
          <li key={member.user_id} className="border-border flex items-center gap-3 border-b px-4 py-2.5">
            <span className="hex bg-raised font-display text-muted-foreground grid size-7 shrink-0 place-items-center text-[11px] font-bold uppercase">
              {member.handle.charAt(0)}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm">{member.handle}</span>
            <span className="label text-text-3 text-[9.5px]">{member.role === "OWNER" ? "dono" : "membro"}</span>
            {isOwner && member.role !== "OWNER" && (
              <button
                type="button"
                onClick={() => remove(member.user_id, member.handle)}
                className="text-text-3 hover:text-destructive text-xs underline underline-offset-4"
              >
                remover
              </button>
            )}
          </li>
        ))}
        {isOwner &&
          data.invitations.map((invitation) => (
            <li key={invitation.id} className="border-border flex items-center gap-3 border-b px-4 py-2.5">
              <span className="hex bg-raised text-text-3 grid size-7 shrink-0 place-items-center text-[11px]">?</span>
              <span className="text-muted-foreground min-w-0 flex-1 truncate font-mono text-xs">{invitation.email}</span>
              <span className="label text-primary text-[9.5px]">pendente</span>
              <button
                type="button"
                onClick={() => revoke(invitation.id)}
                className="text-text-3 hover:text-destructive text-xs underline underline-offset-4"
                title={`Expira em ${dateFmt.format(new Date(invitation.expires_at))}`}
              >
                cancelar
              </button>
            </li>
          ))}
      </ul>

      {isOwner && (
        <form onSubmit={invite} className="flex flex-col gap-2 p-4">
          <Label htmlFor="invite-email">Convidar por e-mail</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="pessoa@exemplo.com"
              required
            />
            <Button type="submit" size="lg" disabled={inviting}>
              {inviting ? "Enviando..." : "Convidar"}
            </Button>
          </div>
          <p className="text-text-3 text-xs">
            Quem já tem conta entra na hora. Quem não tem, entra no primeiro login — o convite vale 14 dias.
          </p>
        </form>
      )}
    </section>
  );
}
