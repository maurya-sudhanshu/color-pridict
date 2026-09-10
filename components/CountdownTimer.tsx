"use client";

import { useEffect, useState } from "react";
import { Clock, Lock, Sparkles } from "lucide-react";

interface Props {
  closesAt: string | Date;
  lockSeconds?: number;
  onExpire?: () => void;
  onLockChange?: (isLocked: boolean) => void;
}

export default function CountdownTimer({ closesAt, lockSeconds = 30, onExpire, onLockChange }: Props) {
  const calculateRemaining = () => {
    if (!closesAt) return 0;
    const targetTime = new Date(closesAt).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((targetTime - now) / 1000));
  };

  const [remainingSeconds, setRemainingSeconds] = useState<number>(calculateRemaining());

  useEffect(() => {
    const initialRem = calculateRemaining();
    setRemainingSeconds(initialRem);

    const locked = initialRem <= lockSeconds;
    if (onLockChange) onLockChange(locked);

    if (initialRem <= 0 && onExpire) {
      onExpire();
      return;
    }

    const interval = setInterval(() => {
      const currentRem = calculateRemaining();
      setRemainingSeconds(currentRem);

      const isCurrentlyLocked = currentRem <= lockSeconds;
      if (onLockChange) onLockChange(isCurrentlyLocked);

      if (currentRem <= 0) {
        clearInterval(interval);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [closesAt, lockSeconds, onExpire, onLockChange]);

  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;

  const formattedMin = String(mins).padStart(2, "0");
  const formattedSec = String(secs).padStart(2, "0");

  const isLocked = remainingSeconds <= lockSeconds;

  return (
    <div
      className={`relative group flex flex-col items-center justify-center p-5 rounded-3xl border backdrop-blur-xl transition duration-500 ${
        isLocked
          ? "bg-red-950/40 border-red-500/60 shadow-glow-red"
          : "bg-slate-900/70 border-slate-700/60 shadow-glow-violet"
      }`}
    >
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest mb-1.5">
        {isLocked ? (
          <Lock className="w-4 h-4 text-red-400 animate-bounce" />
        ) : (
          <Clock className="w-4 h-4 text-purple-400 animate-pulse" />
        )}
        <span className={isLocked ? "text-red-400 font-bold" : "text-slate-300"}>
          {isLocked ? "Betting Locked" : "Time Remaining"}
        </span>
      </div>

      {/* Digit Counter Box */}
      <div className="flex items-center gap-2 font-mono text-3xl sm:text-5xl font-black tracking-tight">
        <div
          className={`px-4 py-2 rounded-2xl border shadow-inner ${
            isLocked
              ? "bg-slate-950 text-red-400 border-red-800"
              : "bg-slate-950 text-purple-300 border-purple-900/60 shadow-glow-violet"
          }`}
        >
          {formattedMin}
        </div>
        <span className={isLocked ? "text-red-500 animate-ping font-extrabold" : "text-purple-400 animate-pulse"}>
          :
        </span>
        <div
          className={`px-4 py-2 rounded-2xl border shadow-inner ${
            isLocked
              ? "bg-slate-950 text-red-500 border-red-600 animate-pulse"
              : "bg-slate-950 text-emerald-400 border-emerald-900/60 shadow-glow-green"
          }`}
        >
          {formattedSec}
        </div>
      </div>

      {isLocked ? (
        <span className="text-[10px] font-black tracking-wider text-red-300 uppercase mt-2.5 bg-red-500/20 px-3 py-1 rounded-full border border-red-500/40">
          🔒 Next Round Starting Soon
        </span>
      ) : (
        <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase mt-2.5 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-400" /> Active Round Open
        </span>
      )}
    </div>
  );
}
