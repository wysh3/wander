"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "@/stores/auth-store";

interface ChatMessage {
  id: string;
  user_id: string;
  user_name: string;
  content: string;
  timestamp: string;
}

export function useChat(groupId: string) {
  const { accessToken } = useAuthStore();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const backoffRef = useRef(1000);
  const pongTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [ttlSeconds, setTtlSeconds] = useState<number | null>(null);

  const connect = useCallback(() => {
    if (!accessToken || !groupId) return;

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    const wsBase = apiBase.replace(/^http/, "ws");
    const wsUrl = `${wsBase}/groups/${groupId}/chat?token=${accessToken}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      backoffRef.current = 1000;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "pong") {
          if (pongTimeoutRef.current) {
            clearTimeout(pongTimeoutRef.current);
            pongTimeoutRef.current = null;
          }
          return;
        }
        switch (data.type) {
          case "new_message":
            setMessages((prev) => [...prev, { ...data, timestamp: data.timestamp || new Date().toISOString() }]);
            break;
          case "user_joined":
          case "user_left":
            break;
          case "chat_ttl_update":
            setTtlSeconds(data.remaining_seconds);
            break;
          case "chat_expired":
            setConnected(false);
            break;
        }
      } catch {}
    };

    ws.onclose = (event) => {
      if (pongTimeoutRef.current) clearTimeout(pongTimeoutRef.current);
      setConnected(false);
      if (event.code === 4001 || event.code === 4003) return;
      const delay = Math.min(backoffRef.current, 30000);
      backoffRef.current *= 2;
      reconnectTimeoutRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [accessToken, groupId]);

  useEffect(() => {
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));
        if (pongTimeoutRef.current) clearTimeout(pongTimeoutRef.current);
        pongTimeoutRef.current = setTimeout(() => {
          wsRef.current?.close();
        }, 10000);
      }
    }, 30000);

    return () => clearInterval(pingInterval);
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (pongTimeoutRef.current) clearTimeout(pongTimeoutRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const sendMessage = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "send_message", content }));
    }
  }, []);

  return { messages, connected, ttlSeconds, sendMessage };
}
