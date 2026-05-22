import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { FOOD_SEED } from "./lib/foodSeed";
import {
  ensureProfileForIdentity,
  findProfileForRequest,
  resolveIdentity,
} from "./lib/identity";

/* =================================================================
   foods — base de alimentos (global + custom por user)
   ----------------------------------------------------------------
   - Global: profileId undefined, inserido via seedDefaultsIfEmpty.
   - Custom: profileId setado, criado via addCustom.
   - Busca usa searchIndex (Convex full-text) sobre searchKey.
   ================================================================= */

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

const foodValidator = v.object({
  _id: v.id("foods"),
  _creationTime: v.number(),
  profileId: v.optional(v.id("profiles")),
  name: v.string(),
  brand: v.optional(v.string()),
  searchKey: v.string(),
  kcal: v.number(),
  protein: v.number(),
  carbs: v.number(),
  fat: v.number(),
  fiber: v.optional(v.number()),
  defaultPortionGrams: v.optional(v.number()),
  defaultPortionLabel: v.optional(v.string()),
});

/* =================================================================
   Queries
   ================================================================= */

/**
 * Busca por texto. Retorna até `limit` resultados, priorizando
 * globais e custom do user. Se query vazia, devolve top alimentos
 * globais por ordem alfabética.
 */
export const search = query({
  args: {
    deviceId: v.optional(v.string()),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(foodValidator),
  handler: async (ctx, { deviceId, query: q, limit }) => {
    const max = limit ?? 25;
    const profile = await findProfileForRequest(ctx, deviceId);
    const profileId = profile?._id;

    const trimmed = normalize(q);

    if (trimmed.length === 0) {
      // Sem query: lista os globais (até max) + custom do user
      const globals = await ctx.db
        .query("foods")
        .withIndex("by_profile", (qb) => qb.eq("profileId", undefined))
        .take(max);
      globals.sort((a, b) => a.name.localeCompare(b.name));

      if (!profileId) return globals.slice(0, max);

      const customs = await ctx.db
        .query("foods")
        .withIndex("by_profile", (qb) => qb.eq("profileId", profileId))
        .take(max);
      return [...customs, ...globals].slice(0, max);
    }

    // Com query: usa searchIndex
    const globals = await ctx.db
      .query("foods")
      .withSearchIndex("search_name", (sb) =>
        sb.search("searchKey", trimmed).eq("profileId", undefined),
      )
      .take(max);

    let customs: Doc<"foods">[] = [];
    if (profileId) {
      customs = await ctx.db
        .query("foods")
        .withSearchIndex("search_name", (sb) =>
          sb.search("searchKey", trimmed).eq("profileId", profileId),
        )
        .take(max);
    }

    return [...customs, ...globals].slice(0, max);
  },
});

export const countGlobal = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const all = await ctx.db
      .query("foods")
      .withIndex("by_profile", (qb) => qb.eq("profileId", undefined))
      .take(1);
    return all.length;
  },
});

/* =================================================================
   Mutations
   ================================================================= */

/** Insere os alimentos do seed se ainda não existir nenhum global. */
export const seedDefaultsIfEmpty = mutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("foods")
      .withIndex("by_profile", (qb) => qb.eq("profileId", undefined))
      .take(1);
    if (existing.length > 0) return 0;

    let inserted = 0;
    for (const f of FOOD_SEED) {
      await ctx.db.insert("foods", {
        name: f.name,
        brand: f.brand,
        searchKey: normalize(f.name + (f.brand ? " " + f.brand : "")),
        kcal: f.kcal,
        protein: f.protein,
        carbs: f.carbs,
        fat: f.fat,
        fiber: f.fiber,
        defaultPortionGrams: f.defaultPortionGrams,
        defaultPortionLabel: f.defaultPortionLabel,
      });
      inserted++;
    }
    return inserted;
  },
});

export const addCustom = mutation({
  args: {
    deviceId: v.optional(v.string()),
    name: v.string(),
    brand: v.optional(v.string()),
    kcal: v.number(),
    protein: v.number(),
    carbs: v.number(),
    fat: v.number(),
    fiber: v.optional(v.number()),
    defaultPortionGrams: v.optional(v.number()),
  },
  returns: v.id("foods"),
  handler: async (ctx, args) => {
    const { deviceId, ...payload } = args;
    if (!payload.name.trim()) throw new Error("name required");
    if (payload.kcal < 0 || payload.protein < 0 || payload.carbs < 0 || payload.fat < 0) {
      throw new Error("macros must be non-negative");
    }
    const identity = await resolveIdentity(ctx, deviceId);
    const profileId = await ensureProfileForIdentity(ctx, identity);
    return await ctx.db.insert("foods", {
      profileId,
      name: payload.name.trim(),
      brand: payload.brand?.trim() || undefined,
      searchKey: normalize(
        payload.name + (payload.brand ? " " + payload.brand : ""),
      ),
      kcal: payload.kcal,
      protein: payload.protein,
      carbs: payload.carbs,
      fat: payload.fat,
      fiber: payload.fiber,
      defaultPortionGrams: payload.defaultPortionGrams,
    });
  },
});

export const deleteCustom = mutation({
  args: { deviceId: v.optional(v.string()), foodId: v.id("foods") },
  returns: v.null(),
  handler: async (ctx, { deviceId, foodId }) => {
    const profile = await findProfileForRequest(ctx, deviceId);
    if (!profile) return null;
    const food = await ctx.db.get(foodId);
    if (food && food.profileId === profile._id) {
      await ctx.db.delete(foodId);
    }
    return null;
  },
});
