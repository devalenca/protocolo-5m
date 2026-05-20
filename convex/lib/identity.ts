import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { todayStrUTC } from "./dates";

/* =================================================================
   Identidade unificada
   ----------------------------------------------------------------
   Toda função do app passa por aqui:
     - Se o request tem auth context: usa userId (logado).
     - Senão: cai pro deviceId (anônimo).
   Profile lookup prioriza userId quando ambos existem.
   ================================================================= */

export type Identity =
  | { type: "user"; userId: Id<"users"> }
  | { type: "device"; deviceId: string };

/**
 * Resolve a identidade do request. Se houver token Convex Auth válido,
 * retorna `{ type: "user", userId }`. Senão, exige `deviceId` no input.
 */
export async function resolveIdentity(
  ctx: QueryCtx | MutationCtx,
  deviceId: string | undefined,
): Promise<Identity> {
  const userId = await getAuthUserId(ctx);
  if (userId) return { type: "user", userId };
  if (!deviceId) {
    throw new Error("Anonymous calls require a deviceId.");
  }
  return { type: "device", deviceId };
}

/**
 * Busca o profile correspondente à identidade. Retorna null se não existe.
 */
export async function findProfile(
  ctx: QueryCtx | MutationCtx,
  identity: Identity,
): Promise<Doc<"profiles"> | null> {
  if (identity.type === "user") {
    return await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.userId))
      .unique();
  }
  return await ctx.db
    .query("profiles")
    .withIndex("by_device", (q) => q.eq("deviceId", identity.deviceId))
    .unique();
}

/**
 * Cria o profile se não existir. Idempotente.
 */
export async function ensureProfileForIdentity(
  ctx: MutationCtx,
  identity: Identity,
): Promise<Id<"profiles">> {
  const existing = await findProfile(ctx, identity);
  if (existing) return existing._id;

  if (identity.type === "user") {
    return await ctx.db.insert("profiles", {
      userId: identity.userId,
      startDate: todayStrUTC(),
    });
  }
  return await ctx.db.insert("profiles", {
    deviceId: identity.deviceId,
    startDate: todayStrUTC(),
  });
}

/**
 * Resolve identidade + busca profile em uma chamada. Atalho de leitura.
 */
export async function findProfileForRequest(
  ctx: QueryCtx | MutationCtx,
  deviceId: string | undefined,
): Promise<Doc<"profiles"> | null> {
  const identity = await resolveIdentity(ctx, deviceId).catch(() => null);
  if (!identity) return null;
  return await findProfile(ctx, identity);
}
