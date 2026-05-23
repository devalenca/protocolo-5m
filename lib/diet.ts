/* =================================================================
   Nutrição — constantes do protocolo
   ----------------------------------------------------------------
   Valores vêm da Seção 01 (metas diárias) e Seção 02 (horários).
   ================================================================= */

export type MealType =
  | "cafe"
  | "lanche_manha"
  | "almoco"
  | "pre_treino"
  | "jantar"
  | "pre_sono";

export type MealSlot = {
  id: MealType;
  label: string;
  /** Horário sugerido HH:MM (vindo do protocolo) */
  time: string;
  /** Subtitle curto (PT-BR) */
  hint: string;
};

export const MEAL_SLOTS: MealSlot[] = [
  { id: "cafe", label: "Café da manhã", time: "06:30", hint: "primeira refeição" },
  { id: "lanche_manha", label: "Lanche da manhã", time: "10:00", hint: "snack proteico" },
  { id: "almoco", label: "Almoço", time: "12:30", hint: "refeição principal" },
  { id: "pre_treino", label: "Pré-treino", time: "16:30", hint: "energia rápida" },
  { id: "jantar", label: "Jantar", time: "21:00", hint: "refeição da noite" },
  { id: "pre_sono", label: "Pré-sono", time: "22:00", hint: "leve, calmante" },
];

export const MEAL_TYPE_IDS = MEAL_SLOTS.map((s) => s.id);

export type DietGoals = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};

/** Metas vindas da Seção 01 do protocolo. */
export const DIET_GOALS: DietGoals = {
  kcal: 2350,
  protein: 170,
  carbs: 245,
  fat: 70,
};

export type Macro = "kcal" | "protein" | "carbs" | "fat";

export const MACRO_META: Record<Macro, { label: string; short: string; unit: string }> = {
  kcal: { label: "Calorias", short: "kcal", unit: "kcal" },
  protein: { label: "Proteína", short: "P", unit: "g" },
  carbs: { label: "Carboidrato", short: "C", unit: "g" },
  fat: { label: "Gordura", short: "G", unit: "g" },
};

export function mealSlot(id: MealType): MealSlot {
  return MEAL_SLOTS.find((s) => s.id === id) ?? MEAL_SLOTS[0];
}

/** Computa macros pra uma porção em gramas, a partir dos valores por 100g. */
export function macrosForPortion(
  per100g: { kcal: number; protein: number; carbs: number; fat: number },
  grams: number,
): { kcal: number; protein: number; carbs: number; fat: number } {
  const factor = grams / 100;
  return {
    kcal: round1(per100g.kcal * factor),
    protein: round1(per100g.protein * factor),
    carbs: round1(per100g.carbs * factor),
    fat: round1(per100g.fat * factor),
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Lowercase + remove acentos. Usado pra searchKey e queries client-side. */
export function normalizeFoodSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}
