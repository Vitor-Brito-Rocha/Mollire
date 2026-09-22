import { Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { FormField } from "@/shared/components/form-field";
import { InlineAction } from "@/shared/components/inline-action";
import { PageHeader } from "@/shared/components/page-header";
import { SegmentedControl } from "@/shared/components/segmented-control";
import { SubmitButton } from "@/shared/components/submit-button";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";
import { useCreateTurma } from "../hooks/use-turma-mutations";
import type { TurmaGroupMode } from "../types";

const MODES = [
  { label: "Individual", value: "NONE" },
  { label: "Em grupos", value: "GROUPS" },
] as const satisfies readonly { label: string; value: TurmaGroupMode }[];

type GroupDraft = { key: number; name: string; max_size: string };

let nextKey = 1;
const draftGroup = (index: number): GroupDraft => ({ key: nextKey++, name: `Grupo ${index}`, max_size: "4" });

// Criar uma turma: nome, descrição, pública ou por código, capacidade, e se
// os alunos trabalham sozinhos ou em grupos (com os grupos já desenhados).
export default function TurmaCreatePage() {
  const navigate = useNavigate();
  const createTurma = useCreateTurma();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [capacity, setCapacity] = useState("");
  const [mode, setMode] = useState<TurmaGroupMode>("NONE");
  const [groups, setGroups] = useState<GroupDraft[]>(() => [draftGroup(1), draftGroup(2)]);

  const groupsValid = mode === "NONE" || groups.every((g) => g.name.trim() && Number(g.max_size) >= 1);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !groupsValid) return;
    createTurma.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        is_public: isPublic,
        capacity: capacity.trim() ? Number(capacity) : undefined,
        group_mode: mode,
        groups: mode === "GROUPS" ? groups.map((g) => ({ name: g.name.trim(), max_size: Number(g.max_size) })) : undefined,
      },
      { onSuccess: (turma) => navigate(`/turmas/${turma.id}`) },
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-(--page-narrow) flex-col gap-7">
      <PageHeader
        back={{ to: "/turmas", label: "Turmas" }}
        title="Nova turma"
        description="Você vira o professor dela. A turma ganha um código de entrada na hora, pra você passar pros alunos."
      />

      <form onSubmit={handleSubmit} className="surface flex flex-col gap-6 p-5 md:p-6">
        <FormField
          id="turma-name"
          label="Nome"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Turma 3B — Projetos Web"
          maxLength={100}
          required
        />
        <FormField
          id="turma-description"
          label="Descrição (opcional)"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="O que a turma vai construir"
          maxLength={500}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="turma-public">Turma pública</Label>
              <p className="text-text-3 text-xs">Aparece na lista e qualquer um entra sem código. Privada: só pelo código.</p>
            </div>
            <Switch id="turma-public" checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
          <FormField
            id="turma-capacity"
            label="Limite de alunos (opcional)"
            type="number"
            min={1}
            max={1000}
            value={capacity}
            onChange={(event) => setCapacity(event.target.value)}
            placeholder="sem limite"
            className="font-mono"
          />
        </div>

        <div className="flex flex-col gap-3">
          <Label>Como os alunos trabalham</Label>
          <SegmentedControl label="Modo de grupo" options={MODES} value={mode} onChange={setMode} />
          {mode === "GROUPS" && (
            <div className="border-border flex flex-col gap-2 border-t pt-4">
              <p className="text-text-3 text-xs">Os alunos escolhem um grupo depois de entrar. Dá pra criar e apagar grupos depois também.</p>
              <ul className="flex flex-col gap-2">
                {groups.map((group, index) => (
                  <li key={group.key} className="flex items-center gap-2">
                    <Input
                      value={group.name}
                      onChange={(event) =>
                        setGroups((all) => all.map((g) => (g.key === group.key ? { ...g, name: event.target.value } : g)))
                      }
                      aria-label={`Nome do grupo ${index + 1}`}
                      maxLength={60}
                      className="min-w-0 flex-1"
                      required
                    />
                    <Input
                      type="number"
                      min={1}
                      max={200}
                      value={group.max_size}
                      onChange={(event) =>
                        setGroups((all) => all.map((g) => (g.key === group.key ? { ...g, max_size: event.target.value } : g)))
                      }
                      aria-label={`Tamanho máximo do grupo ${index + 1}`}
                      className="w-20 font-mono"
                      required
                    />
                    <InlineAction
                      destructive
                      onClick={() => setGroups((all) => all.filter((g) => g.key !== group.key))}
                      disabled={groups.length <= 1}
                    >
                      remover
                    </InlineAction>
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => setGroups((all) => [...all, draftGroup(all.length + 1)])}
              >
                <Plus className="size-3.5" />
                Adicionar grupo
              </Button>
            </div>
          )}
        </div>

        <SubmitButton size="lg" pending={createTurma.isPending} pendingLabel="Criando…" disabled={!name.trim() || !groupsValid}>
          Criar turma
        </SubmitButton>
      </form>
    </div>
  );
}
