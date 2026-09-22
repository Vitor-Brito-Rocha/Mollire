import { useState, type FormEvent } from "react";
import type { CurrentUser } from "@/modules/auth";
import { useUpdateHandle } from "@/modules/profile";
import { FormField } from "@/shared/components/form-field";
import { Panel } from "@/shared/components/panel";
import { SubmitButton } from "@/shared/components/submit-button";

// O apelido é a única identidade que aparece em público (galeria, comentários).
// O e-mail fica aqui, só para o próprio dono ver.
const HANDLE_RULE = /^[a-z0-9][a-z0-9._-]{1,18}[a-z0-9]$/;

export function AccountPanel({ user }: { user: CurrentUser }) {
  const [handle, setHandle] = useState(user.handle ?? "");
  const updateHandle = useUpdateHandle();

  const valid = HANDLE_RULE.test(handle);
  // Comparado com o usuário da sessão, que a mutação atualiza ao salvar.
  const dirty = handle !== (user.handle ?? "");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!valid) return;
    updateHandle.mutate(handle, { onSuccess: (updated) => setHandle(updated.handle ?? "") });
  }

  return (
    <Panel title="Conta">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-5">
        <div className="flex flex-col gap-2">
          <FormField id="email" label="E-mail" value={user.email} readOnly className="font-mono text-sm" />
          <p className="text-text-3 text-xs">Só você vê o e-mail. Ele nunca aparece na galeria.</p>
        </div>

        <div className="flex flex-col gap-2">
          <FormField
            id="handle"
            label="Apelido público"
            value={handle}
            onChange={(event) => setHandle(event.target.value.toLowerCase())}
            placeholder="seu-apelido"
            autoComplete="username"
            spellCheck={false}
            aria-invalid={handle.length > 0 && !valid}
            className="font-mono text-sm"
            required
          />
          <p className="text-text-3 text-xs">
            3 a 20 caracteres: letras minúsculas, números, ponto, traço ou sublinhado. É assim que você aparece na
            galeria e nos comentários.
          </p>
        </div>

        <div className="flex justify-end">
          <SubmitButton size="lg" pending={updateHandle.isPending} pendingLabel="Salvando…" disabled={!dirty || !valid}>
            Salvar
          </SubmitButton>
        </div>
      </form>
    </Panel>
  );
}
