import { FormField } from "@/shared/components/form-field";
import { cn } from "@/shared/lib/utils";
import { Spinner } from "@/shared/ui/spinner";
import type { RootDirState } from "../hooks/use-root-dir-check";

type RootDirFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  state: RootDirState;
};

const FEEDBACK: Record<RootDirState, { text: string; tone: "good" | "bad" | "muted" }> = {
  idle: {
    text: "Deixe vazio se o projeto está na raiz do repositório. Em monorepo, informe a pasta do app, ex.: apps/web.",
    tone: "muted",
  },
  checking: { text: "Procurando a pasta no repositório…", tone: "muted" },
  invalid: { text: 'Use só letras, números, . _ - e /, sem "..".', tone: "bad" },
  exists: { text: "Pasta encontrada no repositório.", tone: "good" },
  missing: { text: "Essa pasta não existe no repositório.", tone: "bad" },
  not_a_directory: { text: "Esse caminho é um arquivo, não uma pasta.", tone: "bad" },
  unverified: {
    text: "Não deu para verificar agora (repositório privado ou provedor fora do ar). Conferimos de novo no deploy.",
    tone: "muted",
  },
};

// A pasta do repositório onde o build roda, com a resposta de "ela existe?" logo abaixo.
export function RootDirField({ id, value, onChange, state }: RootDirFieldProps) {
  const { text, tone } = FEEDBACK[state];
  const invalid = state === "invalid" || state === "missing" || state === "not_a_directory";

  return (
    <div className="flex flex-col gap-2">
      <FormField
        id={id}
        label="Pasta do projeto"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="raiz do repositório"
        className="font-mono text-sm"
        maxLength={200}
        aria-invalid={invalid}
        aria-describedby={`${id}-feedback`}
        autoComplete="off"
        spellCheck={false}
      />
      <p
        id={`${id}-feedback`}
        className={cn(
          "flex items-center gap-2 text-xs",
          tone === "good" && "text-good",
          tone === "bad" && "text-destructive",
          tone === "muted" && "text-text-3",
        )}
      >
        {state === "checking" && <Spinner className="size-3" />}
        {text}
      </p>
    </div>
  );
}
