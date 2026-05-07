"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatMessage } from "./chat-message";
import { CountdownTimer } from "./countdown-timer";
import { useAuthStore } from "@/stores/auth-store";

interface Message {
  id: string;
  user_id: string;
  user_name: string;
  content: string;
  timestamp: string;
}

interface ChatWindowProps {
  messages: Message[];
  connected: boolean;
  ttlSeconds: number | null;
  onSend: (content: string) => void;
}

export function ChatWindow({ messages, connected, ttlSeconds, onSend }: ChatWindowProps) {
  const [input, setInput] = useState("");
  const { user } = useAuthStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  };

  const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-4 py-2">
        {ttlSeconds && <CountdownTimer expiresAt={expiresAt} />}
        {ttlSeconds && (
          <p className="text-[10px] text-muted-foreground text-center mt-0.5">
            Chat disappears — take the conversation outside
          </p>
        )}
        {!connected && (
          <p className="text-xs text-destructive text-center">Connecting...</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-12">
            No messages yet. Say hello!
          </p>
        )}
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            content={msg.content}
            userName={msg.user_name}
            isOwn={msg.user_id === user?.id}
            timestamp={msg.timestamp}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-3 flex gap-2">
        <Input
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1"
        />
        <Button size="icon" onClick={handleSend} disabled={!connected}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
