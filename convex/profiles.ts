import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  ensureProfileForIdentity,
  findProfileForRequest,
  resolveIdentity,
} from "./lib/identity";

/* =================================================================
   Profiles — identidade unificada (userId quando logado, deviceId anônimo)
   ================================================================= */

/**
 * Idempotente. Cria o profile na primeira vez que essa identidade aparece.
 * Pode ser chamado com deviceId (anônimo) ou após login (auth context).
 */
export const ensureProfile = mutation({
  args: { deviceId: v.optional(v.string()) },
  returns: v.id("profiles"),
  handler: async (ctx, { deviceId }) => {
    const identity = await resolveIdentity(ctx, deviceId);
    return await ensureProfileForIdentity(ctx, identity);
  },
});

/**
 * Lookup do profile sem efeito colateral. Retorna null se ainda não existe.
 */
export const getProfile = query({
  args: { deviceId: v.optional(v.string()) },
  returns: v.union(
    v.object({
      _id: v.id("profiles"),
      _creationTime: v.number(),
      deviceId: v.optional(v.string()),
      userId: v.optional(v.id("users")),
      startDate: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, { deviceId }) => {
    return await findProfileForRequest(ctx, deviceId);
  },
});

/**
 * Retorna info do usuário autenticado (se houver). Útil pra UI mostrar
 * email/status no menu de settings.
 */
export const me = query({
  args: {},
  returns: v.union(
    v.object({
      userId: v.id("users"),
      email: v.optional(v.string()),
      name: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const identity = await resolveIdentity(ctx, undefined).catch(() => null);
    if (!identity || identity.type !== "user") return null;
    const user = await ctx.db.get(identity.userId);
    if (!user) return null;
    return {
      userId: identity.userId,
      email: user.email,
      name: user.name,
    };
  },
});
