import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { FormField } from "@/shared/components/form-field";
import { HudDialog } from "@/shared/components/hud-dialog";
import { SubmitButton } from "@/shared/components/submit-button";
import { useJoinByCode } from "../hooks/use-turma-mutations";

// "Entrar com código": o professor passa seis letras, o aluno digita aqui.
export function JoinByCodeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate();
  const join = useJoinByCode();
  const [code, setCode] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    join.mutate(code.trim(), {
      onSuccess: (result) => {
        onOpenChange(false);
        setCode("");
        navigate(`/turmas/${result.turma_id}`);
      },
    });
  }

  return (
    <HudDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Entrar numa turma"
      description="Digite o código que o professor passou. Não importa maiúscula ou minúscula."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField
          id="turma-code"
          label="Código da turma"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="K7XQ2M"
          maxLength={12}
          minLength={4}
          autoComplete="off"
          spellCheck={false}
          className="font-mono text-body-lg tracking-[0.18em] uppercase"
          required
        />
        <SubmitButton size="lg" pending={join.isPending} pendingLabel="Entrando…" disabled={code.trim().length < 4}>
          Entrar
        </SubmitButton>
      </form>
    </HudDialog>
  );
}
