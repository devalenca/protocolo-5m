import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { WORKOUT_IDS, type WorkoutId } from "./lib/constants";
import { todayStrUTC } from "./lib/dates";
import {
  ensureProfileForIdentity,
  findProfile,
  resolveIdentity,
} from "./lib/identity";

/* =================================================================
   Migration — import do localStorage (protocolo5m_v2) pro Convex.
   Detecta identidade automaticamente: se logado, importa pra o profile
   do user; senão, pro profile do deviceId.
   ================================================================= */

const setValidator = v.object({
  weight: v.string(),
  reps: v.string(),
});

const exerciseValidator = v.object({
  name: v.string(),
  sets: v.array(setValidator),
});

const workoutBlobValidator = v.object({
  id: v.optional(v.string()),
  workoutId: v.string(),
  date: v.string(),
  startedAt: v.optional(v.number()),
  finishedAt: v.optional(v.number()),
  exercises: v.array(exerciseValidator),
});

const blobValidator = v.object({
  checklist: v.record(v.string(), v.record(v.string(), v.boolean())),
  workouts: v.array(workoutBlobValidator),
  achievements: v.array(v.string()),
  startDate: v.string(),
});

export const importLocalStorage = mutation({
  args: {
    deviceId: v.optional(v.string()),
    blob: blobValidator,
  },
  returns: v.object({
    profileId: v.id("profiles"),
    daysImported: v.number(),
    workoutsImported: v.number(),
    achievementsImported: v.number(),
    skipped: v.object({
      duplicateWorkouts: v.number(),
      duplicateAchievements: v.number(),
    }),
  }),
  handler: async (ctx, { deviceId, blob }) => {
    const identity = await resolveIdentity(ctx, deviceId);

    // Garante profile (cria com startDate do blob se ainda não existir)
    let profile = await findProfile(ctx, identity);
    if (!profile) {
      const newProfileId = await ensureProfileForIdentity(ctx, identity);
      const fetched = await ctx.db.get(newProfileId);
      if (!fetched) throw new Error("Profile creation failed");
      profile = fetched;
      // Sobrescreve startDate com o do blob se for mais antigo
      if (blob.startDate && blob.startDate < profile.startDate) {
        await ctx.db.patch(profile._id, { startDate: blob.startDate });
      }
    }

    // 1. Checklist — sobrescreve por data (blob é autoritativo)
    let daysImported = 0;
    for (const [date, items] of Object.entries(blob.checklist)) {
      if (!items || Object.keys(items).length === 0) continue;
      const existing = await ctx.db
        .query("checklistEntries")
        .withIndex("by_profile_date", (q) =>
          q.eq("profileId", profile._id).eq("date", date),
        )
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, { items });
      } else {
        await ctx.db.insert("checklistEntries", {
          profileId: profile._id,
          date,
          items,
        });
      }
      daysImported++;
    }

    // 2. Workouts — deduplica por (workoutId, date, finishedAt)
    const existingWorkouts = await ctx.db
      .query("workouts")
      .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
      .collect();
    const seen = new Set(
      existingWorkouts.map((w) => `${w.workoutId}|${w.date}|${w.finishedAt}`),
    );

    let workoutsImported = 0;
    let duplicateWorkouts = 0;
    for (const w of blob.workouts) {
      if (!WORKOUT_IDS.includes(w.workoutId as WorkoutId)) continue;
      const finishedAt = w.finishedAt ?? Date.now();
      const key = `${w.workoutId}|${w.date}|${finishedAt}`;
      if (seen.has(key)) {
        duplicateWorkouts++;
        continue;
      }
      await ctx.db.insert("workouts", {
        profileId: profile._id,
        workoutId: w.workoutId,
        date: w.date,
        startedAt: w.startedAt ?? finishedAt,
        finishedAt,
        exercises: w.exercises,
      });
      seen.add(key);
      workoutsImported++;
    }

    // 3. Achievements
    const existingAch = await ctx.db
      .query("achievementsUnlocked")
      .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
      .collect();
    const haveAch = new Set(existingAch.map((a) => a.achievementId));

    let achievementsImported = 0;
    let duplicateAchievements = 0;
    const now = Date.now();
    for (const id of blob.achievements) {
      if (haveAch.has(id)) {
        duplicateAchievements++;
        continue;
      }
      await ctx.db.insert("achievementsUnlocked", {
        profileId: profile._id,
        achievementId: id,
        unlockedAt: now,
      });
      achievementsImported++;
    }

    void todayStrUTC; // tree-shake hint

    return {
      profileId: profile._id,
      daysImported,
      workoutsImported,
      achievementsImported,
      skipped: { duplicateWorkouts, duplicateAchievements },
    };
  },
});
