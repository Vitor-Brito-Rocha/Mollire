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
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) return;
    setSupported(true);
    getPushSubscriptionState().then((state) => setSubscribed(state === "subscribed"));
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
