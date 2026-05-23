import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, type MutationCtx, query } from "./_generated/server";
import {
  ensureProfileForIdentity,
  findProfileForRequest,
  resolveIdentity,
} from "./lib/identity";

/* =================================================================
   supplementPlan — lista de suplementos do user (gerada via onboarding)
   ================================================================= */

const suppDoc = v.object({
  _id: v.id("supplementPlan"),
  _creationTime: v.number(),
  profileId: v.id("profiles"),
  suppId: v.string(),
  name: v.string(),
  dose: v.string(),
  timing: v.string(),
  why: v.optional(v.string()),
  priority: v.optional(
    v.union(
      v.literal("essencial"),
      v.literal("recomendado"),
      v.literal("opcional"),
    ),
  ),
  order: v.number(),
  active: v.boolean(),
});

export const list = query({
  args: { deviceId: v.optional(v.string()), includeInactive: v.optional(v.boolean()) },
  returns: v.array(suppDoc),
  handler: async (ctx, { deviceId, includeInactive }) => {
    const profile = await findProfileForRequest(ctx, deviceId);
    if (!profile) return [];
    const rows = await ctx.db
      .query("supplementPlan")
      .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
      .collect();
    const filtered = includeInactive ? rows : rows.filter((r) => r.active);
    return filtered.sort((a, b) => a.order - b.order);
  },
});

/* Helper interno usado pelo planGenerator. */
export async function replaceSupplementsForProfile(
  ctx: MutationCtx,
  profileId: Id<"profiles">,
  items: {
    suppId: string;
    name: string;
    dose: string;
    timing: string;
    why?: string;
    priority?: "essencial" | "recomendado" | "opcional";
  }[],
): Promise<void> {
  // Apaga rows antigos do profile
  const existing = await ctx.db
    .query("supplementPlan")
    .withIndex("by_profile", (q) => q.eq("profileId", profileId))
    .collect();
  for (const row of existing) await ctx.db.delete(row._id);

  // Insere novos
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    await ctx.db.insert("supplementPlan", {
      profileId,
      suppId: it.suppId,
      name: it.name,
      dose: it.dose,
      timing: it.timing,
      why: it.why,
      priority: it.priority,
      order: i,
      active: true,
    });
  }
}

export const setActive = mutation({
  args: {
    deviceId: v.optional(v.string()),
    suppId: v.string(),
    active: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, { deviceId, suppId, active }) => {
    const identity = await resolveIdentity(ctx, deviceId);
    const profileId = await ensureProfileForIdentity(ctx, identity);
    const row = await ctx.db
      .query("supplementPlan")
      .withIndex("by_profile_supp", (q) =>
        q.eq("profileId", profileId).eq("suppId", suppId),
      )
      .unique();
    if (row) await ctx.db.patch(row._id, { active });
    return null;
  },
});
