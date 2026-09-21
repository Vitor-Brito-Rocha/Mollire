import { http } from "@/shared/lib/http";

type PushSubscriptionPayload = {
  endpoint?: string;
  p256dh?: string;
  auth?: string;
  user_agent: string;
};

// Endpoint calls only — they throw ApiError. The browser side lives in lib/push.
export const notificationsApi = {
  subscribe: (payload: PushSubscriptionPayload) => http.post<void>("/notifications/subscribe", payload),
  unsubscribe: (endpoint: string) => http.delete<void>("/notifications/subscribe", { endpoint }),
};
