import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";

type HudDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

// A janela modal do app: superfície com ferragens de canto, título, texto
// opcional e o conteúdo que a tela quiser. Escape e o clique fora fecham.
export function HudDialog({ open, onOpenChange, title, description, children, className }: HudDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => onOpenChange(next)}>
      <Dialog.Portal>
        <Dialog.Backdrop className="bg-background/75 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 fixed inset-0 z-50 transition-opacity duration-(--dur)" />
        <Dialog.Popup
          className={
            "surface corners data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0 fixed top-1/2 left-1/2 z-50 flex w-[min(92vw,480px)] -translate-x-1/2 -translate-y-1/2 flex-col gap-5 p-6 transition-[opacity,transform] duration-(--dur) ease-(--ease) outline-none " +
            (className ?? "")
          }
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <Dialog.Title className="font-display text-heading font-bold">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="text-muted-foreground text-sm leading-relaxed">{description}</Dialog.Description>
              )}
            </div>
            <Dialog.Close
              aria-label="Fechar"
              className="focus-ring text-text-3 hover:text-foreground hover:bg-raised/70 grid size-8 shrink-0 place-items-center transition-colors"
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
