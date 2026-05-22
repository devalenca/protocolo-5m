import { dateStr, parseDate, todayStr } from "./dates";
import type {
  AppData,
  ChecklistItemId,
  LoggedWorkout,
  WorkoutId,
  WorkoutTemplate,
} from "./types";

/* =================================================================
   CHECKLIST
   ================================================================= */

const CHECKLIST_IDS: ChecklistItemId[] = [
  "agua",
  "proteina",
  "cafe",
  "creatina",
  "d3-omega",
  "zinco",
  "ashwa",
  "mag",
  "treino",
  "sem-tela",
  "dormir-cedo",
  "zero-cafe-tarde",
];

export const TOTAL_CHECKLIST_ITEMS = CHECKLIST_IDS.length;

export type DayProgress = {
  count: number;
  total: number;
  pct: number;
};

export function getDayProgress(data: AppData, date: string): DayProgress {
  const day = data.checklist[date] ?? {};
  const count = CHECKLIST_IDS.filter((id) => day[id]).length;
  return {
    count,
    total: TOTAL_CHECKLIST_ITEMS,
    pct: Math.round((count / TOTAL_CHECKLIST_ITEMS) * 100),
  };
}

/**
 * Streak conta dias consecutivos com >=70% de adesão.
 * Se hoje ainda não atingiu 70%, conta a partir de ontem.
 */
export function getStreakFromData(d: AppData): number {
  let streak = 0;
  const date = new Date();
  const today = todayStr();

  const todayPct = getDayProgress(d, today).pct;
  if (todayPct < 70) date.setDate(date.getDate() - 1);

  while (streak < 365) {
    const ds = dateStr(date);
    const pct = getDayProgress(d, ds).pct;
    if (pct >= 70) {
      streak++;
      date.setDate(date.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function getWeekAdherence(d: AppData): number {
  let total = 0;
  let count = 0;
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const ds = dateStr(date);
    if (d.checklist[ds]) {
      total += getDayProgress(d, ds).pct;
      count++;
    }
  }
  return count === 0 ? 0 : Math.round(total / count);
}

export function hasPerfectDay(d: AppData): boolean {
  return Object.values(d.checklist).some((day) =>
    CHECKLIST_IDS.every((id) => day[id]),
  );
}

export function getWeekDays(): { date: string; today: boolean }[] {
  const today = todayStr();
  const out: { date: string; today: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = dateStr(d);
    out.push({ date: ds, today: ds === today });
  }
  return out;
}

/* =================================================================
   WORKOUTS
   ================================================================= */

export type ExerciseBest = {
  weight: number;
  reps: number;
  date: string;
};

export function getPreviousBest(
  d: AppData,
  workoutId: WorkoutId,
  exName: string,
): ExerciseBest | null {
  for (let i = d.workouts.length - 1; i >= 0; i--) {
    const w = d.workouts[i];
    if (w.workoutId !== workoutId) continue;
    const ex = w.exercises.find((e) => e.name === exName);
    if (!ex) continue;
    const valid = ex.sets.filter((s) => s.weight && s.reps);
    if (valid.length === 0) continue;
    const best = valid.reduce((a, b) => (Number(a.weight) > Number(b.weight) ? a : b));
    return { weight: Number(best.weight), reps: Number(best.reps), date: w.date };
  }
  return null;
}

export function isPR(
  d: AppData,
  workoutId: WorkoutId,
  exName: string,
  weight: number,
  reps: number,
): boolean {
  let bestWeight = 0;
  const bestRepsAtWeight: Record<number, number> = {};

  d.workouts.forEach((w) => {
    if (w.workoutId !== workoutId) return;
    const ex = w.exercises.find((e) => e.name === exName);
    if (!ex) return;
    ex.sets.forEach((s) => {
      const we = Number(s.weight);
      const rep = Number(s.reps);
      if (!we || !rep) return;
      if (we > bestWeight) bestWeight = we;
      bestRepsAtWeight[we] = Math.max(bestRepsAtWeight[we] ?? 0, rep);
    });
  });

  if (weight > bestWeight) return true;
  if (weight === bestWeight && reps > (bestRepsAtWeight[weight] ?? 0)) return true;
  return false;
}

export function countTotalPRs(d: AppData): number {
  const seen = new Set<string>();
  d.workouts.forEach((w) => {
    w.exercises.forEach((ex) => {
      if (ex.sets.some((s) => s.weight && s.reps)) {
        seen.add(w.workoutId + "|" + ex.name);
      }
    });
  });
  return seen.size;
}

export type AllPRsEntry = {
  weight: number;
  reps: number;
  date: string;
  workoutId: WorkoutId;
};

export function getAllPRs(d: AppData): Record<string, AllPRsEntry> {
  const prs: Record<string, AllPRsEntry> = {};
  d.workouts.forEach((w) => {
    w.exercises.forEach((ex) => {
      const valid = ex.sets.filter((s) => s.weight && s.reps);
      if (valid.length === 0) return;
      const best = valid.reduce((a, b) => {
        const aScore = Number(a.weight) * Number(a.reps);
        const bScore = Number(b.weight) * Number(b.reps);
        return bScore > aScore ? b : a;
      });
      const key = ex.name;
      const existing = prs[key];
      const newEntry: AllPRsEntry = {
        weight: Number(best.weight),
        reps: Number(best.reps),
        date: w.date,
        workoutId: w.workoutId,
      };
      if (!existing) {
        prs[key] = newEntry;
      } else if (newEntry.weight * newEntry.reps > existing.weight * existing.reps) {
        prs[key] = newEntry;
      }
    });
  });
  return prs;
}

export function suggestNextWorkout(
  d: AppData,
  workouts: Record<string, WorkoutTemplate>,
  order: readonly WorkoutId[],
): WorkoutTemplate {
  if (d.workouts.length === 0) return workouts[order[0]];
  const last = d.workouts[d.workouts.length - 1];
  const idx = order.indexOf(last.workoutId);
  const next = order[(idx + 1) % order.length];
  return workouts[next];
}

export function lastWorkout(d: AppData): LoggedWorkout | null {
  return d.workouts.length === 0 ? null : d.workouts[d.workouts.length - 1];
}

export function daysSinceStart(d: AppData): number {
  const start = parseDate(d.startDate);
  const today = parseDate(todayStr());
  return Math.max(1, Math.round((today.getTime() - start.getTime()) / 86_400_000) + 1);
}

/* =================================================================
   1RM estimado (fórmula Epley)
   ----------------------------------------------------------------
   1RM ≈ peso × (1 + reps / 30)
   Identidade pra 1 rep (não infla); 0 quando inputs inválidos.
   ================================================================= */
export function epley1RM(weight: number, reps: number): number {
  if (!Number.isFinite(weight) || !Number.isFinite(reps)) return 0;
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return Math.round(weight * 10) / 10;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

/** Melhor e1RM já atingido neste exercício (em qualquer workout). */
export function getBestE1RM(d: AppData, exName: string): number {
  let best = 0;
  for (const w of d.workouts) {
    const ex = w.exercises.find((e) => e.name === exName);
    if (!ex) continue;
    for (const s of ex.sets) {
      const e1 = epley1RM(Number(s.weight), Number(s.reps));
      if (e1 > best) best = e1;
    }
  }
  return best;
}
