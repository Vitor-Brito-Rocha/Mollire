import { useState, type FormEvent } from "react";
import type { CurrentUser } from "@/modules/auth";
import { FormField } from "@/shared/components/form-field";
import { Panel } from "@/shared/components/panel";
import { SubmitButton } from "@/shared/components/submit-button";
import { formatNumber } from "@/shared/lib/format";
import { useUpdateHandle } from "../hooks/use-profile";

// O handle é a única identidade que aparece em público (galeria, comentários).
// O e-mail fica aqui, só para o próprio dono ver.
const HANDLE_RULE = /^[a-z0-9][a-z0-9._-]{1,18}[a-z0-9]$/;

export function ProfileForm({ user }: { user: CurrentUser }) {
  const [handle, setHandle] = useState(user.handle ?? "");
  const updateHandle = useUpdateHandle();

  const valid = HANDLE_RULE.test(handle);
  // Compared with the session user, which the mutation updates on success.
  const dirty = handle !== (user.handle ?? "");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!valid) return;
    updateHandle.mutate(handle, { onSuccess: (updated) => setHandle(updated.handle ?? "") });
  }

  return (
    <Panel className="p-5">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
            galeria.
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground text-xs">
            Nível <b className="text-foreground">{user.level}</b> ·{" "}
            <span className="font-mono">{formatNumber(user.xp)} XP</span>
          </span>
          <SubmitButton size="lg" pending={updateHandle.isPending} pendingLabel="Salvando…" disabled={!dirty || !valid}>
            Salvar
          </SubmitButton>
        </div>
      </form>
    </Panel>
  );
}
