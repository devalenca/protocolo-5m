"use client";

import { useCallback, useEffect, useState } from "react";
import { ACHIEVEMENTS } from "./constants";
import { loadData, resetData, saveData } from "./storage";
import type {
  AchievementId,
  AppData,
  BodyMetric,
  ChecklistItemId,
  LoggedExercise,
  LoggedWorkout,
  WorkoutId,
} from "./types";
import { todayStr } from "./dates";

/**
 * Hook reativo sobre o storage local. Dispara re-render quando:
 *  - localStorage muda em outra aba (evento `storage`)
 *  - chamamos saveData() na mesma aba (evento `protocolo:change`)
 */
export function useStore() {
  const [data, setData] = useState<AppData>(() => loadData());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Sincroniza state com o localStorage (única fonte de verdade entre abas).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(loadData());
    setHydrated(true);

    const refresh = () => setData(loadData());
    window.addEventListener("storage", refresh);
    window.addEventListener("protocolo:change", refresh as EventListener);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("protocolo:change", refresh as EventListener);
    };
  }, []);

  const mutate = useCallback((updater: (d: AppData) => AppData) => {
    setData((prev) => {
      const next = updater(prev);
      const withAchievements = ensureAchievements(next);
      saveData(withAchievements);
      return withAchievements;
    });
  }, []);

  /** Toggle de item do checklist em uma data específica */
  const toggleChecklistItem = useCallback(
    (date: string, itemId: ChecklistItemId) => {
      mutate((d) => {
        const day = { ...(d.checklist[date] ?? {}) };
        if (day[itemId]) delete day[itemId];
        else day[itemId] = true;
        return {
          ...d,
          checklist: {
            ...d.checklist,
            [date]: day,
          },
        };
      });
    },
    [mutate],
  );

  /** Adiciona um treino finalizado */
  const finishWorkout = useCallback(
    (workoutId: WorkoutId, exercises: LoggedExercise[], startedAt: number) => {
      const log: LoggedWorkout = {
        id: cryptoRandomId(),
        workoutId,
        date: todayStr(),
        startedAt,
        finishedAt: Date.now(),
        exercises,
      };
      mutate((d) => ({ ...d, workouts: [...d.workouts, log] }));
      return log;
    },
    [mutate],
  );

  /** Upsert (cria ou substitui) métrica corporal por data */
  const upsertBodyMetric = useCallback(
    (metric: BodyMetric) => {
      mutate((d) => {
        const others = d.bodyMetrics.filter((m) => m.date !== metric.date);
        const next = [...others, metric].sort((a, b) =>
          a.date.localeCompare(b.date),
        );
        return { ...d, bodyMetrics: next };
      });
    },
    [mutate],
  );

  const deleteBodyMetric = useCallback(
    (date: string) => {
      mutate((d) => ({
        ...d,
        bodyMetrics: d.bodyMetrics.filter((m) => m.date !== date),
      }));
    },
    [mutate],
  );

  const reset = useCallback(() => {
    const fresh = resetData();
    setData(fresh);
  }, []);

  return {
    data,
    hydrated,
    mutate,
    toggleChecklistItem,
    finishWorkout,
    upsertBodyMetric,
    deleteBodyMetric,
    reset,
  };
}

function ensureAchievements(d: AppData): AppData {
  const newly: AchievementId[] = [];
  for (const a of ACHIEVEMENTS) {
    if (!d.achievements.includes(a.id) && a.test(d)) newly.push(a.id);
  }
  if (newly.length === 0) return d;
  return { ...d, achievements: [...d.achievements, ...newly] };
}

function cryptoRandomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}
