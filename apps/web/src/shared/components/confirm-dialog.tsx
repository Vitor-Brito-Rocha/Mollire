import { Dialog } from "@base-ui/react/dialog";
import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Spinner } from "@/shared/ui/spinner";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  // O rótulo do botão que confirma ("Remover", "Apagar").
  confirmLabel: string;
  // Para o que é grande demais para um simples "sim": o botão só habilita depois
  // que a pessoa digita este texto (o nome do projeto, por exemplo).
  confirmText?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

// A pergunta antes de uma ação que não volta: remover membro, apagar variável,
// apagar comentário, apagar projeto. Uma só para o app inteiro, com o mesmo peso
// e as mesmas palavras. Escape e o clique fora cancelam.
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  confirmText,
  pending,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next && !pending) onCancel();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="bg-background/75 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 fixed inset-0 z-50 transition-opacity duration-(--dur)" />
        <Dialog.Popup className="surface corners data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0 fixed top-1/2 left-1/2 z-50 flex w-[min(92vw,440px)] -translate-x-1/2 -translate-y-1/2 flex-col gap-5 p-6 transition-[opacity,transform] duration-(--dur) ease-(--ease) outline-none">
          <ConfirmBody
            title={title}
            description={description}
            confirmLabel={confirmLabel}
            confirmText={confirmText}
            pending={pending}
            onConfirm={onConfirm}
          />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Vive dentro do Popup, que só existe enquanto o diálogo está aberto: o texto
// digitado começa vazio a cada abertura, sem efeito para limpar.
function ConfirmBody({
  title,
  description,
  confirmLabel,
  confirmText,
  pending,
  onConfirm,
}: Omit<ConfirmDialogProps, "open" | "onCancel">) {
  const [typed, setTyped] = useState("");
  const confirmed = confirmText === undefined || typed.trim() === confirmText.trim();

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (confirmed && !pending) onConfirm();
      }}
    >
      <div className="flex flex-col gap-2">
        <Dialog.Title className="font-display text-heading font-bold">{title}</Dialog.Title>
        {description && (
          <Dialog.Description className="text-muted-foreground text-sm leading-relaxed">{description}</Dialog.Description>
        )}
      </div>
      {confirmText !== undefined && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="confirm-text">
            Digite <span className="text-foreground font-mono">{confirmText}</span> para confirmar
          </Label>
          <Input
            id="confirm-text"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            disabled={pending}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="font-mono text-xs"
          />
        </div>
      )}
      <div className="flex justify-end gap-3">
        <Dialog.Close render={<Button variant="outline" size="lg" disabled={pending} />}>Cancelar</Dialog.Close>
        <Button type="submit" variant="destructive" size="lg" disabled={pending || !confirmed} aria-busy={pending}>
          {pending && <Spinner />}
          {confirmLabel}
        </Button>
      </div>
    </form>
  );
}
