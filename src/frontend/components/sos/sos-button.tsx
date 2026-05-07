"use client";

import { useState, useRef, useEffect } from "react";
import { ShieldAlert } from "lucide-react";

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
    <div className="flex flex-col items-center">
      <button
        onMouseDown={startHold}
        onMouseUp={cancelHold}
        onMouseLeave={cancelHold}
        onTouchStart={startHold}
        onTouchEnd={cancelHold}
        className={`relative w-48 h-48 rounded-full flex items-center justify-center select-none transition-transform duration-300 ${holding && !active ? "scale-95" : ""}`}
        style={{
          background: active
            ? "#ef4444"
            : `conic-gradient(#ef4444 ${progress}%, #fca5a5 0)`,
          boxShadow: active ? "0 0 40px rgba(239,68,68,0.5)" : "0 8px 30px rgba(239,68,68,0.2)",
        }}
      >
        <div className={`absolute inset-3 rounded-full flex items-center justify-center ${active ? "bg-red-600" : "bg-white"}`}>
          <div className={`absolute inset-2 rounded-full ${active ? "bg-red-500" : "bg-red-50"}`}></div>
          <ShieldAlert className={`relative z-10 w-16 h-16 ${active ? "text-white animate-pulse" : "text-red-500"}`} />
        </div>
      </button>
      
      <p className={`mt-8 text-sm font-bold uppercase tracking-widest ${active ? "text-red-500" : "text-[#1e3a5f]/40"}`}>
        {active ? "SOS ACTIVE" : holding ? "HOLDING..." : "HOLD 2S FOR SOS"}
      </p>
    </div>
  );
}

