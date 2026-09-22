import { useState, type FormEvent } from "react";
import { FormField } from "@/shared/components/form-field";
import { HudDialog } from "@/shared/components/hud-dialog";
import { SubmitButton } from "@/shared/components/submit-button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";
import { useAddMilestone, useUpdateMilestone } from "../hooks/use-turma-mutations";
import { dateFromDueAt, dueAtFromDate } from "../lib/milestones";
import type { NewMilestone, TurmaMilestone } from "../types";

type MilestoneDialogProps = {
  turmaId: string;
  // `null` fechado; "new" cria; uma entrega edita.
  target: TurmaMilestone | "new" | null;
  onClose: () => void;
};

// Criar ou editar uma entrega: título, prazo e o que o projeto precisa cumprir.
// Não há botão de "entregar" para o aluno: o back confere sozinho.
export function MilestoneDialog({ turmaId, target, onClose }: MilestoneDialogProps) {
  return (
    <HudDialog
      open={target !== null}
      onOpenChange={(open) => !open && onClose()}
      title={target === "new" || target === null ? "Nova entrega" : "Editar entrega"}
      description="O grupo cumpre a entrega quando o projeto enviado à turma atende ao que você marcar aqui, até o prazo."
    >
      {target !== null && <MilestoneForm key={target === "new" ? "new" : target.id} turmaId={turmaId} milestone={target === "new" ? null : target} onDone={onClose} />}
    </HudDialog>
  );
}

function MilestoneForm({ turmaId, milestone, onDone }: { turmaId: string; milestone: TurmaMilestone | null; onDone: () => void }) {
  const add = useAddMilestone(turmaId);
  const update = useUpdateMilestone(turmaId);
  const [title, setTitle] = useState(milestone?.title ?? "");
  const [description, setDescription] = useState(milestone?.description ?? "");
  const [date, setDate] = useState(milestone ? dateFromDueAt(milestone.due_at) : "");
  const [deployed, setDeployed] = useState(milestone?.requirements.deployed ?? true);
  const [published, setPublished] = useState(milestone?.requirements.published ?? false);
  const [minStars, setMinStars] = useState(milestone?.requirements.min_stars ? String(milestone.requirements.min_stars) : "");
  const pending = add.isPending || update.isPending;

  const stars = Number(minStars);
  const valid = title.trim().length > 0 && date !== "" && (minStars === "" || (Number.isInteger(stars) && stars >= 1));

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!valid) return;
    const body: NewMilestone = {
      title: title.trim(),
      description: description.trim() || null,
      due_at: dueAtFromDate(date),
      requirements: { deployed, published, min_stars: minStars === "" ? null : stars },
    };
    if (milestone) update.mutate({ milestoneId: milestone.id, ...body }, { onSuccess: onDone });
    else add.mutate(body, { onSuccess: onDone });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <FormField
        id="milestone-title"
        label="Título"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Entrega 1: site no ar"
        maxLength={80}
        required
      />
      <div className="flex flex-col gap-2">
        <Label htmlFor="milestone-description">Descrição (opcional)</Label>
        <textarea
          id="milestone-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="O que vale nessa entrega"
          rows={2}
          maxLength={500}
          className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 w-full resize-y rounded-lg border bg-transparent px-3 py-2 text-sm leading-relaxed outline-none focus-visible:ring-3"
        />
      </div>
      <FormField id="milestone-date" label="Prazo" type="date" value={date} onChange={(event) => setDate(event.target.value)} required className="font-mono" />

      <fieldset className="flex flex-col gap-3">
        <legend className="text-caption text-foreground/85 mb-2 font-medium">O projeto precisa estar</legend>
        <label className="flex items-center justify-between gap-3 text-sm">
          No ar (último deploy publicado)
          <Switch checked={deployed} onCheckedChange={setDeployed} />
        </label>
        <label className="flex items-center justify-between gap-3 text-sm">
          Na galeria (público)
          <Switch checked={published} onCheckedChange={setPublished} />
        </label>
        <label className="flex items-center justify-between gap-3 text-sm">
          Com estrelas dos colegas, no mínimo
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            max={999}
            value={minStars}
            onChange={(event) => setMinStars(event.target.value)}
            placeholder="—"
            aria-label="Mínimo de estrelas"
            className="h-9 w-20 font-mono text-sm"
          />
        </label>
      </fieldset>

      <SubmitButton size="lg" pending={pending} pendingLabel="Salvando…" disabled={!valid}>
        {milestone ? "Salvar" : "Criar entrega"}
      </SubmitButton>
    </form>
  );
}
