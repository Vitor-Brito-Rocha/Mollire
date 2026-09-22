import { usePushSubscription } from "@/modules/notifications";
import { Panel } from "@/shared/components/panel";
import { Spinner } from "@/shared/ui/spinner";
import { Switch } from "@/shared/ui/switch";

// Aviso do navegador quando um deploy termina. Só o interruptor: o pedido de
// permissão é do navegador, e a assinatura fica registrada no back.
export function NotificationsPanel() {
  const push = usePushSubscription();

  return (
    <Panel title="Notificações">
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="flex flex-col gap-1">
          <span id="push-label" className="text-sm font-medium">
            Deploy terminou
          </span>
          <p className="text-text-3 text-xs">
            Um aviso do navegador quando um deploy seu publica ou falha, mesmo com o Mollire fechado.
          </p>
        </div>
        {push.supported ? (
          <span className="flex shrink-0 items-center gap-2 pt-0.5">
            {push.isPending && <Spinner className="size-3" />}
            <Switch
              checked={push.subscribed}
              onCheckedChange={(checked) => push.setSubscribed(checked)}
              disabled={push.isPending}
              aria-labelledby="push-label"
            />
          </span>
        ) : (
          <span className="text-text-3 shrink-0 text-xs">Este navegador não suporta</span>
        )}
      </div>
    </Panel>
  );
}
