/* =================================================================
   Macros — cálculo rule-based de metas calóricas e split de macros
   ----------------------------------------------------------------
   BMR Mifflin-St Jeor + multiplicador de atividade + ajuste por
   objetivo + split de macros (P por kg, F por % kcal, C resto).

   Sem LLM. Determinístico. Reproduzível.
   ================================================================= */

export type Sex = "M" | "F";
export type Goal = "cut" | "maintain" | "recomp" | "bulk";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type MacroGoals = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type MacroInputs = {
  /** anos */
  age: number;
  sex: Sex;
  /** centímetros */
  heightCm: number;
  /** kg */
  weightKg: number;
  activity: ActivityLevel;
  goal: Goal;
};

/* =================================================================
   BMR — Mifflin-St Jeor
   ----------------------------------------------------------------
   M: 10·peso + 6.25·altura - 5·idade + 5
   F: 10·peso + 6.25·altura - 5·idade - 161
   ================================================================= */
export function mifflinStJeor(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: Sex,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "M" ? base + 5 : base - 161;
}

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/** Total Daily Energy Expenditure (BMR × atividade). */
export function tdee(bmr: number, activity: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIER[activity];
}

/* =================================================================
   Ajuste calórico por objetivo
   ----------------------------------------------------------------
   cut    : -20% (déficit razoável, mantém aderência)
   maintain: 0
   recomp : -10% (déficit leve, prioriza proteína alta)
   bulk   : +12% (lean bulk)
   ================================================================= */
const GOAL_KCAL_FACTOR: Record<Goal, number> = {
  cut: 0.8,
  maintain: 1.0,
  recomp: 0.9,
  bulk: 1.12,
};

export function adjustKcalForGoal(tdeeKcal: number, goal: Goal): number {
  return tdeeKcal * GOAL_KCAL_FACTOR[goal];
}

/* =================================================================
   Split de macros
   ----------------------------------------------------------------
   Proteína: g/kg de peso corporal (objetivo-aware).
     cut/recomp: 2.2 g/kg (alto pra preservar massa em déficit)
     maintain  : 1.8 g/kg
     bulk      : 1.6 g/kg
   Gordura: 28% das kcal (saúde hormonal + saciedade).
   Carbs  : resto.

   Conversões:
     1g proteína = 4 kcal
     1g carb    = 4 kcal
     1g gordura = 9 kcal
   ================================================================= */
const PROTEIN_G_PER_KG: Record<Goal, number> = {
  cut: 2.2,
  recomp: 2.2,
  maintain: 1.8,
  bulk: 1.6,
};

const FAT_PCT_OF_KCAL = 0.28;

export function splitMacros(kcal: number, weightKg: number, goal: Goal): MacroGoals {
  const proteinG = PROTEIN_G_PER_KG[goal] * weightKg;
  const proteinKcal = proteinG * 4;

  const fatKcal = kcal * FAT_PCT_OF_KCAL;
  const fatG = fatKcal / 9;

  const carbsKcal = Math.max(0, kcal - proteinKcal - fatKcal);
  const carbsG = carbsKcal / 4;

  return {
    kcal: roundTo(kcal, 10),
    protein: roundTo(proteinG, 5),
    carbs: roundTo(carbsG, 5),
    fat: roundTo(fatG, 5),
  };
}

/* =================================================================
   Pipeline completo
   ================================================================= */
export function computeDietGoals(inputs: MacroInputs): MacroGoals {
  const bmr = mifflinStJeor(inputs.weightKg, inputs.heightCm, inputs.age, inputs.sex);
  const tdeeKcal = tdee(bmr, inputs.activity);
  const targetKcal = adjustKcalForGoal(tdeeKcal, inputs.goal);
  return splitMacros(targetKcal, inputs.weightKg, inputs.goal);
}

/* =================================================================
   Helpers
   ================================================================= */
function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step;
}

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentário (escritório, sem treino)",
  light: "Leve (treino 1-3×/semana)",
  moderate: "Moderado (treino 3-5×/semana)",
  active: "Ativo (treino 6-7×/semana)",
  very_active: "Muito ativo (2× ao dia, atleta)",
};

export const GOAL_LABELS: Record<Goal, string> = {
  cut: "Cutting — perder gordura",
  maintain: "Manutenção",
  recomp: "Recomposição — ganhar massa + perder gordura",
  bulk: "Bulking — ganhar massa",
};

export const GOAL_HINTS: Record<Goal, string> = {
  cut: "Déficit de ~20% das kcal de manutenção, alta proteína (2.2 g/kg)",
  maintain: "Calorias de manutenção, proteína moderada-alta (1.8 g/kg)",
  recomp: "Déficit leve de 10% + alta proteína (2.2 g/kg) — funciona melhor pra iniciantes/retorno",
  bulk: "Superávit de ~12%, proteína 1.6 g/kg, foco em carboidrato",
};
