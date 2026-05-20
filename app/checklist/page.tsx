"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ChecklistItem } from "@/components/checklist/ChecklistItem";
import { Panel } from "@/components/ui/Panel";
import { RingProgress } from "@/components/ui/RingProgress";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { CHECKLIST_ITEMS } from "@/lib/constants";
import { addDays, dayOfWeek, formatDateBR, todayStr } from "@/lib/dates";
import { getDayProgress, TOTAL_CHECKLIST_ITEMS } from "@/lib/domain";
import { useDataStore } from "@/lib/useDataStore";
import { cn } from "@/lib/utils";

export default function ChecklistPage() {
  const { data, hydrated, toggleChecklistItem } = useDataStore();
  const [date, setDate] = useState<string>(() => todayStr());

  const progress = useMemo(() => getDayProgress(data, date), [data, date]);
  const isToday = date === todayStr();
  const day = data.checklist[date] ?? {};

  return (
    <>
      <ScreenHeader title="Checklist" subtitle="Hábitos diários" />

      {/* Date navigator */}
      <div className="border-line bg-bg-card mb-4 flex items-center justify-between rounded-[var(--radius)] border p-3">
        <div>
          <div className="text-brand font-sans text-[10px] tracking-[0.18em] uppercase">
            {isToday ? "Hoje" : dayOfWeek(date)}
          </div>
          <div className="font-serif text-base font-medium tabular">
            {formatDateBR(date)}
          </div>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Dia anterior"
            onClick={() => setDate(addDays(date, -1))}
            className="border-line text-text-dim hover:bg-bg-elev hover:text-text flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Próximo dia"
            disabled={isToday}
            onClick={() => setDate(addDays(date, 1))}
            className="border-line text-text-dim hover:bg-bg-elev hover:text-text flex h-9 w-9 items-center justify-center rounded-full border transition-colors disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Ring progress */}
      <Panel className="mb-4">
        <div className="flex items-center gap-5">
          <RingProgress pct={progress.pct} size={92} strokeWidth={7}>
            <span className="text-brand font-serif text-xl font-semibold tabular">
              {progress.pct}%
            </span>
            <span className="text-text-mute font-sans text-[10px] tracking-[0.12em] uppercase">
              {progress.count}/{progress.total}
            </span>
          </RingProgress>
          <div className="min-w-0 flex-1">
            <div className="text-text-mute font-sans text-[10px] tracking-[0.18em] uppercase">
              Progresso
            </div>
            <div className="mt-1 font-serif text-lg leading-tight font-medium">
              {progress.pct === 0
                ? "Vamos começar"
                : progress.pct < 50
                  ? "Continua"
                  : progress.pct < 100
                    ? "Quase lá"
                    : "Dia perfeito ✨"}
            </div>
            <div className="text-text-dim mt-1 text-xs">
              {progress.pct === 0 && "Marque o primeiro item"}
              {progress.pct > 0 &&
                progress.pct < 100 &&
                `${TOTAL_CHECKLIST_ITEMS - progress.count} pendente(s)`}
              {progress.pct === 100 && "Todos os hábitos completos"}
            </div>
          </div>
        </div>
      </Panel>

      {/* Items */}
      <div className={cn("space-y-2", !hydrated && "opacity-60")}>
        {CHECKLIST_ITEMS.map((item) => (
          <ChecklistItem
            key={item.id}
            item={item}
            checked={Boolean(day[item.id])}
            onToggle={() => toggleChecklistItem(date, item.id)}
          />
        ))}
      </div>
    </>
  );
}
