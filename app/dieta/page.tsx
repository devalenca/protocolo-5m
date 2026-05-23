"use client";

import { useMutation, useQuery } from "convex/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { FoodSearchModal } from "@/components/dieta/FoodSearchModal";
import { MacroBar } from "@/components/dieta/MacroBar";
import { MealSlot } from "@/components/dieta/MealSlot";
import { Panel } from "@/components/ui/Panel";
import { RingProgress } from "@/components/ui/RingProgress";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { addDays, dayOfWeek, formatDateBR, todayStr } from "@/lib/dates";
import { useDeviceId } from "@/lib/deviceId";
import type { MealSlot as MealSlotData } from "@/lib/diet";
import type { MealEntry } from "@/lib/types";
import { useMealPlanData } from "@/lib/usePlan";

export default function DietaPage() {
  const deviceId = useDeviceId();
  const [date, setDate] = useState<string>(() => todayStr());
  const [modalSlot, setModalSlot] = useState<MealSlotData | null>(null);
  const { goals, slots } = useMealPlanData();

  const entries = useQuery(
    api.meals.getDay,
    deviceId ? { deviceId, date } : "skip",
  );
  const totals = useQuery(
    api.meals.dailyTotals,
    deviceId ? { deviceId, date } : "skip",
  );
  const foodCount = useQuery(api.foods.countGlobal, {});
  const seedDefaults = useMutation(api.foods.seedDefaultsIfEmpty);
  const deleteEntry = useMutation(api.meals.deleteEntry);

  // Seed dos alimentos globais na primeira visita (idempotente).
  useEffect(() => {
    if (foodCount === 0) {
      void seedDefaults({});
    }
  }, [foodCount, seedDefaults]);

  const byMeal = useMemo(() => {
    const out: Record<string, MealEntry[]> = {};
    for (const s of slots) out[s.id] = [];
    for (const e of entries ?? []) {
      (out[e.mealType] ??= []).push(e);
    }
    return out;
  }, [entries, slots]);

  const isToday = date === todayStr();
  const kcalPct = totals ? Math.round((totals.kcal / goals.kcal) * 100) : 0;

  return (
    <>
      <ScreenHeader title="Dieta" subtitle="Refeições e macros" />

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

      {/* Totals */}
      <Panel className="mb-4">
        <div className="flex items-center gap-5">
          <RingProgress pct={kcalPct} size={92} strokeWidth={7}>
            <span className="text-brand font-serif text-xl font-semibold tabular">
              {totals ? Math.round(totals.kcal) : 0}
            </span>
            <span className="text-text-mute font-sans text-[10px] tracking-[0.12em] uppercase">
              / {goals.kcal} kcal
            </span>
          </RingProgress>
          <div className="min-w-0 flex-1 space-y-3">
            <MacroBar
              label="Proteína"
              current={totals?.protein ?? 0}
              goal={goals.protein}
            />
            <MacroBar
              label="Carboidrato"
              current={totals?.carbs ?? 0}
              goal={goals.carbs}
              accent="var(--info)"
            />
            <MacroBar
              label="Gordura"
              current={totals?.fat ?? 0}
              goal={goals.fat}
              accent="var(--warning)"
            />
          </div>
        </div>
        <div className="text-text-mute mt-3 font-sans text-[10px] tracking-[0.12em] uppercase">
          Meta: {goals.kcal} kcal · {goals.protein}g P · {goals.carbs}g C · {goals.fat}g G
        </div>
      </Panel>

      {/* Meal slots */}
      <div className="space-y-3">
        {slots.map((slot) => (
          <MealSlot
            key={slot.id}
            slot={slot}
            entries={byMeal[slot.id] ?? []}
            onAdd={() => setModalSlot(slot)}
            onDelete={(entryId) => {
              if (!deviceId) return;
              void deleteEntry({ deviceId, entryId: entryId as never });
            }}
          />
        ))}
      </div>

      {modalSlot && (
        <FoodSearchModal
          open={modalSlot !== null}
          onClose={() => setModalSlot(null)}
          date={date}
          slot={modalSlot}
        />
      )}
    </>
  );
}
