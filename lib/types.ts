/* =================================================================
   Tipos do domínio — Protocolo 5M
   ================================================================= */

export type ChecklistItemId =
  | "agua"
  | "proteina"
  | "cafe"
  | "creatina"
  | "d3-omega"
  | "zinco"
  | "ashwa"
  | "mag"
  | "treino"
  | "sem-tela"
  | "dormir-cedo"
  | "zero-cafe-tarde";

export type ChecklistItem = {
  id: ChecklistItemId;
  text: string;
  sub: string;
};

/** Map: dateStr (YYYY-MM-DD) → { [itemId]: boolean } */
export type ChecklistState = Record<string, Partial<Record<ChecklistItemId, boolean>>>;

export type WorkoutId = "upperA" | "lowerA" | "upperB" | "lowerB";

export type ExerciseTemplate = {
  name: string;
  sets: number;
  reps: string;
  /** seconds */
  rest: number;
  /** marks exercises that use a barbell (plate calc) */
  useBar?: boolean;
};

export type WorkoutTemplate = {
  id: WorkoutId;
  name: string;
  day: string;
  focus: string;
  order: number;
  exercises: ExerciseTemplate[];
};

export type ExerciseSet = {
  weight: string;
  reps: string;
};

export type LoggedExercise = {
  name: string;
  sets: ExerciseSet[];
};

export type LoggedWorkout = {
  id: string;
  workoutId: WorkoutId;
  date: string; // YYYY-MM-DD
  startedAt: number;
  finishedAt: number;
  exercises: LoggedExercise[];
};

export type AchievementId =
  | "first_check"
  | "first_workout"
  | "first_pr"
  | "streak_3"
  | "streak_7"
  | "streak_14"
  | "streak_30"
  | "workouts_10"
  | "workouts_25"
  | "workouts_50"
  | "perfect_day"
  | "protocol_complete";

export type Achievement = {
  id: AchievementId;
  icon: string;
  name: string;
  desc: string;
  test: (d: AppData) => boolean;
};

export type AppData = {
  checklist: ChecklistState;
  workouts: LoggedWorkout[];
  achievements: AchievementId[];
  startDate: string;
  /** schema version for migrations */
  v: number;
};

export const SCHEMA_VERSION = 2;
