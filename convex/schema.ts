import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/* =================================================================
   SCHEMA — Protocolo 5M
   ----------------------------------------------------------------
   Identidade dual:
   - userId (Id<"users">) quando logado via Convex Auth
   - deviceId (string) anônimo, gerado no client
   Profile lookup prioriza userId quando ambos existem.
   ================================================================= */

export default defineSchema({
  // Tabelas do Convex Auth (users, authSessions, authAccounts, etc.)
  ...authTables,

  profiles: defineTable({
    /** Identificador anônimo gerado no client. Opcional após claim. */
    deviceId: v.optional(v.string()),
    /** Setado quando o profile é "claimado" por um usuário autenticado. */
    userId: v.optional(v.id("users")),
    /** YYYY-MM-DD do início do protocolo desse usuário. */
    startDate: v.string(),
  })
    .index("by_device", ["deviceId"])
    .index("by_user", ["userId"]),

  checklistEntries: defineTable({
    profileId: v.id("profiles"),
    /** YYYY-MM-DD */
    date: v.string(),
    items: v.record(v.string(), v.boolean()),
  })
    .index("by_profile_date", ["profileId", "date"])
    .index("by_profile", ["profileId"]),

  workouts: defineTable({
    profileId: v.id("profiles"),
    /** upperA | lowerA | upperB | lowerB */
    workoutId: v.string(),
    /** YYYY-MM-DD do treino */
    date: v.string(),
    startedAt: v.number(),
    finishedAt: v.number(),
    exercises: v.array(
      v.object({
        name: v.string(),
        sets: v.array(
          v.object({
            weight: v.string(),
            reps: v.string(),
          }),
        ),
      }),
    ),
  })
    .index("by_profile", ["profileId"])
    .index("by_profile_workout", ["profileId", "workoutId"])
    .index("by_profile_date", ["profileId", "date"]),

  achievementsUnlocked: defineTable({
    profileId: v.id("profiles"),
    achievementId: v.string(),
    unlockedAt: v.number(),
  })
    .index("by_profile", ["profileId"])
    .index("by_profile_achievement", ["profileId", "achievementId"]),
});
