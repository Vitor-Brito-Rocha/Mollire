import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/lib/http";
import { isPushSubscribed, isPushSupported, subscribeToPush, unsubscribeFromPush } from "../lib/push";

const SUBSCRIPTION_KEY = ["push-subscription"] as const;

// Whether this browser is subscribed, plus the on/off toggle. `supported` is
// false where Web Push doesn't exist (the toggle then renders nothing).
export function usePushSubscription() {
  const queryClient = useQueryClient();
  const supported = isPushSupported();

  const { data: subscribed = false } = useQuery({
    queryKey: SUBSCRIPTION_KEY,
    queryFn: isPushSubscribed,
    enabled: supported,
    meta: { silent: true },
  });

  const toggle = useMutation({
    mutationFn: async (enable: boolean) => {
      if (!enable) {
        await unsubscribeFromPush();
        return false;
      }
      return subscribeToPush();
    },
    onSuccess: (nowSubscribed, enable) => {
      queryClient.setQueryData(SUBSCRIPTION_KEY, nowSubscribed);
      if (enable && !nowSubscribed) toast.error("Permissão de notificação negada no navegador");
      else toast.success(enable ? "Notificações ativadas" : "Notificações desativadas");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Não foi possível atualizar as notificações")),
    // Handled above, so the global toast doesn't fire twice.
    meta: { silent: true },
  });

  return { supported, subscribed, isPending: toggle.isPending, setSubscribed: (enable: boolean) => toggle.mutate(enable) };
}
