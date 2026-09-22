import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Spinner } from "@/shared/ui/spinner";

// A nota, só para o professor: um campo curto de 0 a 10 e o botão de salvar.
export function GradeField({ value, pending, onSave }: { value: number | null; pending: boolean; onSave: (grade: number) => void }) {
  const [draft, setDraft] = useState(value === null ? "" : String(value));
  const parsed = Number(draft.replace(",", "."));
  const valid = draft.trim() !== "" && Number.isFinite(parsed) && parsed >= 0 && parsed <= 10;
  const changed = valid && parsed !== value;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (changed) onSave(Math.round(parsed * 100) / 100);
      }}
      className="flex items-center gap-2"
    >
      <label htmlFor={`grade-${value ?? "new"}`} className="label text-text-3 text-micro">
        Nota
      </label>
      <Input
        id={`grade-${value ?? "new"}`}
        type="number"
        inputMode="decimal"
        min={0}
        max={10}
        step={0.5}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        aria-invalid={draft !== "" && !valid}
        className="h-9 w-20 font-mono text-sm"
      />
      <Button type="submit" size="sm" variant="outline" disabled={!changed || pending} aria-busy={pending}>
        {pending && <Spinner />}
        Salvar
      </Button>
    </form>
  );
}
