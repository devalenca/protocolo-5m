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
import { DIET_GOALS, MEAL_SLOTS, type MealType } from "@/lib/diet";
import { useDeviceId } from "@/lib/deviceId";
import type { MealEntry } from "@/lib/types";

export default function DietaPage() {
  const deviceId = useDeviceId();
  const [date, setDate] = useState<string>(() => todayStr());
  const [modalMeal, setModalMeal] = useState<MealType | null>(null);

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
    const out: Record<MealType, MealEntry[]> = {
      cafe: [],
      lanche_manha: [],
      almoco: [],
      pre_treino: [],
      jantar: [],
      pre_sono: [],
    };
    for (const e of entries ?? []) {
      const m = e.mealType as MealType;
      if (out[m]) out[m].push(e);
    }
    return out;
  }, [entries]);

  const isToday = date === todayStr();
  const kcalPct = totals ? Math.round((totals.kcal / DIET_GOALS.kcal) * 100) : 0;

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
              / {DIET_GOALS.kcal} kcal
            </span>
          </RingProgress>
          <div className="min-w-0 flex-1 space-y-3">
            <MacroBar
              label="Proteína"
              current={totals?.protein ?? 0}
              goal={DIET_GOALS.protein}
            />
            <MacroBar
              label="Carboidrato"
              current={totals?.carbs ?? 0}
              goal={DIET_GOALS.carbs}
              accent="var(--info)"
            />
            <MacroBar
              label="Gordura"
              current={totals?.fat ?? 0}
              goal={DIET_GOALS.fat}
              accent="var(--warning)"
            />
          </div>
        </div>
      </Panel>

      {/* Meal slots */}
      <div className="space-y-3">
        {MEAL_SLOTS.map((slot) => (
          <MealSlot
            key={slot.id}
            mealType={slot.id}
            entries={byMeal[slot.id] ?? []}
            onAdd={() => setModalMeal(slot.id)}
            onDelete={(entryId) => {
              if (!deviceId) return;
              void deleteEntry({ deviceId, entryId: entryId as never });
            }}
          />
        ))}
      </div>

      {modalMeal && (
        <FoodSearchModal
          open={modalMeal !== null}
          onClose={() => setModalMeal(null)}
          date={date}
          mealType={modalMeal}
        />
      )}
    </>
  );
}
