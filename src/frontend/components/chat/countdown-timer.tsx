"use client";

import { useEffect, useState } from "react";

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
    <div className={`text-center py-2 ${isUrgent ? "text-destructive" : "text-muted-foreground"}`}>
      <p className="text-xs font-medium">
        {remaining <= 0 ? "Chat expired" : (
          isImminent
            ? `Chat expires in ${secs}s`
            : `Chat expires in ${days}d ${hours}h ${mins}m`
        )}
      </p>
    </div>
  );
}
