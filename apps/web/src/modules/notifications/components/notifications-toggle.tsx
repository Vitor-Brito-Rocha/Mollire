import { Bell, BellOff } from "lucide-react";
import { Spinner } from "@/shared/ui/spinner";
import { Switch } from "@/shared/ui/switch";
import { usePushSubscription } from "../hooks/use-push-subscription";

// Uma linha da barra lateral, no mesmo peso dos outros itens: sino, o nome,
// e o interruptor pequeno na ponta. Some onde o navegador não suporta push.
export function NotificationsToggle() {
  const { supported, subscribed, isPending, setSubscribed } = usePushSubscription();

  if (!supported) return null;

  return (
    <div className="label text-muted-foreground flex h-10 items-center gap-3 px-3 text-mini">
      {subscribed ? <Bell className="size-4 shrink-0" /> : <BellOff className="size-4 shrink-0" />}
      <span className="min-w-0 flex-1 truncate">Notificações</span>
      {isPending ? (
        <Spinner className="size-3.5" />
      ) : (
        <Switch
          size="sm"
          aria-label="Notificações de deploy"
          checked={subscribed}
          disabled={isPending}
          onCheckedChange={setSubscribed}
        />
      )}
    </div>
  );
}
