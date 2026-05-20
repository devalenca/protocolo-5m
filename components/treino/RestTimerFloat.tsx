"use client";

import { X } from "lucide-react";
import { formatMMSS } from "@/lib/useRestTimer";
import { cn } from "@/lib/utils";

type Props = {
  remaining: number;
  total: number;
  running: boolean;
  onCancel: () => void;
};

export function RestTimerFloat({ remaining, total, running, onCancel }: Props) {
  if (!running) return null;
  const pct = total === 0 ? 0 : ((total - remaining) / total) * 100;

  return (
    <div
      className={cn(
        "fixed right-4 z-40 flex items-center gap-3 rounded-full border px-4 py-2.5 shadow-[var(--shadow-lg)]",
        "border-brand/40 bg-bg-card/95 backdrop-blur-md",
      )}
      style={{ bottom: "calc(88px + var(--safe-bottom))" }}
      role="status"
      aria-live="polite"
    >
      <div className="relative h-10 w-10">
        <svg viewBox="0 0 40 40" className="h-10 w-10">
          <circle
            cx="20"
            cy="20"
            r="17"
            fill="none"
            stroke="var(--line)"
            strokeWidth="3"
          />
          <circle
            cx="20"
            cy="20"
            r="17"
            fill="none"
            stroke="var(--brand)"
            strokeWidth="3"
            strokeDasharray={2 * Math.PI * 17}
            strokeDashoffset={2 * Math.PI * 17 * (1 - pct / 100)}
            strokeLinecap="round"
            transform="rotate(-90 20 20)"
            style={{ transition: "stroke-dashoffset 0.5s linear" }}
          />
        </svg>
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-brand font-serif text-base font-semibold tabular">
          {formatMMSS(remaining)}
        </span>
        <span className="text-text-mute font-sans text-[9px] tracking-[0.18em] uppercase">
          Descanso
        </span>
      </div>
      <button
        type="button"
        aria-label="Cancelar descanso"
        onClick={onCancel}
        className="text-text-dim hover:text-text ml-1"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
