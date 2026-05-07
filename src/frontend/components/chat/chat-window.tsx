"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Image as ImageIcon } from "lucide-react";
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
    <div className="flex flex-col h-full bg-white max-w-2xl mx-auto border-x border-gray-100 shadow-[0_0_40px_rgba(30,58,95,0.02)]">
      {/* Expiration Header */}
      <div className="bg-[#fcfcfc] border-b border-gray-100 px-4 py-3 flex flex-col items-center justify-center">
        {ttlSeconds && <CountdownTimer expiresAt={expiresAt} />}
        {ttlSeconds && (
          <p className="text-[11px] font-medium text-[#1e3a5f]/40 text-center mt-1">
            Chat disappears — take the conversation outside
          </p>
        )}
        {!connected && (
          <p className="text-[11px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded mt-1">Connecting...</p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-[#fcfcfc]/50">
        {messages.length === 0 && (
          <div className="text-center py-20">
            <p className="text-[13px] font-medium text-[#1e3a5f]/40">
              No messages yet. Say hello!
            </p>
          </div>
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

      {/* Input Box */}
      <div className="bg-white border-t border-gray-100 p-4 pb-safe flex gap-3 items-center">
        <button className="text-[#1e3a5f]/40 hover:text-[#2cb1bc] transition-colors p-2 -ml-2">
          <ImageIcon className="w-5 h-5" />
        </button>
        <div className="flex-1 relative">
          <input
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="w-full bg-[#f4f7f8] text-[#1e3a5f] text-[15px] placeholder:text-[#1e3a5f]/40 rounded-full py-3 px-5 focus:outline-none focus:ring-2 focus:ring-[#2cb1bc]/20 transition-all border border-transparent focus:border-[#2cb1bc]/30"
          />
        </div>
        <button 
          onClick={handleSend} 
          disabled={!connected || !input.trim()}
          className="w-12 h-12 rounded-full bg-[#2cb1bc] flex items-center justify-center text-white shadow-md shadow-[#2cb1bc]/20 hover:bg-[#209ba5] transition-colors disabled:opacity-50 disabled:shadow-none"
        >
          <Send className="h-5 w-5 ml-0.5" />
        </button>
      </div>
    </div>
  );
}

