import { useId, useState } from "react";
import { SegmentedControl } from "@/shared/components/segmented-control";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Spinner } from "@/shared/ui/spinner";
import type { GradeInput } from "../types";

const VISIBILITY = [
  { label: "Só o grupo", value: "private" },
  { label: "Toda a turma", value: "public" },
] as const;

type Visibility = (typeof VISIBILITY)[number]["value"];

type GradeFieldProps = {
  value: number | null;
  comment: string | null | undefined;
  commentPublic: boolean | undefined;
  // O back já devolve `grade_comment`: mostra o texto e a escolha de quem lê.
  commentSupported: boolean;
  pending: boolean;
  onSave: (input: GradeInput) => void;
};

// A nota, só para o professor: um campo curto de 0 a 10, o feedback escrito e
// para quem ele fica visível. A nota em si nunca é pública.
export function GradeField({ value, comment, commentPublic, commentSupported, pending, onSave }: GradeFieldProps) {
  const id = useId();
  const [draft, setDraft] = useState(value === null ? "" : String(value));
  const [text, setText] = useState(comment ?? "");
  const [visibility, setVisibility] = useState<Visibility>(commentPublic ? "public" : "private");

  const parsed = Number(draft.replace(",", "."));
  const valid = draft.trim() !== "" && Number.isFinite(parsed) && parsed >= 0 && parsed <= 10;
  const gradeChanged = valid && parsed !== value;
  const commentChanged = commentSupported && (text.trim() !== (comment ?? "") || (visibility === "public") !== (commentPublic ?? false));
  const canSave = valid && (gradeChanged || commentChanged);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSave) return;
    onSave({
      grade: Math.round(parsed * 100) / 100,
      ...(commentSupported ? { comment: text.trim() || null, comment_public: visibility === "public" } : {}),
    });
  }

  const saveButton = (
    <Button type="submit" size="sm" variant="outline" disabled={!canSave || pending} aria-busy={pending}>
      {pending && <Spinner />}
      Salvar
    </Button>
  );

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
      <div className="flex items-center gap-2">
        <label htmlFor={`${id}-grade`} className="label text-text-3 text-micro">
          Nota
        </label>
        <Input
          id={`${id}-grade`}
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
        {!commentSupported && saveButton}
      </div>

      {commentSupported && (
        <>
          <textarea
            id={`${id}-comment`}
            aria-label="Feedback escrito"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Feedback para o grupo (opcional)"
            rows={2}
            maxLength={2000}
            className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 w-full resize-y rounded-lg border bg-transparent px-3 py-2 text-sm leading-relaxed outline-none focus-visible:ring-3"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SegmentedControl
              label="Quem lê o feedback"
              options={VISIBILITY}
              value={visibility}
              onChange={setVisibility}
              className="[&_button]:min-h-8 [&_button]:px-2.5 [&_button]:text-micro"
            />
            {saveButton}
          </div>
        </>
      )}
    </form>
  );
}
