"use client";

interface ChatBubbleProps {
  content: string;
  userName: string;
  isOwn: boolean;
  timestamp: string;
}

export function ChatMessage({ content, userName, isOwn, timestamp }: ChatBubbleProps) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3`}>
      <div className={`max-w-[80%] ${isOwn ? "order-1" : "order-2"}`}>
        {!isOwn && <p className="text-xs text-muted-foreground mb-0.5 ml-1">{userName}</p>}
        <div
          className={`rounded-2xl px-4 py-2 text-sm ${
            isOwn ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md"
          }`}
        >
          {content}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 ml-1">
          {new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}
