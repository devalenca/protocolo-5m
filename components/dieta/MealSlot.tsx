"use client";

import { Plus, Trash2 } from "lucide-react";
import { mealSlot, type MealType } from "@/lib/diet";
import type { MealEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

type MealSlotProps = {
  mealType: MealType;
  entries: MealEntry[];
  onAdd: () => void;
  onDelete: (entryId: string) => void;
};

/* =================================================================
   MealSlot — card de uma refeição (header + entries + add)
   ================================================================= */

export function MealSlot({ mealType, entries, onAdd, onDelete }: MealSlotProps) {
  const slot = mealSlot(mealType);
  const totals = entries.reduce(
    (acc, e) => ({ kcal: acc.kcal + e.kcal, protein: acc.protein + e.protein }),
    { kcal: 0, protein: 0 },
  );

  return (
    <section className="border-line bg-bg-card rounded-[var(--radius-lg)] border p-4 shadow-[var(--shadow-sm)]">
      <header className="mb-3 flex items-baseline justify-between gap-2">
        <div>
          <h3 className="font-serif text-base font-semibold tracking-tight">
            {slot.label}
          </h3>
          <div className="text-text-mute mt-0.5 font-sans text-[10px] tracking-[0.18em] uppercase">
            {slot.time} · {slot.hint}
          </div>
        </div>
        {entries.length > 0 && (
          <div className="text-text-dim font-serif text-sm tabular">
            {Math.round(totals.kcal)} kcal · {round1(totals.protein)}g P
          </div>
        )}
      </header>

      {entries.length === 0 ? (
        <button
          type="button"
          onClick={onAdd}
          className="border-line-faint text-text-mute hover:border-brand/40 hover:text-brand flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius)] border border-dashed font-sans text-xs tracking-[0.12em] uppercase transition-colors"
        >
          <Plus className="h-4 w-4" /> Adicionar item
        </button>
      ) : (
        <>
          <ul className="divide-line-faint mb-2 divide-y">
            {entries.map((e) => (
              <li key={e._id} className="flex items-center justify-between gap-2 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="text-text font-serif text-sm font-medium truncate">
                    {e.foodName}
                  </div>
                  <div className="text-text-mute mt-0.5 font-sans text-[10px] tracking-[0.04em]">
                    {round1(e.portionGrams)}g · {Math.round(e.kcal)} kcal · {round1(e.protein)}g P
                    <span className="text-text-dim">
                      {" · "}
                      {round1(e.carbs)}g C · {round1(e.fat)}g G
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Remover item"
                  onClick={() => onDelete(e._id)}
                  className="text-text-mute hover:text-danger flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onAdd}
            className={cn(
              "text-text-mute hover:text-brand flex h-9 w-full items-center justify-center gap-1 font-sans text-[10px] tracking-[0.18em] uppercase transition-colors",
            )}
          >
            <Plus className="h-3 w-3" /> Adicionar mais
          </button>
        </>
      )}
    </section>
  );
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
