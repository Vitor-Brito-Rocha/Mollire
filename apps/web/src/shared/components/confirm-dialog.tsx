import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  // O rótulo do botão que confirma ("Remover", "Apagar").
  confirmLabel: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

// A pergunta antes de uma ação que não volta: remover membro, apagar variável,
// apagar comentário. Uma só para o app inteiro, com o mesmo peso e as mesmas
// palavras. Escape e o clique fora cancelam.
export function ConfirmDialog({ open, title, description, confirmLabel, pending, onConfirm, onCancel }: ConfirmDialogProps) {
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
          <div className="flex flex-col gap-2">
            <Dialog.Title className="font-display text-heading font-bold">{title}</Dialog.Title>
            {description && (
              <Dialog.Description className="text-muted-foreground text-sm leading-relaxed">{description}</Dialog.Description>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Dialog.Close render={<Button variant="outline" size="lg" disabled={pending} />}>Cancelar</Dialog.Close>
            <Button variant="destructive" size="lg" onClick={onConfirm} disabled={pending} aria-busy={pending}>
              {pending && <Spinner />}
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
