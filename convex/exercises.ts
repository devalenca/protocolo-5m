import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { EXERCISE_LIBRARY } from "./lib/exerciseLibrary";
import { findProfileForRequest } from "./lib/identity";

/* =================================================================
   exercises — biblioteca global (~50 exercícios PT-BR)
   ----------------------------------------------------------------
   profileId undefined = global (seedado uma vez); setado = custom.
   Usado pelo planGenerator pra montar workoutTemplates.
   ================================================================= */

const exerciseDoc = v.object({
  _id: v.id("exercises"),
  _creationTime: v.number(),
  profileId: v.optional(v.id("profiles")),
  name: v.string(),
  searchKey: v.string(),
  primaryMuscle: v.string(),
  secondaryMuscles: v.optional(v.array(v.string())),
  equipment: v.string(),
  type: v.string(),
  difficulty: v.union(
    v.literal("facil"),
    v.literal("medio"),
    v.literal("dificil"),
  ),
  hasImpact: v.boolean(),
  isCompound: v.boolean(),
  defaultSets: v.number(),
  defaultRepsLow: v.number(),
  defaultRepsHigh: v.number(),
  defaultRest: v.number(),
  useBar: v.optional(v.boolean()),
  cue: v.optional(v.string()),
});

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

/* =================================================================
   Queries
   ================================================================= */

export const countGlobal = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const all = await ctx.db
      .query("exercises")
      .withIndex("by_profile", (q) => q.eq("profileId", undefined))
      .collect();
    return all.length;
  },
});

export const list = query({
  args: { deviceId: v.optional(v.string()), muscle: v.optional(v.string()) },
  returns: v.array(exerciseDoc),
  handler: async (ctx, { deviceId, muscle }) => {
    const profile = await findProfileForRequest(ctx, deviceId);

    const global = await ctx.db
      .query("exercises")
      .withIndex("by_profile", (q) => q.eq("profileId", undefined))
      .collect();
    const custom = profile
      ? await ctx.db
          .query("exercises")
          .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
          .collect()
      : [];

    const all = [...global, ...custom];
    return muscle ? all.filter((e) => e.primaryMuscle === muscle) : all;
  },
});

export const search = query({
  args: { deviceId: v.optional(v.string()), query: v.string(), limit: v.optional(v.number()) },
  returns: v.array(exerciseDoc),
  handler: async (ctx, { deviceId, query: rawQ, limit }) => {
    const lim = limit ?? 20;
    const q = normalize(rawQ);
    const profile = await findProfileForRequest(ctx, deviceId);

    if (!q) {
      // sem busca: retorna primeiros N globais
      const global = await ctx.db
        .query("exercises")
        .withIndex("by_profile", (qb) => qb.eq("profileId", undefined))
        .take(lim);
      return global;
    }

    const globalHits = await ctx.db
      .query("exercises")
      .withSearchIndex("search_name", (qb) =>
        qb.search("searchKey", q).eq("profileId", undefined),
      )
      .take(lim);

    if (!profile) return globalHits;

    const customHits = await ctx.db
      .query("exercises")
      .withSearchIndex("search_name", (qb) =>
        qb.search("searchKey", q).eq("profileId", profile._id),
      )
      .take(lim);

    return [...customHits, ...globalHits].slice(0, lim);
  },
});

/* =================================================================
   Mutations
   ================================================================= */

export const seedDefaultsIfEmpty = mutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("exercises")
      .withIndex("by_profile", (q) => q.eq("profileId", undefined))
      .take(1);
    if (existing.length > 0) return 0;

    let inserted = 0;
    for (const ex of EXERCISE_LIBRARY) {
      await ctx.db.insert("exercises", {
        ...ex,
        searchKey: normalize(ex.name),
      });
      inserted++;
    }
    return inserted;
  },
});
