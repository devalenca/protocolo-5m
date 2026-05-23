import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  ensureProfileForIdentity,
  findProfileForRequest,
  resolveIdentity,
} from "./lib/identity";

/* =================================================================
   mealPlan — metas (kcal/P/C/G) + slots de refeição por profile
   1 doc por profile.
   ================================================================= */

const slotValidator = v.object({
  id: v.string(),
  label: v.string(),
  time: v.string(),
  hint: v.optional(v.string()),
});

const goalsValidator = v.object({
  kcal: v.number(),
  protein: v.number(),
  carbs: v.number(),
  fat: v.number(),
});

const mealPlanDoc = v.object({
  _id: v.id("mealPlan"),
  _creationTime: v.number(),
  profileId: v.id("profiles"),
  goals: goalsValidator,
  slots: v.array(slotValidator),
});

export const get = query({
  args: { deviceId: v.optional(v.string()) },
  returns: v.union(mealPlanDoc, v.null()),
  handler: async (ctx, { deviceId }) => {
    const profile = await findProfileForRequest(ctx, deviceId);
    if (!profile) return null;
    return await ctx.db
      .query("mealPlan")
      .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
      .unique();
  },
});

export const upsert = mutation({
  args: {
    deviceId: v.optional(v.string()),
    goals: goalsValidator,
    slots: v.array(slotValidator),
  },
  returns: v.id("mealPlan"),
  handler: async (ctx, { deviceId, goals, slots }) => {
    const identity = await resolveIdentity(ctx, deviceId);
    const profileId = await ensureProfileForIdentity(ctx, identity);

    const existing = await ctx.db
      .query("mealPlan")
      .withIndex("by_profile", (q) => q.eq("profileId", profileId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { goals, slots });
      return existing._id;
    }
    return await ctx.db.insert("mealPlan", { profileId, goals, slots });
  },
});
