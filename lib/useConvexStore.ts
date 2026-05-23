"use client";

import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useMemo } from "react";
import { api } from "@/convex/_generated/api";
import { useDeviceId } from "./deviceId";
import { todayStr } from "./dates";
import type {
  AppData,
  BodyMetric,
  ChecklistItemId,
  ChecklistState,
  LoggedExercise,
  LoggedWorkout,
  WorkoutId,
} from "./types";
import { SCHEMA_VERSION } from "./types";

/* =================================================================
   useConvexStore
   ----------------------------------------------------------------
   Hook reativo que devolve a mesma forma que useStore (localStorage)
   mas alimentado pelo Convex. Páginas não precisam saber a diferença.
   ================================================================= */

function emptyAppData(): AppData {
  return {
    checklist: {},
    workouts: [],
    achievements: [],
    bodyMetrics: [],
    startDate: todayStr(),
    v: SCHEMA_VERSION,
  };
}

export function useConvexStore() {
  const deviceId = useDeviceId();
  const skipArg = deviceId ? { deviceId } : "skip";

  const profile = useQuery(api.profiles.getProfile, skipArg);
  const entries = useQuery(api.checklist.listAllEntries, skipArg);
  const workouts = useQuery(api.workouts.listRecent, deviceId ? { deviceId, limit: 1000 } : "skip");
  const achievements = useQuery(api.achievements.list, skipArg);
  const bodyMetrics = useQuery(api.bodyMetrics.listAll, skipArg);

  const ensureProfileMutation = useMutation(api.profiles.ensureProfile);
  const toggleMutation = useMutation(api.checklist.toggleItem);
  const finishMutation = useMutation(api.workouts.finishWorkout);
  const checkAndUnlockMutation = useMutation(api.achievements.checkAndUnlock);
  const upsertBodyMetricMutation = useMutation(api.bodyMetrics.upsertEntry);
  const deleteBodyMetricMutation = useMutation(api.bodyMetrics.deleteEntry);

  // Garante profile ao carregar
  useEffect(() => {
    if (!deviceId) return;
    ensureProfileMutation({ deviceId }).catch((e) => {
      console.error("ensureProfile failed", e);
    });
  }, [deviceId, ensureProfileMutation]);

  const hydrated =
    Boolean(deviceId) &&
    entries !== undefined &&
    workouts !== undefined &&
    achievements !== undefined &&
    bodyMetrics !== undefined;

  // Monta AppData no shape esperado pelas páginas
  const data: AppData = useMemo(() => {
    if (!hydrated) return emptyAppData();

    const checklist: ChecklistState = {};
    for (const e of entries ?? []) {
      checklist[e.date] = e.items as Partial<Record<ChecklistItemId, boolean>>;
    }

    const mappedWorkouts: LoggedWorkout[] = (workouts ?? []).map((w) => ({
      id: w._id,
      workoutId: w.workoutId as WorkoutId,
      date: w.date,
      startedAt: w.startedAt,
      finishedAt: w.finishedAt,
      exercises: w.exercises,
    }));
    // Order mais antigo → mais novo, espelha o que useStore retornava
    mappedWorkouts.sort((a, b) => a.finishedAt - b.finishedAt);

    const mappedMetrics: BodyMetric[] = (bodyMetrics ?? []).map((m) => ({
      date: m.date,
      weight: m.weight,
      bodyFatPct: m.bodyFatPct,
      waist: m.waist,
      chest: m.chest,
      arm: m.arm,
      hip: m.hip,
      thigh: m.thigh,
      notes: m.notes,
    }));

    return {
      checklist,
      workouts: mappedWorkouts,
      achievements: (achievements ?? []).map((a) => a.achievementId as never),
      bodyMetrics: mappedMetrics,
      startDate: profile?.startDate ?? todayStr(),
      v: SCHEMA_VERSION,
    };
  }, [hydrated, entries, workouts, achievements, bodyMetrics, profile]);

  const toggleChecklistItem = useCallback(
    (date: string, itemId: ChecklistItemId) => {
      if (!deviceId) return;
      void toggleMutation({ deviceId, date, itemId }).then(() => {
        return checkAndUnlockMutation({ deviceId });
      });
    },
    [deviceId, toggleMutation, checkAndUnlockMutation],
  );

  const finishWorkout = useCallback(
    (workoutId: WorkoutId, exercises: LoggedExercise[], startedAt: number) => {
      if (!deviceId) return;
      void finishMutation({ deviceId, workoutId, startedAt, exercises }).then(() => {
        return checkAndUnlockMutation({ deviceId });
      });
    },
    [deviceId, finishMutation, checkAndUnlockMutation],
  );

  const upsertBodyMetric = useCallback(
    (metric: BodyMetric) => {
      if (!deviceId) return;
      void upsertBodyMetricMutation({ deviceId, ...metric });
    },
    [deviceId, upsertBodyMetricMutation],
  );

  const deleteBodyMetric = useCallback(
    (date: string) => {
      if (!deviceId) return;
      void deleteBodyMetricMutation({ deviceId, date });
    },
    [deviceId, deleteBodyMetricMutation],
  );

  const mutate = useCallback((..._args: unknown[]) => {
    // No-op no modo Convex — mutations vão pela API.
    // Mantido pra paridade de API com useStore.
    void _args;
    console.warn("mutate() is a no-op when using Convex backend");
  }, []);

  const reset = useCallback(() => {
    // Reset cloud-side seria perigoso (apagar dados). Por ora só limpa local.
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("protocolo5m_v2");
        localStorage.removeItem("protocolo-device-id");
        location.reload();
      } catch {
        // ignore
      }
    }
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
    deviceId,
  };
}
