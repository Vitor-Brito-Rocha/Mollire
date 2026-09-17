import { api } from "./api";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  // A plain `new Uint8Array(length)` (not .from()/a spread) is what TS infers
  // as backed by a concrete ArrayBuffer, which is what PushManager's
  // applicationServerKey (BufferSource) requires.
  const array = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    array[i] = rawData.charCodeAt(i);
  }
  return array;
}

export function isPushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

export async function getPushSubscriptionState(): Promise<"subscribed" | "unsubscribed"> {
  // register(), not getRegistration(): the latter can miss a registration
  // that exists but hasn't been resolved for this page load yet, silently
  // reporting "unsubscribed" even though the browser already has one.
  // register() is idempotent — the browser hands back the existing
  // registration for this scope+script instead of installing a new one.
  const registration = await navigator.serviceWorker.register("/sw.js");
  const subscription = await registration.pushManager.getSubscription();
  return subscription ? "subscribed" : "unsubscribed";
}

// Requires an explicit user gesture (a click) — browsers block auto-prompting
// notification permission on page load.
export async function subscribeToPush(): Promise<void> {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Permissão de notificação negada");
  }

  const registration = await navigator.serviceWorker.register("/sw.js");
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
  });

  const json = subscription.toJSON();
  await api.post("/notifications/subscribe", {
    endpoint: json.endpoint,
    p256dh: json.keys?.p256dh,
    auth: json.keys?.auth,
    user_agent: navigator.userAgent,
  });
}

export async function unsubscribeFromPush(): Promise<void> {
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;

  await api.delete("/notifications/subscribe", { endpoint: subscription.endpoint });
  await subscription.unsubscribe();
}
