"use client";

import { useParams, useRouter } from "next/navigation";
import { useChat } from "@/hooks/use-chat";
import { ChatWindow } from "@/components/chat/chat-window";
import { ArrowLeft, MoreVertical } from "lucide-react";

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { messages, connected, ttlSeconds, sendMessage } = useChat(id);

  return (
    <div className="h-screen flex flex-col bg-[#fcfcfc]">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm max-w-2xl mx-auto w-full">
        <button onClick={() => router.back()} className="text-[#1e3a5f] p-1 -ml-1 hover:bg-gray-50 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h1 className="font-bold text-[17px] text-[#1e3a5f]">Group Chat</h1>
        </div>
        <button className="text-[#1e3a5f]/60 p-1 -mr-1 hover:bg-gray-50 rounded-full transition-colors">
          <MoreVertical className="w-6 h-6" />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden max-w-2xl mx-auto w-full">
        <ChatWindow
          messages={messages}
          connected={connected}
          ttlSeconds={ttlSeconds}
          onSend={sendMessage}
        />
      </div>
    </div>
  );
}

