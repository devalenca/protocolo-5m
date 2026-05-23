import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { todayStrUTC } from "./dates";
import {
  DEFAULT_DIET_GOALS,
  DEFAULT_HABIT_ITEMS,
  DEFAULT_MEAL_SLOTS,
  DEFAULT_WORKOUT_TEMPLATES,
} from "./defaultPlan";

/* =================================================================
   Identidade unificada
   ----------------------------------------------------------------
   Toda função do app passa por aqui:
     - Se o request tem auth context: usa userId (logado).
     - Senão: cai pro deviceId (anônimo).
   Profile lookup prioriza userId quando ambos existem.
   ================================================================= */

export type Identity =
  | { type: "user"; userId: Id<"users"> }
  | { type: "device"; deviceId: string };

/**
 * Resolve a identidade do request. Se houver token Convex Auth válido,
 * retorna `{ type: "user", userId }`. Senão, exige `deviceId` no input.
 */
export async function resolveIdentity(
  ctx: QueryCtx | MutationCtx,
  deviceId: string | undefined,
): Promise<Identity> {
  const userId = await getAuthUserId(ctx);
  if (userId) return { type: "user", userId };
  if (!deviceId) {
    throw new Error("Anonymous calls require a deviceId.");
  }
  return { type: "device", deviceId };
}

/**
 * Busca o profile correspondente à identidade. Retorna null se não existe.
 */
export async function findProfile(
  ctx: QueryCtx | MutationCtx,
  identity: Identity,
): Promise<Doc<"profiles"> | null> {
  if (identity.type === "user") {
    return await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.userId))
      .unique();
  }
  return await ctx.db
    .query("profiles")
    .withIndex("by_device", (q) => q.eq("deviceId", identity.deviceId))
    .unique();
}

/**
 * Cria o profile se não existir. Idempotente.
 * Em profile novo, popula o plano padrão 5M (workouts, meals, hábitos).
 * Em profile existente, garante seed completo (caso falte alguma tabela).
 */
export async function ensureProfileForIdentity(
  ctx: MutationCtx,
  identity: Identity,
): Promise<Id<"profiles">> {
  const existing = await findProfile(ctx, identity);
  if (existing) {
    await seedDefaultsForProfile(ctx, existing._id);
    return existing._id;
  }

  const newId =
    identity.type === "user"
      ? await ctx.db.insert("profiles", {
          userId: identity.userId,
          startDate: todayStrUTC(),
        })
      : await ctx.db.insert("profiles", {
          deviceId: identity.deviceId,
          startDate: todayStrUTC(),
        });

  await seedDefaultsForProfile(ctx, newId);
  return newId;
}

/**
 * Idempotente. Para cada tabela do plano, se o profile não tem nenhuma
 * row, popula com o default 5M. Pode ser chamado em qualquer mutation.
 */
export async function seedDefaultsForProfile(
  ctx: MutationCtx,
  profileId: Id<"profiles">,
): Promise<void> {
  // Workout templates
  const wt = await ctx.db
    .query("workoutTemplates")
    .withIndex("by_profile", (q) => q.eq("profileId", profileId))
    .first();
  if (!wt) {
    for (const tpl of DEFAULT_WORKOUT_TEMPLATES) {
      await ctx.db.insert("workoutTemplates", { profileId, ...tpl });
    }
  }

  // Meal plan
  const mp = await ctx.db
    .query("mealPlan")
    .withIndex("by_profile", (q) => q.eq("profileId", profileId))
    .unique();
  if (!mp) {
    await ctx.db.insert("mealPlan", {
      profileId,
      goals: DEFAULT_DIET_GOALS,
      slots: DEFAULT_MEAL_SLOTS,
    });
  }

  // Habit items
  const hi = await ctx.db
    .query("habitItems")
    .withIndex("by_profile", (q) => q.eq("profileId", profileId))
    .first();
  if (!hi) {
    for (let i = 0; i < DEFAULT_HABIT_ITEMS.length; i++) {
      const h = DEFAULT_HABIT_ITEMS[i];
      await ctx.db.insert("habitItems", {
        profileId,
        itemId: h.itemId,
        text: h.text,
        sub: h.sub,
        order: i,
        active: true,
      });
    }
  }
}

/**
 * Resolve identidade + busca profile em uma chamada. Atalho de leitura.
 */
export async function findProfileForRequest(
  ctx: QueryCtx | MutationCtx,
  deviceId: string | undefined,
): Promise<Doc<"profiles"> | null> {
  const identity = await resolveIdentity(ctx, deviceId).catch(() => null);
  if (!identity) return null;
  return await findProfile(ctx, identity);
}
