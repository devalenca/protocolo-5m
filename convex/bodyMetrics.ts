import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import {
  type MutationCtx,
  mutation,
  type QueryCtx,
  query,
} from "./_generated/server";
import { addDaysStr, todayStrUTC } from "./lib/dates";
import {
  ensureProfileForIdentity,
  findProfileForRequest,
  resolveIdentity,
} from "./lib/identity";

/* =================================================================
   bodyMetrics — peso + medidas corporais
   ----------------------------------------------------------------
   Uma entrada por data (upsert por profileId + date).
   Peso é obrigatório; medidas são opcionais.
   ================================================================= */

const metricFields = v.object({
  _id: v.id("bodyMetrics"),
  _creationTime: v.number(),
  profileId: v.id("profiles"),
  date: v.string(),
  weight: v.number(),
  bodyFatPct: v.optional(v.number()),
  waist: v.optional(v.number()),
  chest: v.optional(v.number()),
  arm: v.optional(v.number()),
  hip: v.optional(v.number()),
  thigh: v.optional(v.number()),
  notes: v.optional(v.string()),
});

async function getEntry(
  ctx: QueryCtx | MutationCtx,
  profileId: Id<"profiles">,
  date: string,
): Promise<Doc<"bodyMetrics"> | null> {
  return await ctx.db
    .query("bodyMetrics")
    .withIndex("by_profile_date", (q) =>
      q.eq("profileId", profileId).eq("date", date),
    )
    .unique();
}

/* =================================================================
   Queries
   ================================================================= */

export const listAll = query({
  args: { deviceId: v.optional(v.string()) },
  returns: v.array(metricFields),
  handler: async (ctx, { deviceId }) => {
    const profile = await findProfileForRequest(ctx, deviceId);
    if (!profile) return [];
    const entries = await ctx.db
      .query("bodyMetrics")
      .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
      .collect();
    entries.sort((a, b) => a.date.localeCompare(b.date));
    return entries;
  },
});

export const getLatest = query({
  args: { deviceId: v.optional(v.string()) },
  returns: v.union(metricFields, v.null()),
  handler: async (ctx, { deviceId }) => {
    const profile = await findProfileForRequest(ctx, deviceId);
    if (!profile) return null;
    const entries = await ctx.db
      .query("bodyMetrics")
      .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
      .collect();
    if (entries.length === 0) return null;
    entries.sort((a, b) => b.date.localeCompare(a.date));
    return entries[0];
  },
});

export const getRange = query({
  args: { deviceId: v.optional(v.string()), days: v.number() },
  returns: v.array(metricFields),
  handler: async (ctx, { deviceId, days }) => {
    const profile = await findProfileForRequest(ctx, deviceId);
    if (!profile) return [];
    const today = todayStrUTC();
    const since = addDaysStr(today, -(days - 1));
    const entries = await ctx.db
      .query("bodyMetrics")
      .withIndex("by_profile_date", (q) =>
        q.eq("profileId", profile._id).gte("date", since),
      )
      .collect();
    entries.sort((a, b) => a.date.localeCompare(b.date));
    return entries;
  },
});

export const getDay = query({
  args: { deviceId: v.optional(v.string()), date: v.string() },
  returns: v.union(metricFields, v.null()),
  handler: async (ctx, { deviceId, date }) => {
    const profile = await findProfileForRequest(ctx, deviceId);
    if (!profile) return null;
    return await getEntry(ctx, profile._id, date);
  },
});

/* =================================================================
   Mutations
   ================================================================= */

export const upsertEntry = mutation({
  args: {
    deviceId: v.optional(v.string()),
    date: v.string(),
    weight: v.number(),
    bodyFatPct: v.optional(v.number()),
    waist: v.optional(v.number()),
    chest: v.optional(v.number()),
    arm: v.optional(v.number()),
    hip: v.optional(v.number()),
    thigh: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  returns: v.id("bodyMetrics"),
  handler: async (ctx, args) => {
    const { deviceId, ...payload } = args;
    if (!Number.isFinite(payload.weight) || payload.weight <= 0) {
      throw new Error("weight must be a positive number");
    }

    const identity = await resolveIdentity(ctx, deviceId);
    const profileId = await ensureProfileForIdentity(ctx, identity);

    const existing = await getEntry(ctx, profileId, payload.date);
    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }
    return await ctx.db.insert("bodyMetrics", { profileId, ...payload });
  },
});

export const deleteEntry = mutation({
  args: { deviceId: v.optional(v.string()), date: v.string() },
  returns: v.null(),
  handler: async (ctx, { deviceId, date }) => {
    const profile = await findProfileForRequest(ctx, deviceId);
    if (!profile) return null;
    const existing = await getEntry(ctx, profile._id, date);
    if (existing) await ctx.db.delete(existing._id);
    return null;
  },
});
