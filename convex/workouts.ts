import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, type QueryCtx, query } from "./_generated/server";
import { WORKOUT_IDS, type WorkoutId } from "./lib/constants";
import { todayStrUTC } from "./lib/dates";
import {
  ensureProfileForIdentity,
  findProfileForRequest,
  resolveIdentity,
} from "./lib/identity";

/* =================================================================
   Helpers
   ================================================================= */

async function listWorkoutsFor(
  ctx: QueryCtx,
  profileId: Id<"profiles">,
): Promise<Doc<"workouts">[]> {
  return await ctx.db
    .query("workouts")
    .withIndex("by_profile", (q) => q.eq("profileId", profileId))
    .collect();
}

function bestSetByWeight(sets: { weight: string; reps: string }[]) {
  const valid = sets.filter((s) => s.weight && s.reps);
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => (Number(a.weight) > Number(b.weight) ? a : b));
}

/* =================================================================
   Validators reutilizáveis
   ================================================================= */

const setValidator = v.object({
  weight: v.string(),
  reps: v.string(),
  rpe: v.optional(v.string()),
  notes: v.optional(v.string()),
});

const exerciseValidator = v.object({
  name: v.string(),
  sets: v.array(setValidator),
});

const workoutDocValidator = v.object({
  _id: v.id("workouts"),
  _creationTime: v.number(),
  profileId: v.id("profiles"),
  workoutId: v.string(),
  date: v.string(),
  startedAt: v.number(),
  finishedAt: v.number(),
  exercises: v.array(exerciseValidator),
});

/* =================================================================
   Queries
   ================================================================= */

export const listRecent = query({
  args: { deviceId: v.optional(v.string()), limit: v.optional(v.number()) },
  returns: v.array(workoutDocValidator),
  handler: async (ctx, { deviceId, limit }) => {
    const profile = await findProfileForRequest(ctx, deviceId);
    if (!profile) return [];
    const all = await listWorkoutsFor(ctx, profile._id);
    return all
      .sort((a, b) => b.finishedAt - a.finishedAt)
      .slice(0, limit ?? 10);
  },
});

export const getPreviousBest = query({
  args: {
    deviceId: v.optional(v.string()),
    workoutId: v.string(),
    exerciseName: v.string(),
  },
  returns: v.union(
    v.object({
      weight: v.number(),
      reps: v.number(),
      date: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, { deviceId, workoutId, exerciseName }) => {
    const profile = await findProfileForRequest(ctx, deviceId);
    if (!profile) return null;
    const all = await listWorkoutsFor(ctx, profile._id);
    const sorted = all.sort((a, b) => b.finishedAt - a.finishedAt);
    for (const w of sorted) {
      if (w.workoutId !== workoutId) continue;
      const ex = w.exercises.find((e) => e.name === exerciseName);
      if (!ex) continue;
      const best = bestSetByWeight(ex.sets);
      if (!best) continue;
      return {
        weight: Number(best.weight),
        reps: Number(best.reps),
        date: w.date,
      };
    }
    return null;
  },
});

export const getAllPRs = query({
  args: { deviceId: v.optional(v.string()) },
  returns: v.array(
    v.object({
      exerciseName: v.string(),
      weight: v.number(),
      reps: v.number(),
      date: v.string(),
      workoutId: v.string(),
    }),
  ),
  handler: async (ctx, { deviceId }) => {
    const profile = await findProfileForRequest(ctx, deviceId);
    if (!profile) return [];
    const all = await listWorkoutsFor(ctx, profile._id);
    const prs = new Map<
      string,
      { weight: number; reps: number; date: string; workoutId: string }
    >();
    for (const w of all) {
      for (const ex of w.exercises) {
        const valid = ex.sets.filter((s) => s.weight && s.reps);
        if (valid.length === 0) continue;
        const best = valid.reduce((a, b) => {
          const aScore = Number(a.weight) * Number(a.reps);
          const bScore = Number(b.weight) * Number(b.reps);
          return bScore > aScore ? b : a;
        });
        const entry = {
          weight: Number(best.weight),
          reps: Number(best.reps),
          date: w.date,
          workoutId: w.workoutId,
        };
        const existing = prs.get(ex.name);
        if (!existing || entry.weight * entry.reps > existing.weight * existing.reps) {
          prs.set(ex.name, entry);
        }
      }
    }
    return Array.from(prs.entries())
      .map(([exerciseName, e]) => ({ exerciseName, ...e }))
      .sort((a, b) => b.weight * b.reps - a.weight * a.reps);
  },
});

export const getExerciseHistory = query({
  args: {
    deviceId: v.optional(v.string()),
    exerciseName: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      workoutId: v.string(),
      date: v.string(),
      finishedAt: v.number(),
      sets: v.array(
        v.object({
          weight: v.string(),
          reps: v.string(),
          rpe: v.optional(v.string()),
          notes: v.optional(v.string()),
        }),
      ),
      /** e1RM máximo da sessão (Epley) */
      bestE1RM: v.number(),
      /** Tonnage da sessão (sum weight×reps das séries com carga) */
      tonnage: v.number(),
    }),
  ),
  handler: async (ctx, { deviceId, exerciseName, limit }) => {
    const profile = await findProfileForRequest(ctx, deviceId);
    if (!profile) return [];
    const all = await listWorkoutsFor(ctx, profile._id);
    const sessions = all
      .map((w) => {
        const ex = w.exercises.find((e) => e.name === exerciseName);
        if (!ex) return null;
        const validSets = ex.sets.filter((s) => s.weight && s.reps);
        if (validSets.length === 0) return null;
        let bestE1RM = 0;
        let tonnage = 0;
        for (const s of validSets) {
          const we = Number(s.weight);
          const rp = Number(s.reps);
          tonnage += we * rp;
          const e1 = rp === 1 ? we : we * (1 + rp / 30);
          if (e1 > bestE1RM) bestE1RM = e1;
        }
        return {
          workoutId: w.workoutId,
          date: w.date,
          finishedAt: w.finishedAt,
          sets: ex.sets,
          bestE1RM: Math.round(bestE1RM * 10) / 10,
          tonnage: Math.round(tonnage),
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
    sessions.sort((a, b) => b.finishedAt - a.finishedAt);
    return sessions.slice(0, limit ?? 25);
  },
});

export const suggestNext = query({
  args: { deviceId: v.optional(v.string()) },
  returns: v.string(),
  handler: async (ctx, { deviceId }) => {
    const profile = await findProfileForRequest(ctx, deviceId);
    if (!profile) return WORKOUT_IDS[0];
    const all = await listWorkoutsFor(ctx, profile._id);
    if (all.length === 0) return WORKOUT_IDS[0];
    const sorted = all.sort((a, b) => b.finishedAt - a.finishedAt);
    const last = sorted[0];
    const idx = WORKOUT_IDS.indexOf(last.workoutId as WorkoutId);
    if (idx === -1) return WORKOUT_IDS[0];
    return WORKOUT_IDS[(idx + 1) % WORKOUT_IDS.length];
  },
});

/* =================================================================
   Mutations
   ================================================================= */

export const finishWorkout = mutation({
  args: {
    deviceId: v.optional(v.string()),
    workoutId: v.string(),
    startedAt: v.number(),
    exercises: v.array(exerciseValidator),
  },
  returns: v.id("workouts"),
  handler: async (ctx, { deviceId, workoutId, startedAt, exercises }) => {
    const identity = await resolveIdentity(ctx, deviceId);
    const profileId = await ensureProfileForIdentity(ctx, identity);

    if (!WORKOUT_IDS.includes(workoutId as WorkoutId)) {
      throw new Error(`Invalid workoutId: ${workoutId}`);
    }

    return await ctx.db.insert("workouts", {
      profileId,
      workoutId,
      date: todayStrUTC(),
      startedAt,
      finishedAt: Date.now(),
      exercises,
    });
  },
});
