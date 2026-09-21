import { useState, type FormEvent } from "react";
import { InlineAction } from "@/shared/components/inline-action";
import { Panel } from "@/shared/components/panel";
import { SubmitButton } from "@/shared/components/submit-button";
import { formatDayMonth } from "@/shared/lib/format";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";
import { useDeleteEnvVar, useEnvVars, useSaveEnvVar } from "../hooks/use-env-vars";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";

export function ProjectEnvVars({ slug }: { slug: string }) {
  const { data: vars, isPending, isError } = useEnvVars(slug);
  const saveVar = useSaveEnvVar(slug);
  const deleteVar = useDeleteEnvVar(slug);
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  // Variável aguardando confirmação para ser apagada.
  const [removing, setRemoving] = useState<string | null>(null);

  function handleSave(event: FormEvent) {
    event.preventDefault();
    saveVar.mutate(
      { key, value },
      {
        onSuccess: () => {
          setKey("");
          setValue("");
        },
      },
    );
  }

  if (isPending) return <Skeleton className="h-40 w-full" />;
  if (isError) {
    return (
      <Panel title="Variáveis de ambiente">
        <p className="text-text-3 px-4 py-6 text-center text-sm">Não foi possível carregar.</p>
      </Panel>
    );
  }

  return (
    <Panel title="Variáveis de ambiente" count={vars.length > 0 ? vars.length : undefined}>
      {vars.length > 0 && (
        <ul className="flex flex-col">
          {vars.map((v) => (
            <li key={v.key} className="border-border flex items-center gap-3 border-b px-4 py-2.5">
              <span className="min-w-0 flex-1 truncate font-mono text-xs">{v.key}</span>
              <span className="text-text-3 shrink-0 text-xs">{formatDayMonth(v.updated_at)}</span>
              <InlineAction
                destructive
                onClick={() => setRemoving(v.key)}
                pending={deleteVar.isPending && deleteVar.variables === v.key}
                disabled={deleteVar.isPending}
              >
                remover
              </InlineAction>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-2 p-4">
        <div className="flex flex-col gap-2">
          <Input
            value={key}
            onChange={(e) => setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
            placeholder="NOME_DA_VARIAVEL"
            className="font-mono text-xs"
            aria-label="Nome da variável"
            required
          />
          <Input
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="valor"
            className="font-mono text-xs"
            aria-label="Valor"
            required
          />
        </div>
        <SubmitButton size="lg" pending={saveVar.isPending} pendingLabel="Salvando…">
          Salvar variável
        </SubmitButton>
        <p className="text-text-3 text-xs">
          Valores não são exibidos após salvos. Para atualizar, salve novamente com a mesma chave.
        </p>
      </form>
      <ConfirmDialog
        open={removing !== null}
        title={removing ? `Apagar ${removing}?` : ""}
        description="O próximo deploy roda sem essa variável. O valor não pode ser recuperado."
        confirmLabel="Apagar"
        pending={deleteVar.isPending}
        onCancel={() => setRemoving(null)}
        onConfirm={() => removing && deleteVar.mutate(removing, { onSettled: () => setRemoving(null) })}
      />
    </Panel>
  );
}
