import { useState, type FormEvent } from "react";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { InlineAction } from "@/shared/components/inline-action";
import { Panel } from "@/shared/components/panel";
import { StatusChip } from "@/shared/components/status-chip";
import { SubmitButton } from "@/shared/components/submit-button";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Spinner } from "@/shared/ui/spinner";
import { useAddGroup, useJoinGroup, useLeaveGroup, useRemoveGroup } from "../hooks/use-turma-mutations";
import { copyText, inviteLink } from "../lib/invite";
import type { TurmaDetail } from "../types";

// Os grupos da turma. Aluno escolhe o seu (ou troca); professor cria e
// remove. Cada linha mostra quantos cabem e, quando o back gera o código do
// grupo, um link de convite que já entra na turma e no grupo.
export function GroupsPanel({ turma }: { turma: TurmaDetail }) {
  const canManage = turma.my_role === "PROFESSOR";
  const addGroup = useAddGroup(turma.id);
  const removeGroup = useRemoveGroup(turma.id);
  const joinGroup = useJoinGroup(turma.id);
  const leaveGroup = useLeaveGroup(turma.id);
  const [name, setName] = useState("");
  const [maxSize, setMaxSize] = useState("4");
  const [removing, setRemoving] = useState<{ id: string; name: string } | null>(null);

  function handleAdd(event: FormEvent) {
    event.preventDefault();
    const size = Number(maxSize);
    if (!name.trim() || !Number.isInteger(size) || size < 1) return;
    addGroup.mutate({ name: name.trim(), max_size: size }, { onSuccess: () => setName("") });
  }

  return (
    <Panel title="Grupos" count={turma.groups.length}>
      {turma.groups.length === 0 ? (
        <p className="text-text-3 px-4 py-5 text-sm">
          {canManage ? "Nenhum grupo ainda. Crie o primeiro abaixo." : "O professor ainda não criou grupos."}
        </p>
      ) : (
        <ul className="flex flex-col">
          {turma.groups.map((group) => {
            const mine = group.id === turma.my_group_id;
            const full = group.members_count >= group.max_size;
            const pct = Math.min(100, Math.round((group.members_count / group.max_size) * 100));
            return (
              <li key={group.id} className={cn("border-border flex items-center gap-3 border-b px-4 py-3", mine && "bg-primary/6")}>
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">{group.name}</span>
                    {mine && <StatusChip tone="accent">seu grupo</StatusChip>}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="bg-raised h-1 w-24 overflow-hidden">
                      <span className={cn("block h-full", full ? "bg-gold" : "bg-primary")} style={{ width: `${pct}%` }} />
                    </span>
                    <span className="text-text-3 font-mono text-xs tabular-nums">
                      {group.members_count}/{group.max_size}
                    </span>
                    {group.code && (canManage || mine) && (
                      <InlineAction
                        onClick={() => copyText(inviteLink(group.code ?? ""), `Link do ${group.name} copiado`, "Não foi possível copiar. O link é")}
                        title="Um link que entra na turma e neste grupo"
                      >
                        link
                      </InlineAction>
                    )}
                  </span>
                </span>
                {canManage ? (
                  <InlineAction destructive onClick={() => setRemoving({ id: group.id, name: group.name })} disabled={removeGroup.isPending}>
                    remover
                  </InlineAction>
                ) : mine ? (
                  <Button variant="outline" size="sm" onClick={() => leaveGroup.mutate()} disabled={leaveGroup.isPending}>
                    {leaveGroup.isPending && <Spinner />}
                    Sair
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => joinGroup.mutate(group.id)}
                    disabled={full || joinGroup.isPending}
                    aria-busy={joinGroup.isPending && joinGroup.variables === group.id}
                  >
                    {joinGroup.isPending && joinGroup.variables === group.id && <Spinner />}
                    {full ? "Cheio" : "Entrar"}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {canManage && (
        <form onSubmit={handleAdd} className="flex flex-col gap-2 p-4">
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nome do grupo"
              aria-label="Nome do grupo"
              maxLength={60}
              className="min-w-0 flex-1"
              required
            />
            <Input
              type="number"
              value={maxSize}
              onChange={(event) => setMaxSize(event.target.value)}
              min={1}
              max={200}
              aria-label="Tamanho máximo"
              className="w-20 font-mono"
              required
            />
          </div>
          <SubmitButton pending={addGroup.isPending} pendingLabel="Criando…" disabled={!name.trim()}>
            Criar grupo
          </SubmitButton>
          <p className="text-text-3 text-xs">Quem está num grupo removido fica sem grupo, e escolhe outro.</p>
        </form>
      )}

      <ConfirmDialog
        open={removing !== null}
        title={removing ? `Remover o grupo ${removing.name}?` : ""}
        description="Os alunos e os projetos dele ficam sem grupo; nada é apagado."
        confirmLabel="Remover"
        pending={removeGroup.isPending}
        onCancel={() => setRemoving(null)}
        onConfirm={() => removing && removeGroup.mutate(removing.id, { onSettled: () => setRemoving(null) })}
      />
    </Panel>
  );
}
