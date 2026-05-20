import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import {
  internalMutation,
  mutation,
  type MutationCtx,
  query,
  type QueryCtx,
} from "./_generated/server";
import {
  ACHIEVEMENTS,
  CHECKLIST_IDS,
  PROTOCOL_DAYS,
  STREAK_THRESHOLD_PCT,
  TOTAL_CHECKLIST_ITEMS,
  type AchievementSnapshot,
} from "./lib/constants";
import { addDaysStr, daysBetween, todayStrUTC } from "./lib/dates";
import {
  ensureProfileForIdentity,
  findProfileForRequest,
  resolveIdentity,
} from "./lib/identity";

/* =================================================================
   Snapshot — pré-computa números pros tests dos achievements.
   ================================================================= */

async function buildSnapshot(
  ctx: QueryCtx | MutationCtx,
  profile: Doc<"profiles">,
): Promise<AchievementSnapshot> {
  const entries = await ctx.db
    .query("checklistEntries")
    .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
    .collect();

  const checklistDayCount = entries.length;
  const hasPerfectDay = entries.some((e) =>
    CHECKLIST_IDS.every((id) => e.items[id]),
  );

  const today = todayStrUTC();
  const byDate = new Map(entries.map((e) => [e.date, e.items]));
  const todayItems = byDate.get(today);
  const todayPct = todayItems
    ? Math.round(
        (CHECKLIST_IDS.filter((id) => todayItems[id]).length / TOTAL_CHECKLIST_ITEMS) *
          100,
      )
    : 0;
  let cursor = today;
  if (todayPct < STREAK_THRESHOLD_PCT) cursor = addDaysStr(today, -1);
  let streak = 0;
  while (streak < 365) {
    const items = byDate.get(cursor);
    const pct = items
      ? Math.round(
          (CHECKLIST_IDS.filter((id) => items[id]).length / TOTAL_CHECKLIST_ITEMS) * 100,
        )
      : 0;
    if (pct >= STREAK_THRESHOLD_PCT) {
      streak++;
      cursor = addDaysStr(cursor, -1);
    } else {
      break;
    }
  }

  const workouts = await ctx.db
    .query("workouts")
    .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
    .collect();

  const workoutCount = workouts.length;

  const prSet = new Set<string>();
  for (const w of workouts) {
    for (const ex of w.exercises) {
      if (ex.sets.some((s) => s.weight && s.reps)) {
        prSet.add(w.workoutId + "|" + ex.name);
      }
    }
  }
  const prCount = prSet.size;

  const daysSinceStart = Math.max(1, daysBetween(profile.startDate, today) + 1);

  return {
    checklistDayCount,
    workoutCount,
    prCount,
    streak,
    hasPerfectDay,
    daysSinceStart: Math.min(daysSinceStart, PROTOCOL_DAYS),
  };
}

/* =================================================================
   Queries / Mutations
   ================================================================= */

export const list = query({
  args: { deviceId: v.optional(v.string()) },
  returns: v.array(
    v.object({
      _id: v.id("achievementsUnlocked"),
      _creationTime: v.number(),
      profileId: v.id("profiles"),
      achievementId: v.string(),
      unlockedAt: v.number(),
    }),
  ),
  handler: async (ctx, { deviceId }) => {
    const profile = await findProfileForRequest(ctx, deviceId);
    if (!profile) return [];
    return await ctx.db
      .query("achievementsUnlocked")
      .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
      .collect();
  },
});

export const checkAndUnlock = mutation({
  args: { deviceId: v.optional(v.string()) },
  returns: v.array(v.string()),
  handler: async (ctx, { deviceId }) => {
    const identity = await resolveIdentity(ctx, deviceId);
    const profileId = await ensureProfileForIdentity(ctx, identity);
    const profile = await ctx.db.get(profileId);
    if (!profile) return [];

    const snapshot = await buildSnapshot(ctx, profile);

    const unlocked = await ctx.db
      .query("achievementsUnlocked")
      .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
      .collect();
    const have = new Set(unlocked.map((u) => u.achievementId));

    const newly: string[] = [];
    const now = Date.now();
    for (const a of ACHIEVEMENTS) {
      if (have.has(a.id)) continue;
      if (a.test(snapshot)) {
        await ctx.db.insert("achievementsUnlocked", {
          profileId: profile._id,
          achievementId: a.id,
          unlockedAt: now,
        });
        newly.push(a.id);
      }
    }
    return newly;
  },
});

export const _recordUnlock = internalMutation({
  args: {
    profileId: v.id("profiles"),
    achievementId: v.string(),
    unlockedAt: v.number(),
  },
  returns: v.id("achievementsUnlocked"),
  handler: async (ctx, args): Promise<Id<"achievementsUnlocked">> => {
    return await ctx.db.insert("achievementsUnlocked", args);
  },
});
