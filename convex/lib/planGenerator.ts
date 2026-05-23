/* =================================================================
   Plan Generator — splits de treino + suplementação por objetivo
   ----------------------------------------------------------------
   Inputs vêm do onboarding (profileSettings + opcionais).
   Output: templates de treino [] + supplementos [] prontos pra insert.

   Padrão internacional de musculação (NSCA/ACSM):
   - 1 dia/sem → Full Body
   - 2 dias/sem → Upper / Lower
   - 3 dias/sem → Push / Pull / Legs (ABC clássico)
   - 4 dias/sem → Upper A / Lower A / Upper B / Lower B (current 5M)
   - 5 dias/sem → Push / Pull / Legs / Upper / Lower
   - 6 dias/sem → PPL × 2

   Reps/sets/rest por objetivo:
   - cut    : 3×10-12, 60-75s rest (volume + densidade)
   - recomp : 4×8-10, 90-120s rest
   - maintain: 3×8-12, 90s rest
   - bulk   : 4×5-8, 150-180s rest (força + hipertrofia)
   ================================================================= */

import { EXERCISE_LIBRARY, type ExerciseSeed } from "./exerciseLibrary";
import { SUPPLEMENT_TEMPLATES, type SupplementSeed } from "./supplementTemplates";

/**
 * NOTA: Goal é duplicado de lib/macros.ts porque Convex isola bundles
 * (não pode importar de lib/). Mantenha em sincronia se mudar lá.
 */
type Goal = "cut" | "recomp" | "maintain" | "bulk";

export type GeneratorInputs = {
  trainingDaysPerWeek: number;
  exerciseTypes: string[]; // [] = sem preferência (usa todos)
  hasKneeIssues: boolean;
  goal: Goal;
  biotipo?: "ectomorfo" | "mesomorfo" | "endomorfo";
};

export type GeneratedWorkoutExercise = {
  name: string;
  sets: number;
  reps: string;
  rest: number;
  useBar?: boolean;
};

export type GeneratedWorkoutTemplate = {
  templateId: string;
  name: string;
  day: string;
  focus: string;
  order: number;
  exercises: GeneratedWorkoutExercise[];
};

/* =================================================================
   Filtros + helpers
   ================================================================= */

function filterLibrary(inputs: GeneratorInputs): ExerciseSeed[] {
  return EXERCISE_LIBRARY.filter((ex) => {
    if (inputs.hasKneeIssues && ex.hasImpact) return false;
    if (inputs.exerciseTypes.length > 0 && !inputs.exerciseTypes.includes(ex.type)) {
      // Permite cardio se tem cardio nos prefs OU se não tem prefs
      // (cardio é só pra splits que pedem)
      return false;
    }
    return true;
  });
}

/** Pesca o melhor exercício pro muscle group dado, evitando duplicação. */
function pick(
  candidates: ExerciseSeed[],
  used: Set<string>,
  filter: (ex: ExerciseSeed) => boolean,
  preferCompound = false,
): ExerciseSeed | null {
  const eligible = candidates.filter((ex) => !used.has(ex.name) && filter(ex));
  if (eligible.length === 0) return null;
  if (preferCompound) {
    const compound = eligible.find((ex) => ex.isCompound);
    if (compound) return compound;
  }
  return eligible[0];
}

/* =================================================================
   Reps/rest adjustment por objetivo
   ================================================================= */

function repsForGoal(goal: Goal, isCompound: boolean): { sets: number; reps: string; rest: number } {
  switch (goal) {
    case "cut":
      return isCompound
        ? { sets: 3, reps: "8-10", rest: 90 }
        : { sets: 3, reps: "12-15", rest: 60 };
    case "recomp":
      return isCompound
        ? { sets: 4, reps: "6-8", rest: 120 }
        : { sets: 3, reps: "10-12", rest: 75 };
    case "maintain":
      return isCompound
        ? { sets: 3, reps: "6-10", rest: 120 }
        : { sets: 3, reps: "10-12", rest: 75 };
    case "bulk":
      return isCompound
        ? { sets: 4, reps: "5-6", rest: 180 }
        : { sets: 4, reps: "8-10", rest: 120 };
  }
}

/* =================================================================
   Builders de split
   ================================================================= */

function buildSplit(
  candidates: ExerciseSeed[],
  goal: Goal,
  muscleSlots: { muscle: string; compound?: boolean }[],
): GeneratedWorkoutExercise[] {
  const used = new Set<string>();
  const out: GeneratedWorkoutExercise[] = [];
  for (const slot of muscleSlots) {
    const ex = pick(
      candidates,
      used,
      (e) => e.primaryMuscle === slot.muscle,
      slot.compound,
    );
    if (!ex) continue;
    used.add(ex.name);
    const { sets, reps, rest } = repsForGoal(goal, ex.isCompound);
    out.push({
      name: ex.name,
      sets,
      reps,
      rest,
      useBar: ex.useBar,
    });
  }
  return out;
}

/* =================================================================
   Geração de templates por nº de dias
   ================================================================= */

function generateFullBody(
  candidates: ExerciseSeed[],
  goal: Goal,
): GeneratedWorkoutTemplate[] {
  return [
    {
      templateId: "full_body",
      name: "Full Body",
      day: "Dia 1 · ~45 min",
      focus: "Corpo todo",
      order: 1,
      exercises: buildSplit(candidates, goal, [
        { muscle: "quads", compound: true },
        { muscle: "chest", compound: true },
        { muscle: "back", compound: true },
        { muscle: "shoulders" },
        { muscle: "core" },
      ]),
    },
  ];
}

function generateUpperLower(
  candidates: ExerciseSeed[],
  goal: Goal,
): GeneratedWorkoutTemplate[] {
  return [
    {
      templateId: "upper",
      name: "Upper",
      day: "Dia 1 · ~45 min",
      focus: "Peito · Costas · Ombros · Braços",
      order: 1,
      exercises: buildSplit(candidates, goal, [
        { muscle: "chest", compound: true },
        { muscle: "back", compound: true },
        { muscle: "shoulders" },
        { muscle: "biceps" },
        { muscle: "triceps" },
      ]),
    },
    {
      templateId: "lower",
      name: "Lower",
      day: "Dia 2 · ~45 min",
      focus: "Quads · Posterior · Glúteo · Panturrilha",
      order: 2,
      exercises: buildSplit(candidates, goal, [
        { muscle: "quads", compound: true },
        { muscle: "hamstrings", compound: true },
        { muscle: "glutes" },
        { muscle: "calves" },
        { muscle: "core" },
      ]),
    },
  ];
}

function generatePPL(
  candidates: ExerciseSeed[],
  goal: Goal,
): GeneratedWorkoutTemplate[] {
  return [
    {
      templateId: "push",
      name: "Push",
      day: "Dia 1 · ~40 min",
      focus: "Peito · Ombros · Tríceps",
      order: 1,
      exercises: buildSplit(candidates, goal, [
        { muscle: "chest", compound: true },
        { muscle: "shoulders", compound: true },
        { muscle: "chest" },
        { muscle: "shoulders" },
        { muscle: "triceps" },
      ]),
    },
    {
      templateId: "pull",
      name: "Pull",
      day: "Dia 2 · ~40 min",
      focus: "Costas · Bíceps · Ombro posterior",
      order: 2,
      exercises: buildSplit(candidates, goal, [
        { muscle: "back", compound: true },
        { muscle: "back" },
        { muscle: "back" },
        { muscle: "biceps" },
        { muscle: "biceps" },
      ]),
    },
    {
      templateId: "legs",
      name: "Legs",
      day: "Dia 3 · ~40 min",
      focus: "Quads · Posterior · Glúteo · Panturrilha",
      order: 3,
      exercises: buildSplit(candidates, goal, [
        { muscle: "quads", compound: true },
        { muscle: "hamstrings", compound: true },
        { muscle: "quads" },
        { muscle: "glutes" },
        { muscle: "calves" },
      ]),
    },
  ];
}

function generate5M_4days(
  candidates: ExerciseSeed[],
  goal: Goal,
): GeneratedWorkoutTemplate[] {
  // Mantém estrutura do protocolo 5M atual: Upper A (push) / Lower A (quad) /
  // Upper B (pull) / Lower B (hinge). 5 exercícios cada, ~40 min.
  return [
    {
      templateId: "upperA",
      name: "Upper A · Push",
      day: "Dia 1 · ~40 min",
      focus: "Peito · Ombros · Tríceps",
      order: 1,
      exercises: buildSplit(candidates, goal, [
        { muscle: "chest", compound: true },
        { muscle: "chest" },
        { muscle: "shoulders", compound: true },
        { muscle: "shoulders" },
        { muscle: "triceps" },
      ]),
    },
    {
      templateId: "lowerA",
      name: "Lower A · Quad",
      day: "Dia 2 · ~40 min",
      focus: "Quadríceps · Panturrilha · Core",
      order: 2,
      exercises: buildSplit(candidates, goal, [
        { muscle: "quads", compound: true },
        { muscle: "quads" },
        { muscle: "quads" },
        { muscle: "calves" },
        { muscle: "core" },
      ]),
    },
    {
      templateId: "upperB",
      name: "Upper B · Pull",
      day: "Dia 4 · ~40 min",
      focus: "Costas · Bíceps · Ombro posterior",
      order: 3,
      exercises: buildSplit(candidates, goal, [
        { muscle: "back", compound: true },
        { muscle: "back" },
        { muscle: "back" },
        { muscle: "biceps" },
        { muscle: "biceps" },
      ]),
    },
    {
      templateId: "lowerB",
      name: "Lower B · Hinge",
      day: "Dia 5 · ~40 min",
      focus: "Posterior · Glúteo · Panturrilha",
      order: 4,
      exercises: buildSplit(candidates, goal, [
        { muscle: "hamstrings", compound: true },
        { muscle: "glutes", compound: true },
        { muscle: "hamstrings" },
        { muscle: "glutes" },
        { muscle: "calves" },
      ]),
    },
  ];
}

function generateABCDE_5days(
  candidates: ExerciseSeed[],
  goal: Goal,
): GeneratedWorkoutTemplate[] {
  return [
    ...generatePPL(candidates, goal),
    {
      templateId: "upper_extra",
      name: "Upper extra",
      day: "Dia 4 · ~40 min",
      focus: "Volume adicional em peito/costas",
      order: 4,
      exercises: buildSplit(candidates, goal, [
        { muscle: "chest", compound: true },
        { muscle: "back", compound: true },
        { muscle: "shoulders" },
        { muscle: "biceps" },
        { muscle: "triceps" },
      ]),
    },
    {
      templateId: "lower_extra",
      name: "Lower extra",
      day: "Dia 5 · ~40 min",
      focus: "Volume adicional em pernas",
      order: 5,
      exercises: buildSplit(candidates, goal, [
        { muscle: "hamstrings", compound: true },
        { muscle: "quads" },
        { muscle: "glutes" },
        { muscle: "calves" },
        { muscle: "core" },
      ]),
    },
  ];
}

function generatePPL_6days(
  candidates: ExerciseSeed[],
  goal: Goal,
): GeneratedWorkoutTemplate[] {
  const ppl = generatePPL(candidates, goal);
  // Duplica com variação (templates B reutilizam outros exercícios)
  const usedNames = new Set(ppl.flatMap((t) => t.exercises.map((e) => e.name)));
  const remaining = candidates.filter((e) => !usedNames.has(e.name));

  return [
    ...ppl,
    {
      templateId: "push_b",
      name: "Push B",
      day: "Dia 4 · ~40 min",
      focus: "Variação · Peito · Ombros · Tríceps",
      order: 4,
      exercises: buildSplit(remaining, goal, [
        { muscle: "chest", compound: true },
        { muscle: "shoulders" },
        { muscle: "chest" },
        { muscle: "shoulders" },
        { muscle: "triceps" },
      ]),
    },
    {
      templateId: "pull_b",
      name: "Pull B",
      day: "Dia 5 · ~40 min",
      focus: "Variação · Costas · Bíceps",
      order: 5,
      exercises: buildSplit(remaining, goal, [
        { muscle: "back", compound: true },
        { muscle: "back" },
        { muscle: "back" },
        { muscle: "biceps" },
      ]),
    },
    {
      templateId: "legs_b",
      name: "Legs B",
      day: "Dia 6 · ~40 min",
      focus: "Variação · Posterior · Glúteo",
      order: 6,
      exercises: buildSplit(remaining, goal, [
        { muscle: "hamstrings", compound: true },
        { muscle: "glutes" },
        { muscle: "quads" },
        { muscle: "calves" },
      ]),
    },
  ];
}

/* =================================================================
   API pública
   ================================================================= */

export function generateWorkoutTemplates(
  inputs: GeneratorInputs,
): GeneratedWorkoutTemplate[] {
  const candidates = filterLibrary(inputs);
  if (candidates.length === 0) {
    // fallback: usa biblioteca completa sem filtros (não devia chegar aqui)
    return generate5M_4days(EXERCISE_LIBRARY, inputs.goal);
  }
  const days = inputs.trainingDaysPerWeek;
  if (days <= 1) return generateFullBody(candidates, inputs.goal);
  if (days === 2) return generateUpperLower(candidates, inputs.goal);
  if (days === 3) return generatePPL(candidates, inputs.goal);
  if (days === 4) return generate5M_4days(candidates, inputs.goal);
  if (days === 5) return generateABCDE_5days(candidates, inputs.goal);
  return generatePPL_6days(candidates, inputs.goal);
}

export function generateSupplementPlan(inputs: GeneratorInputs): SupplementSeed[] {
  return SUPPLEMENT_TEMPLATES[inputs.goal];
}
