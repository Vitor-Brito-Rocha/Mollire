import { useState, type FormEvent } from "react";
import { FormField } from "@/shared/components/form-field";
import { InlineAction } from "@/shared/components/inline-action";
import { Panel } from "@/shared/components/panel";
import { SubmitButton } from "@/shared/components/submit-button";
import { formatDayMonth } from "@/shared/lib/format";
import { Skeleton } from "@/shared/ui/skeleton";
import { useInviteMember, useMembers, useRemoveMember, useRevokeInvitation } from "../hooks/use-members";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";

// Quem trabalha no projeto. Membros veem a lista; só o dono convida, remove e
// enxerga os convites pendentes (que carregam e-mail).
export function ProjectMembers({ slug }: { slug: string }) {
  const { data, isPending, isError } = useMembers(slug);
  const invite = useInviteMember(slug);
  const removeMember = useRemoveMember(slug);
  const revokeInvitation = useRevokeInvitation(slug);
  const [email, setEmail] = useState("");
  // Membro aguardando confirmação para ser removido.
  const [removing, setRemoving] = useState<{ userId: string; handle: string } | null>(null);

  function handleInvite(event: FormEvent) {
    event.preventDefault();
    invite.mutate(email, { onSuccess: () => setEmail("") });
  }

  if (isPending) return <Skeleton className="h-40 w-full" />;
  if (isError) {
    return (
      <Panel title="Membros">
        <p className="text-text-3 px-4 py-6 text-center text-sm">Não foi possível carregar.</p>
      </Panel>
    );
  }

  const isOwner = data.my_role === "OWNER";

  return (
    <Panel title="Membros" count={data.members.length}>
      <ul className="flex flex-col">
        {data.members.map((member) => (
          <li key={member.user_id} className="border-border flex items-center gap-3 border-b px-4 py-2.5">
            <span className="hex bg-raised font-display text-muted-foreground grid size-7 shrink-0 place-items-center text-mini font-bold uppercase">
              {member.handle.charAt(0)}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm">{member.handle}</span>
            <span className="label text-text-3 text-micro">{member.role === "OWNER" ? "dono" : "membro"}</span>
            {isOwner && member.role !== "OWNER" && (
              <InlineAction
                destructive
                onClick={() => setRemoving({ userId: member.user_id, handle: member.handle })}
                pending={removeMember.isPending && removeMember.variables?.userId === member.user_id}
                disabled={removeMember.isPending}
              >
                remover
              </InlineAction>
            )}
          </li>
        ))}
        {isOwner &&
          data.invitations.map((invitation) => (
            <li key={invitation.id} className="border-border flex items-center gap-3 border-b px-4 py-2.5">
              <span className="hex bg-raised text-text-3 grid size-7 shrink-0 place-items-center text-mini">?</span>
              <span className="text-muted-foreground min-w-0 flex-1 truncate font-mono text-xs">
                {invitation.email}
              </span>
              <span className="label text-primary text-micro">pendente</span>
              <InlineAction
                destructive
                onClick={() => revokeInvitation.mutate(invitation.id)}
                pending={revokeInvitation.isPending && revokeInvitation.variables === invitation.id}
                disabled={revokeInvitation.isPending}
                title={`Expira em ${formatDayMonth(invitation.expires_at)}`}
              >
                cancelar
              </InlineAction>
            </li>
          ))}
      </ul>

      {isOwner && (
        <form onSubmit={handleInvite} className="flex flex-col gap-2 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <FormField
                id="invite-email"
                label="Convidar por e-mail"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="pessoa@exemplo.com"
                required
              />
            </div>
            <SubmitButton size="lg" pending={invite.isPending} pendingLabel="Enviando…">
              Convidar
            </SubmitButton>
          </div>
          <p className="text-text-3 text-xs">
            Quem já tem conta entra na hora. Quem não tem, entra no primeiro login — o convite vale 14 dias.
          </p>
        </form>
      )}
      <ConfirmDialog
        open={removing !== null}
        title={removing ? `Remover ${removing.handle} do projeto?` : ""}
        description="A pessoa perde o acesso na hora. Dá para convidar de novo depois."
        confirmLabel="Remover"
        pending={removeMember.isPending}
        onCancel={() => setRemoving(null)}
        onConfirm={() => removing && removeMember.mutate(removing, { onSettled: () => setRemoving(null) })}
      />
    </Panel>
  );
}
