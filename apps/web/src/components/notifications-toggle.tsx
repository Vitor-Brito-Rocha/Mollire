"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  getPushSubscriptionState,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push";

export function NotificationsToggle() {
  // isPushSupported() reads `window`/`navigator`, which don't exist during
  // SSR — starting at false keeps the server render and the client's first
  // hydration pass identical (both render null below), then this effect
  // flips it after mount, client-only. Setting state here isn't optional:
  // it's what avoids a hydration mismatch, not something to hoist into the
  // initial render.
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional hydration-safe mount flag, see comment above
    setSupported(true);
    getPushSubscriptionState()
      .then((state) => setSubscribed(state === "subscribed"))
      .catch((error) => console.error("failed to read push subscription state", error));
  }, []);

  async function handleChange(checked: boolean) {
    setLoading(true);
    try {
      if (checked) {
        await subscribeToPush();
        toast.success("Notificações ativadas");
      } else {
        await unsubscribeFromPush();
        toast.success("Notificações desativadas");
      }
      setSubscribed(checked);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar");
    } finally {
      setLoading(false);
    }
  }

  if (!supported) return null;

  return (
    <div className="flex items-center gap-2">
      <Switch
        id="push-toggle"
        checked={subscribed}
        disabled={loading}
        onCheckedChange={handleChange}
      />
      <Label htmlFor="push-toggle" className="text-sm font-normal">
        Notificações
      </Label>
    </div>
  );
}
