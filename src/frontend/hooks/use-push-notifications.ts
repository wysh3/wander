"use client";

import { useEffect, useState, useCallback } from "react";
import {
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
  getExistingSubscription,
  getPushPermissionState,
  requestNotificationPermission,
} from "@/lib/push-subscription";

export function usePushNotifications() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const sup = await isPushSupported();
      setSupported(sup);
      if (sup) {
        setPermission(await getPushPermissionState());
        const sub = await getExistingSubscription();
        setSubscribed(!!sub);
      }
      setLoading(false);
    })();
  }, []);

  const subscribe = useCallback(async () => {
    if (!supported) return false;
    const perm = await requestNotificationPermission();
    setPermission(perm);
    if (perm !== "granted") return false;
    const sub = await subscribeToPush();
    setSubscribed(!!sub);
    return !!sub;
  }, [supported]);

  const unsubscribe = useCallback(async () => {
    const ok = await unsubscribeFromPush();
    if (ok) setSubscribed(false);
    return ok;
  }, []);

  return {
    supported,
    permission,
    subscribed,
    loading,
    subscribe,
    unsubscribe,
  };
}
