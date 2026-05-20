"use client";

import { dayOfWeek, formatDateBR } from "@/lib/dates";
import { cn } from "@/lib/utils";

type WeekGridProps = {
  days: { date: string; pct: number; today: boolean }[];
};

export function WeekGrid({ days }: WeekGridProps) {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map((d) => (
        <div
          key={d.date}
          className="flex flex-col items-center gap-1"
          title={`${formatDateBR(d.date)} · ${d.pct}%`}
        >
          <span className="text-text-faint font-sans text-[9px] tracking-[0.12em] uppercase">
            {dayOfWeek(d.date, true).slice(0, 3)}
          </span>
          <div
            className={cn(
              "flex h-10 w-full items-center justify-center rounded-md border font-serif text-xs font-medium tabular transition-colors",
              d.pct === 0
                ? "bg-bg-elev border-line-faint text-text-mute"
                : d.pct < 50
                  ? "border-warning/30 bg-warning/10 text-warning"
                  : d.pct < 80
                    ? "border-brand/30 bg-brand/10 text-brand"
                    : "border-success/40 bg-success/15 text-success",
              d.today && "ring-brand/40 ring-2",
            )}
          >
            {d.pct}
          </div>
        </div>
      ))}
    </div>
  );
}
