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
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [ttlSeconds, setTtlSeconds] = useState<number | null>(null);

  // Simulated initial connection
  useEffect(() => {
    setConnected(true);
    setTtlSeconds(3600); // 1 hour TTL
    
    // Add some initial fake messages
    setMessages([
      {
        id: "msg-1",
        user_id: "bot-1",
        user_name: "Wander Bot",
        content: "Welcome to the group chat! Start planning your activity.",
        timestamp: new Date(Date.now() - 60000).toISOString()
      },
      {
        id: "msg-2",
        user_id: "u-2",
        user_name: "Sarah Jones",
        content: "Hey everyone! Excited for this.",
        timestamp: new Date(Date.now() - 30000).toISOString()
      }
    ]);
  }, [groupId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      user_id: user?.id || "u-me",
      user_name: user?.name || "You",
      content,
      timestamp: new Date().toISOString()
    };
    
    // Optimistic append
    setMessages(prev => [...prev, newMsg]);

    // Attempt to invoke NVIDIA AI logic for a response, fallback to generic mock
    try {
      // Fake attempt to hit NVIDIA NIM - will fail natively without key causing the catch
      const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_NVIDIA_API_KEY || 'fake-key'}`
        },
        body: JSON.stringify({
          model: "nvidia/nemotron-3-nano-30b-a3b",
          messages: [{ role: "user", content }],
          max_tokens: 50
        })
      });

      if (!res.ok) throw new Error("Fallback to mock");

      const data = await res.json();
      const replyContent = data.choices[0].message.content;

      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: `msg-nv-${Date.now()}`,
          user_id: "nv-bot",
          user_name: "AI Guide",
          content: replyContent,
          timestamp: new Date().toISOString()
        }]);
      }, 1000);

    } catch (e) {
      // Fake Mock Reply generator
      setTimeout(() => {
        const fakeReplies = [
          "That sounds like a great plan! What time works for everyone?",
          "I'm in! Do we need to bring anything specific?",
          "Can't wait to meet you all.",
          "Good idea, let's lock in the location soon."
        ];
        
        const randomReply = fakeReplies[Math.floor(Math.random() * fakeReplies.length)];

        setMessages(prev => [...prev, {
          id: `msg-mock-${Date.now()}`,
          user_id: "u-2",
          user_name: "Sarah Jones",
          content: randomReply,
          timestamp: new Date().toISOString()
        }]);
      }, 1200);
    }
  }, [user]);

  return { messages, connected, ttlSeconds, sendMessage };
}
