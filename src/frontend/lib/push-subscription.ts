import { apiFetch } from "./api-client";

const PUBLIC_VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return new Uint8Array(rawData.length).map((_, i) => rawData.charCodeAt(i));
}

export async function isPushSupported(): Promise<boolean> {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    PUBLIC_VAPID_KEY.length > 0
  );
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (existing) return existing;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY) as unknown as BufferSource,
    });

    await apiFetch("/notifications/push/subscribe", {
      method: "POST",
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        p256dh_key: arrayBufferToBase64(subscription.getKey("p256dh")!),
        auth_key: arrayBufferToBase64(subscription.getKey("auth")!),
        user_agent: navigator.userAgent,
      }),
    });

    return subscription;
  } catch (err) {
    console.error("Push subscription failed:", err);
    return null;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return true;

    await apiFetch(`/notifications/push/subscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`, {
      method: "DELETE",
    });

    await subscription.unsubscribe();
    return true;
  } catch (err) {
    console.error("Push unsubscription failed:", err);
    return false;
  }
}

export async function getPushPermissionState(): Promise<NotificationPermission> {
  if (typeof Notification === "undefined") return "denied";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof Notification === "undefined") return "denied";
  const permission = await Notification.requestPermission();
  return permission;
}

export async function getPushSubscriptions(): Promise<any[]> {
  return apiFetch("/notifications/push/subscriptions");
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
