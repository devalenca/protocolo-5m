import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, type MutationCtx } from "./_generated/server";
import { replaceSupplementsForProfile } from "./supplementPlan";
import {
  ensureProfileForIdentity,
  resolveIdentity,
} from "./lib/identity";
import {
  generateSupplementPlan,
  generateWorkoutTemplates,
  type GeneratorInputs,
} from "./lib/planGenerator";

/* =================================================================
   applyGeneratedPlan — chama generator + substitui dados do user
   ----------------------------------------------------------------
   - Apaga workoutTemplates existentes do profile, insere os novos
   - Apaga supplementPlan existente, insere os novos
   - mealPlan.goals é atualizado pelo onboarding diretamente (não aqui)
   - habitItems não é tocado (default 5M habits permanecem)
   ================================================================= */

async function replaceWorkoutTemplatesForProfile(
  ctx: MutationCtx,
  profileId: Id<"profiles">,
  templates: ReturnType<typeof generateWorkoutTemplates>,
): Promise<void> {
  const existing = await ctx.db
    .query("workoutTemplates")
    .withIndex("by_profile", (q) => q.eq("profileId", profileId))
    .collect();
  for (const row of existing) await ctx.db.delete(row._id);

  for (const tpl of templates) {
    await ctx.db.insert("workoutTemplates", {
      profileId,
      templateId: tpl.templateId,
      name: tpl.name,
      day: tpl.day,
      focus: tpl.focus,
      order: tpl.order,
      exercises: tpl.exercises.map((e) => ({
        name: e.name,
        sets: e.sets,
        reps: e.reps,
        rest: e.rest,
        useBar: e.useBar,
      })),
    });
  }
}

export const applyGeneratedPlan = mutation({
  args: {
    deviceId: v.optional(v.string()),
    trainingDaysPerWeek: v.number(),
    exerciseTypes: v.array(v.string()),
    hasKneeIssues: v.boolean(),
    goal: v.union(
      v.literal("cut"),
      v.literal("recomp"),
      v.literal("maintain"),
      v.literal("bulk"),
    ),
    biotipo: v.optional(
      v.union(
        v.literal("ectomorfo"),
        v.literal("mesomorfo"),
        v.literal("endomorfo"),
      ),
    ),
  },
  returns: v.object({
    templatesGenerated: v.number(),
    supplementsGenerated: v.number(),
  }),
  handler: async (ctx, args) => {
    const { deviceId, ...rest } = args;
    const identity = await resolveIdentity(ctx, deviceId);
    const profileId = await ensureProfileForIdentity(ctx, identity);

    const inputs: GeneratorInputs = {
      trainingDaysPerWeek: rest.trainingDaysPerWeek,
      exerciseTypes: rest.exerciseTypes,
      hasKneeIssues: rest.hasKneeIssues,
      goal: rest.goal,
      biotipo: rest.biotipo,
    };

    const templates = generateWorkoutTemplates(inputs);
    await replaceWorkoutTemplatesForProfile(ctx, profileId, templates);

    const supplements = generateSupplementPlan(inputs);
    await replaceSupplementsForProfile(ctx, profileId, supplements);

    return {
      templatesGenerated: templates.length,
      supplementsGenerated: supplements.length,
    };
  },
});
