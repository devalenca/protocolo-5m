import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  ensureProfileForIdentity,
  findProfileForRequest,
  resolveIdentity,
} from "./lib/identity";

/* =================================================================
   profileSettings — onboarding answers + identidade pessoal
   ================================================================= */

const settingsDoc = v.object({
  _id: v.id("profileSettings"),
  _creationTime: v.number(),
  profileId: v.id("profiles"),
  displayName: v.optional(v.string()),
  age: v.optional(v.number()),
  sex: v.optional(v.union(v.literal("M"), v.literal("F"))),
  heightCm: v.optional(v.number()),
  targetWeight: v.optional(v.number()),
  goal: v.optional(
    v.union(
      v.literal("cut"),
      v.literal("maintain"),
      v.literal("recomp"),
      v.literal("bulk"),
    ),
  ),
  biotipo: v.optional(
    v.union(
      v.literal("ectomorfo"),
      v.literal("mesomorfo"),
      v.literal("endomorfo"),
    ),
  ),
  activityLevel: v.optional(
    v.union(
      v.literal("sedentary"),
      v.literal("light"),
      v.literal("moderate"),
      v.literal("active"),
      v.literal("very_active"),
    ),
  ),
  trainingDaysPerWeek: v.optional(v.number()),
  sessionDurationMin: v.optional(v.number()),
  exerciseTypes: v.optional(v.array(v.string())),
  hasKneeIssues: v.optional(v.boolean()),
  dietaryRestrictions: v.optional(v.array(v.string())),
  notes: v.optional(v.string()),
  onboardedAt: v.optional(v.number()),
});

export const get = query({
  args: { deviceId: v.optional(v.string()) },
  returns: v.union(settingsDoc, v.null()),
  handler: async (ctx, { deviceId }) => {
    const profile = await findProfileForRequest(ctx, deviceId);
    if (!profile) return null;
    return await ctx.db
      .query("profileSettings")
      .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
      .unique();
  },
});

/**
 * Upsert: cria o doc se não existir, atualiza campos passados. Não toca
 * campos omitidos. `onboardedAt` é setado quando o caller manda
 * `markOnboarded: true`.
 */
export const upsert = mutation({
  args: {
    deviceId: v.optional(v.string()),
    displayName: v.optional(v.string()),
    age: v.optional(v.number()),
    sex: v.optional(v.union(v.literal("M"), v.literal("F"))),
    heightCm: v.optional(v.number()),
    targetWeight: v.optional(v.number()),
    goal: v.optional(
      v.union(
        v.literal("cut"),
        v.literal("maintain"),
        v.literal("recomp"),
        v.literal("bulk"),
      ),
    ),
    biotipo: v.optional(
      v.union(
        v.literal("ectomorfo"),
        v.literal("mesomorfo"),
        v.literal("endomorfo"),
      ),
    ),
    activityLevel: v.optional(
      v.union(
        v.literal("sedentary"),
        v.literal("light"),
        v.literal("moderate"),
        v.literal("active"),
        v.literal("very_active"),
      ),
    ),
    trainingDaysPerWeek: v.optional(v.number()),
    sessionDurationMin: v.optional(v.number()),
    exerciseTypes: v.optional(v.array(v.string())),
    hasKneeIssues: v.optional(v.boolean()),
    dietaryRestrictions: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    markOnboarded: v.optional(v.boolean()),
  },
  returns: v.id("profileSettings"),
  handler: async (ctx, args) => {
    const { deviceId, markOnboarded, ...patch } = args;
    const identity = await resolveIdentity(ctx, deviceId);
    const profileId = await ensureProfileForIdentity(ctx, identity);

    const cleanPatch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(patch)) {
      if (v !== undefined) cleanPatch[k] = v;
    }
    if (markOnboarded) cleanPatch.onboardedAt = Date.now();

    const existing = await ctx.db
      .query("profileSettings")
      .withIndex("by_profile", (q) => q.eq("profileId", profileId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, cleanPatch);
      return existing._id;
    }
    return await ctx.db.insert("profileSettings", { profileId, ...cleanPatch });
  },
});
