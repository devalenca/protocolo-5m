"use client";

import { useQuery } from "convex/react";
import { useMemo } from "react";
import { api } from "@/convex/_generated/api";
import { CONVEX_ENABLED } from "@/components/providers/ConvexClientProvider";
import { CHECKLIST_ITEMS, WORKOUTS, WORKOUT_ORDER } from "./constants";
import { useDeviceId } from "./deviceId";
import { DIET_GOALS, MEAL_SLOTS, type DietGoals, type MealSlot } from "./diet";
import type {
  ChecklistItem,
  ChecklistItemId,
  WorkoutId,
  WorkoutTemplate,
} from "./types";

/* =================================================================
   usePlan — leituras do plano personalizado (Slice 1 multi-user)
   ----------------------------------------------------------------
   Cada hook devolve os dados do profile autenticado.
   Enquanto Convex carrega ou se o profile não tem entries, faz
   fallback pros defaults 5M (em lib/constants e lib/diet).
   Assim a UI nunca pisca "vazia".
   ================================================================= */

export type WorkoutPlan = {
  templates: WorkoutTemplate[];
  byId: Record<string, WorkoutTemplate>;
  order: WorkoutId[];
  /** True quando os dados vieram do Convex (não fallback). */
  hydrated: boolean;
};

export function useWorkoutPlan(): WorkoutPlan {
  const deviceId = useDeviceId();
  const rows = useQuery(
    api.workoutTemplates.list,
    CONVEX_ENABLED && deviceId ? { deviceId } : "skip",
  );

  return useMemo<WorkoutPlan>(() => {
    if (rows && rows.length > 0) {
      const templates: WorkoutTemplate[] = rows.map((r) => ({
        id: r.templateId as WorkoutId,
        name: r.name,
        day: r.day,
        focus: r.focus,
        order: r.order,
        exercises: r.exercises,
      }));
      const byId: Record<string, WorkoutTemplate> = {};
      for (const t of templates) byId[t.id] = t;
      return {
        templates,
        byId,
        order: templates.map((t) => t.id),
        hydrated: true,
      };
    }
    // Fallback pros defaults 5M (loading state OR Convex desligado)
    const templates = (WORKOUT_ORDER as readonly WorkoutId[]).map(
      (wid) => WORKOUTS[wid],
    );
    return {
      templates,
      byId: WORKOUTS,
      order: [...WORKOUT_ORDER],
      hydrated: false,
    };
  }, [rows]);
}

export type MealPlanData = {
  goals: DietGoals;
  slots: MealSlot[];
  hydrated: boolean;
};

export function useMealPlanData(): MealPlanData {
  const deviceId = useDeviceId();
  const row = useQuery(
    api.mealPlan.get,
    CONVEX_ENABLED && deviceId ? { deviceId } : "skip",
  );

  return useMemo<MealPlanData>(() => {
    if (row) {
      return {
        goals: row.goals,
        slots: row.slots.map((s) => ({
          id: s.id,
          label: s.label,
          time: s.time,
          hint: s.hint ?? "",
        })),
        hydrated: true,
      };
    }
    return {
      goals: DIET_GOALS,
      slots: MEAL_SLOTS,
      hydrated: false,
    };
  }, [row]);
}

export type HabitPlanData = {
  items: ChecklistItem[];
  hydrated: boolean;
};

export function useHabitPlan(): HabitPlanData {
  const deviceId = useDeviceId();
  const rows = useQuery(
    api.habitItems.list,
    CONVEX_ENABLED && deviceId ? { deviceId } : "skip",
  );

  return useMemo<HabitPlanData>(() => {
    if (rows && rows.length > 0) {
      return {
        items: rows.map((r) => ({
          id: r.itemId as ChecklistItemId,
          text: r.text,
          sub: r.sub ?? "",
        })),
        hydrated: true,
      };
    }
    return { items: CHECKLIST_ITEMS, hydrated: false };
  }, [rows]);
}
