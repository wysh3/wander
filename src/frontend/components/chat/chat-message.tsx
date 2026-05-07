"use client";

interface ChatBubbleProps {
  content: string;
  userName: string;
  isOwn: boolean;
  timestamp: string;
}

export function ChatMessage({ content, userName, isOwn, timestamp }: ChatBubbleProps) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`max-w-[75%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
        {!isOwn && <span className="text-[11px] font-bold text-[#1e3a5f]/50 mb-1 ml-1">{userName}</span>}
        <div
          className={`px-4 py-2.5 text-[15px] shadow-sm ${
            isOwn 
              ? "bg-[#2cb1bc] text-white rounded-[20px] rounded-br-sm" 
              : "bg-[#f4f7f8] text-[#1e3a5f] rounded-[20px] rounded-bl-sm border border-gray-100"
          }`}
        >
          {content}
        </div>
        <span className={`text-[10px] font-semibold text-[#1e3a5f]/40 mt-1 ${isOwn ? "mr-1" : "ml-1"}`}>
          {new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}

