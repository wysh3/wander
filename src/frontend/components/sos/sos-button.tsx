"use client";

import { useState, useRef, useEffect } from "react";
import { Siren } from "lucide-react";

interface SOSButtonProps {
  onActivate: () => void;
  active: boolean;
}

export function SOSButton({ onActivate, active }: SOSButtonProps) {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const holdRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  const startHold = () => {
    if (active) return;
    setHolding(true);
    setProgress(0);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(2000);
    }
    const startTime = Date.now();
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress(Math.min((elapsed / 2000) * 100, 100));
    }, 50);
    holdRef.current = setTimeout(() => {
      onActivate();
      setHolding(false);
      setProgress(0);
    }, 2000);
  };

  const cancelHold = () => {
    setHolding(false);
    setProgress(0);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(0);
    }
    if (holdRef.current) clearTimeout(holdRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
  };

  useEffect(() => {
    return () => {
      if (holdRef.current) clearTimeout(holdRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, []);

  return (
    <button
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      className="relative w-48 h-48 rounded-full flex items-center justify-center select-none transition-all"
      style={{
        background: active
          ? "hsl(var(--destructive))"
          : `conic-gradient(hsl(var(--destructive)) ${progress}%, hsl(var(--muted)) 0)`,
      }}
    >
      <div className="absolute inset-4 rounded-full bg-background flex items-center justify-center">
        <Siren className={`h-12 w-12 ${active ? "text-destructive animate-pulse" : "text-destructive/70"}`} />
      </div>
      <span className="absolute -bottom-8 text-sm font-medium text-muted-foreground">
        {active ? "SOS Active" : holding ? "Hold..." : "Hold 2s for SOS"}
      </span>
    </button>
  );
}
