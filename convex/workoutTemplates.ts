import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  ensureProfileForIdentity,
  findProfileForRequest,
  resolveIdentity,
} from "./lib/identity";

/* =================================================================
   workoutTemplates — splits editáveis por profile
   ================================================================= */

const exerciseValidator = v.object({
  name: v.string(),
  sets: v.number(),
  reps: v.string(),
  rest: v.number(),
  useBar: v.optional(v.boolean()),
});

const templateDoc = v.object({
  _id: v.id("workoutTemplates"),
  _creationTime: v.number(),
  profileId: v.id("profiles"),
  templateId: v.string(),
  name: v.string(),
  day: v.string(),
  focus: v.string(),
  order: v.number(),
  exercises: v.array(exerciseValidator),
});

export const list = query({
  args: { deviceId: v.optional(v.string()) },
  returns: v.array(templateDoc),
  handler: async (ctx, { deviceId }) => {
    const profile = await findProfileForRequest(ctx, deviceId);
    if (!profile) return [];
    const rows = await ctx.db
      .query("workoutTemplates")
      .withIndex("by_profile_order", (q) => q.eq("profileId", profile._id))
      .collect();
    return rows.sort((a, b) => a.order - b.order);
  },
});

export const getByTemplateId = query({
  args: { deviceId: v.optional(v.string()), templateId: v.string() },
  returns: v.union(templateDoc, v.null()),
  handler: async (ctx, { deviceId, templateId }) => {
    const profile = await findProfileForRequest(ctx, deviceId);
    if (!profile) return null;
    return await ctx.db
      .query("workoutTemplates")
      .withIndex("by_profile_template", (q) =>
        q.eq("profileId", profile._id).eq("templateId", templateId),
      )
      .unique();
  },
});

/** Upsert por (profileId, templateId). */
export const save = mutation({
  args: {
    deviceId: v.optional(v.string()),
    templateId: v.string(),
    name: v.string(),
    day: v.string(),
    focus: v.string(),
    order: v.number(),
    exercises: v.array(exerciseValidator),
  },
  returns: v.id("workoutTemplates"),
  handler: async (ctx, args) => {
    const { deviceId, ...payload } = args;
    const identity = await resolveIdentity(ctx, deviceId);
    const profileId = await ensureProfileForIdentity(ctx, identity);

    const existing = await ctx.db
      .query("workoutTemplates")
      .withIndex("by_profile_template", (q) =>
        q.eq("profileId", profileId).eq("templateId", payload.templateId),
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }
    return await ctx.db.insert("workoutTemplates", { profileId, ...payload });
  },
});

export const remove = mutation({
  args: { deviceId: v.optional(v.string()), templateId: v.string() },
  returns: v.null(),
  handler: async (ctx, { deviceId, templateId }) => {
    const profile = await findProfileForRequest(ctx, deviceId);
    if (!profile) return null;
    const row = await ctx.db
      .query("workoutTemplates")
      .withIndex("by_profile_template", (q) =>
        q.eq("profileId", profile._id).eq("templateId", templateId),
      )
      .unique();
    if (row) await ctx.db.delete(row._id);
    return null;
  },
});
