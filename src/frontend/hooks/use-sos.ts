"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { apiFetch } from "@/lib/api-client";

interface SOSAlert {
  type: string;
  sos_id: string;
  user_name: string;
  lat: number;
  lng: number;
  nearest_police_station: string;
  police_phone?: string;
  group_size?: number;
  host_name?: string;
  host_phone?: string;
  timestamp: string;
}

export function useSOS() {
  const { accessToken, user } = useAuthStore();
  const wsRef = useRef<WebSocket | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [activeSOS, setActiveSOS] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  const startPolling = useCallback(() => {
    if (!user?.id) return;
    pollingRef.current = setInterval(async () => {
      try {
        const data = await apiFetch<{ alerts: SOSAlert[] }>(`/sos/${user.id}/poll`);
        if (data.alerts?.length) {
          setAlerts(data.alerts);
        }
      } catch {}
    }, 1000);
  }, [user?.id]);

  const connectWS = useCallback(() => {
    if (!accessToken || !user?.id) return;

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    const wsBase = apiBase.replace(/^http/, "ws");
    const wsUrl = `${wsBase}/sos/${user.id}?token=${accessToken}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setWsConnected(true);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "sos_alert") {
          setAlerts((prev) => [...prev, data]);
        }
      } catch {}
    };
    ws.onclose = () => {
      setWsConnected(false);
      if (!wsRef.current) return;
      setTimeout(connectWS, 5000);
    };
  }, [accessToken, user?.id]);

  useEffect(() => {
    connectWS();
    startPolling();
    return () => {
      wsRef.current?.close();
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [connectWS, startPolling]);

  const triggerSOS = useCallback(async (lat?: number, lng?: number) => {
    try {
      const data = await apiFetch<{ sos_id: string; notified: boolean }>("/sos/trigger", {
        method: "POST",
        body: JSON.stringify({ lat, lng }),
      });
      setActiveSOS(data.sos_id);
      return data;
    } catch (err) {
      throw err;
    }
  }, []);

  const cancelSOS = useCallback(async () => {
    if (!activeSOS) return;
    try {
      await apiFetch("/sos/cancel", {
        method: "POST",
        body: JSON.stringify({ sos_id: activeSOS }),
      });
      setActiveSOS(null);
    } catch {}
  }, [activeSOS]);

  return { alerts, activeSOS, wsConnected, triggerSOS, cancelSOS };
}
