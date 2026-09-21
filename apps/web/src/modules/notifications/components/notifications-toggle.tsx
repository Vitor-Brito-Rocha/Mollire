import { Label } from "@/shared/ui/label";
import { Spinner } from "@/shared/ui/spinner";
import { Switch } from "@/shared/ui/switch";
import { usePushSubscription } from "../hooks/use-push-subscription";

export function NotificationsToggle() {
  const { supported, subscribed, isPending, setSubscribed } = usePushSubscription();

  if (!supported) return null;

  return (
    <div className="flex items-center gap-2">
      <Switch id="push-toggle" checked={subscribed} disabled={isPending} onCheckedChange={setSubscribed} />
      <Label htmlFor="push-toggle" className="text-sm font-normal">
        Notificações
      </Label>
      {isPending && <Spinner />}
    </div>
  );
}
