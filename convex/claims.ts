import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, type MutationCtx } from "./_generated/server";
import { todayStrUTC } from "./lib/dates";

/* =================================================================
   claimDeviceProfile
   ----------------------------------------------------------------
   Roda logo após signIn no client. Conecta os dados anônimos
   (chaveados por deviceId) ao usuário autenticado.
   Cenários:
   - User logou pela 1ª vez nesse device: anexa deviceId → userId
   - User já tem profile (de outro device) e agora tem 2: merge
   - Sem profile de deviceId: no-op
   ================================================================= */

async function mergeProfiles(
  ctx: MutationCtx,
  src: Doc<"profiles">,
  dst: Doc<"profiles">,
): Promise<void> {
  // Move checklistEntries (resolve conflito por data: dst vence)
  const srcEntries = await ctx.db
    .query("checklistEntries")
    .withIndex("by_profile", (q) => q.eq("profileId", src._id))
    .collect();

  for (const entry of srcEntries) {
    const existing = await ctx.db
      .query("checklistEntries")
      .withIndex("by_profile_date", (q) =>
        q.eq("profileId", dst._id).eq("date", entry.date),
      )
      .unique();
    if (existing) {
      // Merge items: união, sem perder marcações já feitas no dst
      const mergedItems = { ...entry.items, ...existing.items };
      await ctx.db.patch(existing._id, { items: mergedItems });
      await ctx.db.delete(entry._id);
    } else {
      await ctx.db.patch(entry._id, { profileId: dst._id });
    }
  }

  // Workouts: simplesmente reattacha (cada um é único por timestamp)
  const srcWorkouts = await ctx.db
    .query("workouts")
    .withIndex("by_profile", (q) => q.eq("profileId", src._id))
    .collect();
  for (const w of srcWorkouts) {
    await ctx.db.patch(w._id, { profileId: dst._id });
  }

  // Achievements: dedupe por achievementId
  const dstAch = await ctx.db
    .query("achievementsUnlocked")
    .withIndex("by_profile", (q) => q.eq("profileId", dst._id))
    .collect();
  const have = new Set(dstAch.map((a) => a.achievementId));

  const srcAch = await ctx.db
    .query("achievementsUnlocked")
    .withIndex("by_profile", (q) => q.eq("profileId", src._id))
    .collect();
  for (const a of srcAch) {
    if (have.has(a.achievementId)) {
      await ctx.db.delete(a._id);
    } else {
      await ctx.db.patch(a._id, { profileId: dst._id });
    }
  }

  // Mantém a startDate mais antiga
  if (src.startDate < dst.startDate) {
    await ctx.db.patch(dst._id, { startDate: src.startDate });
  }

  // Profile anônimo sai
  await ctx.db.delete(src._id);
}

export const claimDeviceProfile = mutation({
  args: { deviceId: v.string() },
  returns: v.object({
    action: v.union(
      v.literal("noop"),
      v.literal("attached"),
      v.literal("merged"),
      v.literal("created"),
    ),
    profileId: v.id("profiles"),
  }),
  handler: async (ctx, { deviceId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated. Call claimDeviceProfile after signIn.");
    }

    const deviceProfile = await ctx.db
      .query("profiles")
      .withIndex("by_device", (q) => q.eq("deviceId", deviceId))
      .unique();

    const userProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    // Caso 1: nada existe → cria profile do user
    if (!deviceProfile && !userProfile) {
      const id = await ctx.db.insert("profiles", {
        userId,
        startDate: todayStrUTC(),
      });
      return { action: "created" as const, profileId: id };
    }

    // Caso 2: só tem profile do device → anexa userId
    if (deviceProfile && !userProfile) {
      // Já é deste userId? (idempotência)
      if (deviceProfile.userId === userId) {
        return { action: "noop" as const, profileId: deviceProfile._id };
      }
      await ctx.db.patch(deviceProfile._id, { userId, deviceId: undefined });
      return { action: "attached" as const, profileId: deviceProfile._id };
    }

    // Caso 3: só tem profile do user → no-op (não rouba profile de outro user)
    if (!deviceProfile && userProfile) {
      return { action: "noop" as const, profileId: userProfile._id };
    }

    // Caso 4: ambos existem e são diferentes → merge
    if (deviceProfile && userProfile && deviceProfile._id !== userProfile._id) {
      await mergeProfiles(ctx, deviceProfile, userProfile);
      return { action: "merged" as const, profileId: userProfile._id };
    }

    // Caso 5: ambos são o mesmo doc (deviceId+userId já no mesmo profile)
    return { action: "noop" as const, profileId: userProfile!._id };
  },
});
