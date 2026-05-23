import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, type QueryCtx, query } from "./_generated/server";
import {
  ensureProfileForIdentity,
  findProfileForRequest,
  resolveIdentity,
} from "./lib/identity";

/* =================================================================
   Admin — acesso restrito a profiles com isAdmin=true
   ----------------------------------------------------------------
   - isAdmin é setado manualmente via dashboard ou bootstrap mutation
   - bootstrapFirstAdmin: idempotente, faz o primeiro profile que
     ligar virar admin (uso só na primeira vez)
   - listAllUsers retorna lista completa com info para a tela /admin/users
   ================================================================= */

async function requireAdmin(
  ctx: QueryCtx,
  deviceId: string | undefined,
): Promise<{ profile: Doc<"profiles">; settings: Doc<"profileSettings"> | null }> {
  const profile = await findProfileForRequest(ctx, deviceId);
  if (!profile) throw new Error("Não autenticado");
  const settings = await ctx.db
    .query("profileSettings")
    .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
    .unique();
  if (!settings || !settings.isAdmin) {
    throw new Error("Apenas administradores podem acessar");
  }
  return { profile, settings };
}

/* =================================================================
   Permission check — para a UI saber se mostra link de /admin
   ================================================================= */

export const isAdmin = query({
  args: { deviceId: v.optional(v.string()) },
  returns: v.boolean(),
  handler: async (ctx, { deviceId }) => {
    const profile = await findProfileForRequest(ctx, deviceId);
    if (!profile) return false;
    const settings = await ctx.db
      .query("profileSettings")
      .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
      .unique();
    return Boolean(settings?.isAdmin);
  },
});

/* =================================================================
   List all users (admin only)
   ================================================================= */

export const listAllUsers = query({
  args: { deviceId: v.optional(v.string()) },
  returns: v.array(
    v.object({
      profileId: v.id("profiles"),
      startDate: v.string(),
      displayName: v.optional(v.string()),
      email: v.optional(v.string()),
      age: v.optional(v.number()),
      sex: v.optional(v.string()),
      goal: v.optional(v.string()),
      heightCm: v.optional(v.number()),
      onboardedAt: v.optional(v.number()),
      isAdmin: v.optional(v.boolean()),
      latestWeight: v.optional(v.number()),
      latestWeightDate: v.optional(v.string()),
      workoutsCount: v.number(),
      hasUserId: v.boolean(),
    }),
  ),
  handler: async (ctx, { deviceId }) => {
    await requireAdmin(ctx, deviceId);

    const profiles = await ctx.db.query("profiles").collect();
    const out = [];
    for (const p of profiles) {
      const settings = await ctx.db
        .query("profileSettings")
        .withIndex("by_profile", (q) => q.eq("profileId", p._id))
        .unique();

      const email = p.userId
        ? (await ctx.db.get(p.userId))?.email
        : undefined;

      const allMetrics = await ctx.db
        .query("bodyMetrics")
        .withIndex("by_profile_date", (q) => q.eq("profileId", p._id))
        .collect();
      const latest = allMetrics.sort((a, b) =>
        b.date.localeCompare(a.date),
      )[0];

      const workouts = await ctx.db
        .query("workouts")
        .withIndex("by_profile", (q) => q.eq("profileId", p._id))
        .collect();

      out.push({
        profileId: p._id,
        startDate: p.startDate,
        displayName: settings?.displayName,
        email,
        age: settings?.age,
        sex: settings?.sex,
        goal: settings?.goal,
        heightCm: settings?.heightCm,
        onboardedAt: settings?.onboardedAt,
        isAdmin: settings?.isAdmin,
        latestWeight: latest?.weight,
        latestWeightDate: latest?.date,
        workoutsCount: workouts.length,
        hasUserId: Boolean(p.userId),
      });
    }
    // Mais recentes primeiro
    return out.sort((a, b) => (b.onboardedAt ?? 0) - (a.onboardedAt ?? 0));
  },
});

/* =================================================================
   Bootstrap admin
   ----------------------------------------------------------------
   Idempotente: se ainda não existe nenhum admin, marca o profile
   chamador como admin. Útil pra inicializar o primeiro usuário.
   ================================================================= */
export const bootstrapFirstAdmin = mutation({
  args: { deviceId: v.optional(v.string()) },
  returns: v.boolean(),
  handler: async (ctx, { deviceId }) => {
    const identity = await resolveIdentity(ctx, deviceId);
    const profileId = await ensureProfileForIdentity(ctx, identity);

    const anyAdminSettings = await ctx.db.query("profileSettings").collect();
    const hasAdmin = anyAdminSettings.some((s) => s.isAdmin);
    if (hasAdmin) return false;

    const ownSettings = anyAdminSettings.find((s) => s.profileId === profileId);
    if (ownSettings) {
      await ctx.db.patch(ownSettings._id, { isAdmin: true });
    } else {
      await ctx.db.insert("profileSettings", { profileId, isAdmin: true });
    }
    return true;
  },
});

/* =================================================================
   Toggle admin (admin only)
   ================================================================= */
export const setAdmin = mutation({
  args: {
    deviceId: v.optional(v.string()),
    targetProfileId: v.id("profiles"),
    isAdmin: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, { deviceId, targetProfileId, isAdmin }) => {
    await requireAdmin(ctx, deviceId);

    const settings = await ctx.db
      .query("profileSettings")
      .withIndex("by_profile", (q) => q.eq("profileId", targetProfileId))
      .unique();

    if (settings) {
      await ctx.db.patch(settings._id, { isAdmin });
    } else {
      await ctx.db.insert("profileSettings", {
        profileId: targetProfileId,
        isAdmin,
      });
    }
    return null;
  },
});
