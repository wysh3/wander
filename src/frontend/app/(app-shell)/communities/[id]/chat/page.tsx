"use client";

import { useParams } from "next/navigation";
import { useChat } from "@/hooks/use-chat";
import { ChatWindow } from "@/components/chat/chat-window";

export default function CommunityChatPage() {
  const { id } = useParams<{ id: string }>();
  const { messages, connected, ttlSeconds, sendMessage } = useChat(id);

  return (
    <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
      <ChatWindow
        messages={messages}
        connected={connected}
        ttlSeconds={null}
        onSend={sendMessage}
      />
    </div>
  );
}
