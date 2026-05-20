/* =================================================================
   Constantes do domínio replicadas para o runtime do Convex.
   Mantém paridade com lib/constants.ts no app/ — se mudar uma,
   mude as duas. Duplicação intencional pra isolar bundles.
   ================================================================= */

export const CHECKLIST_IDS = [
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
] as const;

export type ChecklistItemId = (typeof CHECKLIST_IDS)[number];

export const TOTAL_CHECKLIST_ITEMS = CHECKLIST_IDS.length;

export const WORKOUT_IDS = ["upperA", "lowerA", "upperB", "lowerB"] as const;
export type WorkoutId = (typeof WORKOUT_IDS)[number];

export const PROTOCOL_DAYS = 150;

/** Adesão mínima (em %) para o dia contar pra streak. */
export const STREAK_THRESHOLD_PCT = 70;

/**
 * Achievements desbloqueados automaticamente. O test recebe um snapshot
 * minimalista (counts + flags) já pré-computado do Convex.
 */
export type AchievementSnapshot = {
  checklistDayCount: number;
  workoutCount: number;
  prCount: number;
  streak: number;
  hasPerfectDay: boolean;
  daysSinceStart: number;
};

export type AchievementDef = {
  id: string;
  icon: string;
  name: string;
  desc: string;
  test: (s: AchievementSnapshot) => boolean;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first_check",
    icon: "⭐",
    name: "Primeiro check",
    desc: "Marcou seu primeiro item do checklist",
    test: (s) => s.checklistDayCount >= 1,
  },
  {
    id: "first_workout",
    icon: "💪",
    name: "Primeiro treino",
    desc: "Registrou seu primeiro treino",
    test: (s) => s.workoutCount >= 1,
  },
  {
    id: "first_pr",
    icon: "🏆",
    name: "Primeiro PR",
    desc: "Bateu um recorde pessoal",
    test: (s) => s.prCount >= 1,
  },
  {
    id: "streak_3",
    icon: "🔥",
    name: "3 dias",
    desc: "3 dias consecutivos",
    test: (s) => s.streak >= 3,
  },
  {
    id: "streak_7",
    icon: "🌟",
    name: "Uma semana",
    desc: "7 dias consecutivos",
    test: (s) => s.streak >= 7,
  },
  {
    id: "streak_14",
    icon: "💎",
    name: "Duas semanas",
    desc: "14 dias consecutivos",
    test: (s) => s.streak >= 14,
  },
  {
    id: "streak_30",
    icon: "👑",
    name: "Um mês",
    desc: "30 dias consecutivos",
    test: (s) => s.streak >= 30,
  },
  {
    id: "workouts_10",
    icon: "🎯",
    name: "10 treinos",
    desc: "10 treinos registrados",
    test: (s) => s.workoutCount >= 10,
  },
  {
    id: "workouts_25",
    icon: "⚡",
    name: "25 treinos",
    desc: "25 treinos registrados",
    test: (s) => s.workoutCount >= 25,
  },
  {
    id: "workouts_50",
    icon: "🚀",
    name: "50 treinos",
    desc: "Metade do caminho",
    test: (s) => s.workoutCount >= 50,
  },
  {
    id: "perfect_day",
    icon: "✨",
    name: "Dia perfeito",
    desc: "Completou 100% do checklist",
    test: (s) => s.hasPerfectDay,
  },
  {
    id: "protocol_complete",
    icon: "🏅",
    name: "5 meses",
    desc: "Completou o protocolo",
    test: (s) => s.daysSinceStart >= PROTOCOL_DAYS,
  },
];
