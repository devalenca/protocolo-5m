import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  ensureProfileForIdentity,
  findProfileForRequest,
  resolveIdentity,
} from "./lib/identity";

/* =================================================================
   habitItems — checklist customizável por profile
   ----------------------------------------------------------------
   Cada profile tem sua lista de hábitos. Soft-delete via active=false
   pra preservar histórico de checklistEntries.
   ================================================================= */

const habitDoc = v.object({
  _id: v.id("habitItems"),
  _creationTime: v.number(),
  profileId: v.id("profiles"),
  itemId: v.string(),
  text: v.string(),
  sub: v.optional(v.string()),
  order: v.number(),
  active: v.boolean(),
});

export const list = query({
  args: { deviceId: v.optional(v.string()), includeInactive: v.optional(v.boolean()) },
  returns: v.array(habitDoc),
  handler: async (ctx, { deviceId, includeInactive }) => {
    const profile = await findProfileForRequest(ctx, deviceId);
    if (!profile) return [];
    const rows = await ctx.db
      .query("habitItems")
      .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
      .collect();
    const filtered = includeInactive ? rows : rows.filter((r) => r.active);
    return filtered.sort((a, b) => a.order - b.order);
  },
});

/** Upsert por (profileId, itemId). */
export const save = mutation({
  args: {
    deviceId: v.optional(v.string()),
    itemId: v.string(),
    text: v.string(),
    sub: v.optional(v.string()),
    order: v.number(),
    active: v.optional(v.boolean()),
  },
  returns: v.id("habitItems"),
  handler: async (ctx, args) => {
    const { deviceId, ...payload } = args;
    const identity = await resolveIdentity(ctx, deviceId);
    const profileId = await ensureProfileForIdentity(ctx, identity);

    const existing = await ctx.db
      .query("habitItems")
      .withIndex("by_profile_item", (q) =>
        q.eq("profileId", profileId).eq("itemId", payload.itemId),
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        text: payload.text,
        sub: payload.sub,
        order: payload.order,
        active: payload.active ?? existing.active,
      });
      return existing._id;
    }
    return await ctx.db.insert("habitItems", {
      profileId,
      itemId: payload.itemId,
      text: payload.text,
      sub: payload.sub,
      order: payload.order,
      active: payload.active ?? true,
    });
  },
});

export const setActive = mutation({
  args: {
    deviceId: v.optional(v.string()),
    itemId: v.string(),
    active: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, { deviceId, itemId, active }) => {
    const profile = await findProfileForRequest(ctx, deviceId);
    if (!profile) return null;
    const row = await ctx.db
      .query("habitItems")
      .withIndex("by_profile_item", (q) =>
        q.eq("profileId", profile._id).eq("itemId", itemId),
      )
      .unique();
    if (row) await ctx.db.patch(row._id, { active });
    return null;
  },
});
