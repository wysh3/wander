"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  expiresAt: number;
}

export function CountdownTimer({ expiresAt }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, expiresAt - now);
      setRemaining(diff);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const mins = Math.floor((remaining % 3600000) / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);

  const isUrgent = remaining < 3600000;
  const isImminent = remaining < 60000;

  return (
    <div className={`flex items-center justify-center gap-1.5 ${isUrgent ? "text-red-500 bg-red-50 border border-red-100 px-3 py-1 rounded-full mx-auto w-max" : "text-[#1e3a5f]/60"}`}>
      <Clock className={`w-3.5 h-3.5 ${isUrgent ? "text-red-500" : "text-[#2cb1bc]"}`} />
      <span className="text-[12px] font-bold tracking-wide uppercase">
        {remaining <= 0 ? "Chat Expired" : (
          isImminent
            ? `Expires in ${secs}s`
            : `Expires in ${days}d ${hours}h ${mins}m`
        )}
      </span>
    </div>
  );
}

