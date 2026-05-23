import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import {
  ensureProfileForIdentity,
  findProfileForRequest,
  resolveIdentity,
} from "./lib/identity";

/* =================================================================
   mealEntries — uma linha por item de refeição
   ----------------------------------------------------------------
   Macros snapshotted no momento da escrita (denormalizados),
   pra resistir a edits do food original e pra totals rápidos.
   ================================================================= */

const VALID_MEAL_TYPES = new Set([
  "cafe",
  "lanche_manha",
  "almoco",
  "pre_treino",
  "jantar",
  "pre_sono",
]);

const entryValidator = v.object({
  _id: v.id("mealEntries"),
  _creationTime: v.number(),
  profileId: v.id("profiles"),
  date: v.string(),
  mealType: v.string(),
  foodId: v.optional(v.id("foods")),
  foodName: v.string(),
  portionGrams: v.number(),
  kcal: v.number(),
  protein: v.number(),
  carbs: v.number(),
  fat: v.number(),
});

/* =================================================================
   Queries
   ================================================================= */

export const getDay = query({
  args: { deviceId: v.optional(v.string()), date: v.string() },
  returns: v.array(entryValidator),
  handler: async (ctx, { deviceId, date }) => {
    const profile = await findProfileForRequest(ctx, deviceId);
    if (!profile) return [];
    const entries = await ctx.db
      .query("mealEntries")
      .withIndex("by_profile_date", (q) =>
        q.eq("profileId", profile._id).eq("date", date),
      )
      .collect();
    entries.sort((a, b) => a._creationTime - b._creationTime);
    return entries;
  },
});

export const dailyTotals = query({
  args: { deviceId: v.optional(v.string()), date: v.string() },
  returns: v.object({
    kcal: v.number(),
    protein: v.number(),
    carbs: v.number(),
    fat: v.number(),
    count: v.number(),
  }),
  handler: async (ctx, { deviceId, date }) => {
    const profile = await findProfileForRequest(ctx, deviceId);
    if (!profile) return { kcal: 0, protein: 0, carbs: 0, fat: 0, count: 0 };
    const entries = await ctx.db
      .query("mealEntries")
      .withIndex("by_profile_date", (q) =>
        q.eq("profileId", profile._id).eq("date", date),
      )
      .collect();
    return sumMacros(entries);
  },
});

/* =================================================================
   Mutations
   ================================================================= */

export const addEntry = mutation({
  args: {
    deviceId: v.optional(v.string()),
    date: v.string(),
    mealType: v.string(),
    foodId: v.optional(v.id("foods")),
    foodName: v.string(),
    portionGrams: v.number(),
    kcal: v.number(),
    protein: v.number(),
    carbs: v.number(),
    fat: v.number(),
  },
  returns: v.id("mealEntries"),
  handler: async (ctx, args) => {
    const { deviceId, ...payload } = args;
    if (!VALID_MEAL_TYPES.has(payload.mealType)) {
      throw new Error(`Invalid mealType: ${payload.mealType}`);
    }
    if (payload.portionGrams <= 0) throw new Error("portionGrams must be > 0");
    if (!payload.foodName.trim()) throw new Error("foodName required");

    const identity = await resolveIdentity(ctx, deviceId);
    const profileId = await ensureProfileForIdentity(ctx, identity);

    return await ctx.db.insert("mealEntries", {
      profileId,
      date: payload.date,
      mealType: payload.mealType,
      foodId: payload.foodId,
      foodName: payload.foodName.trim(),
      portionGrams: payload.portionGrams,
      kcal: payload.kcal,
      protein: payload.protein,
      carbs: payload.carbs,
      fat: payload.fat,
    });
  },
});

export const deleteEntry = mutation({
  args: { deviceId: v.optional(v.string()), entryId: v.id("mealEntries") },
  returns: v.null(),
  handler: async (ctx, { deviceId, entryId }) => {
    const profile = await findProfileForRequest(ctx, deviceId);
    if (!profile) return null;
    const entry = await ctx.db.get(entryId);
    if (entry && entry.profileId === profile._id) {
      await ctx.db.delete(entryId);
    }
    return null;
  },
});

function sumMacros(entries: Doc<"mealEntries">[]): {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  count: number;
} {
  const totals = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  for (const e of entries) {
    totals.kcal += e.kcal;
    totals.protein += e.protein;
    totals.carbs += e.carbs;
    totals.fat += e.fat;
  }
  return {
    kcal: round1(totals.kcal),
    protein: round1(totals.protein),
    carbs: round1(totals.carbs),
    fat: round1(totals.fat),
    count: entries.length,
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
