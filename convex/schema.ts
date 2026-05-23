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
            /** RPE (0-10) — esforço percebido. Opcional. */
            rpe: v.optional(v.string()),
            /** Notas livres por série (ex: "joelho esquerdo"). */
            notes: v.optional(v.string()),
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

  bodyMetrics: defineTable({
    profileId: v.id("profiles"),
    /** YYYY-MM-DD da medição */
    date: v.string(),
    /** Peso em kg. Sempre presente — é o ponto da timeline. */
    weight: v.number(),
    /** % gordura corporal (opcional). */
    bodyFatPct: v.optional(v.number()),
    /** Cintura em cm. */
    waist: v.optional(v.number()),
    /** Peito em cm. */
    chest: v.optional(v.number()),
    /** Braço (maior dos dois) em cm. */
    arm: v.optional(v.number()),
    /** Quadril em cm. */
    hip: v.optional(v.number()),
    /** Coxa (maior das duas) em cm. */
    thigh: v.optional(v.number()),
    /** Observação livre. */
    notes: v.optional(v.string()),
  })
    .index("by_profile", ["profileId"])
    .index("by_profile_date", ["profileId", "date"]),

  /* =================================================================
     Nutrição
     ----------------------------------------------------------------
     `foods` é a base de alimentos. profileId undefined = global (seed);
     setado = alimento custom do usuário.
     `mealEntries` é uma linha por item de refeição (denormaliza nome e
     macros pra performance e pra resistir a edits do food original).
     ================================================================= */

  foods: defineTable({
    profileId: v.optional(v.id("profiles")),
    name: v.string(),
    brand: v.optional(v.string()),
    /** chave lowercased + sem acentos pra busca */
    searchKey: v.string(),
    /** Todos os macros por 100g */
    kcal: v.number(),
    protein: v.number(),
    carbs: v.number(),
    fat: v.number(),
    fiber: v.optional(v.number()),
    /** Sugestão de porção padrão (ex.: "1 ovo" = 50g) */
    defaultPortionGrams: v.optional(v.number()),
    defaultPortionLabel: v.optional(v.string()),
  })
    .index("by_profile", ["profileId"])
    .searchIndex("search_name", {
      searchField: "searchKey",
      filterFields: ["profileId"],
    }),

  mealEntries: defineTable({
    profileId: v.id("profiles"),
    /** YYYY-MM-DD */
    date: v.string(),
    /** cafe | lanche_manha | almoco | pre_treino | jantar | pre_sono | custom */
    mealType: v.string(),
    /** Link opcional pro food (null em quick-entry sem buscar) */
    foodId: v.optional(v.id("foods")),
    /** Nome denormalizado pra display + resilience */
    foodName: v.string(),
    portionGrams: v.number(),
    /** Macros já calculados pela porção (snapshot). */
    kcal: v.number(),
    protein: v.number(),
    carbs: v.number(),
    fat: v.number(),
  })
    .index("by_profile_date", ["profileId", "date"])
    .index("by_profile", ["profileId"]),

  /* =================================================================
     Plano personalizado — Slice 1 multi-user
     ----------------------------------------------------------------
     Cada profile tem o seu protocolo: respostas do onboarding,
     templates de treino, plano de refeições e lista de hábitos.
     Quando um profile é criado, é seedado com os defaults do 5M
     (ver convex/lib/defaultPlan.ts). Daí pra frente é independente.
     ================================================================= */

  profileSettings: defineTable({
    profileId: v.id("profiles"),
    /** Identificação (mostrada em settings/topo) */
    displayName: v.optional(v.string()),
    /** Onboarding answers */
    age: v.optional(v.number()),
    sex: v.optional(v.union(v.literal("M"), v.literal("F"))),
    heightCm: v.optional(v.number()),
    targetWeight: v.optional(v.number()),
    goal: v.optional(
      v.union(
        v.literal("cut"),
        v.literal("maintain"),
        v.literal("recomp"),
        v.literal("bulk"),
      ),
    ),
    biotipo: v.optional(
      v.union(
        v.literal("ectomorfo"),
        v.literal("mesomorfo"),
        v.literal("endomorfo"),
      ),
    ),
    activityLevel: v.optional(
      v.union(
        v.literal("sedentary"),
        v.literal("light"),
        v.literal("moderate"),
        v.literal("active"),
        v.literal("very_active"),
      ),
    ),
    trainingDaysPerWeek: v.optional(v.number()),
    sessionDurationMin: v.optional(v.number()),
    /** ["funcional", "maquinario", "peso_livre", "cardio", "hiit"] */
    exerciseTypes: v.optional(v.array(v.string())),
    hasKneeIssues: v.optional(v.boolean()),
    /** Restrições alimentares ("sem_lactose", "vegetariano", ...) + alergias livres */
    dietaryRestrictions: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    /** Timestamp do onboarding completo. Quando null, /onboarding redireciona. */
    onboardedAt: v.optional(v.number()),
  }).index("by_profile", ["profileId"]),

  workoutTemplates: defineTable({
    profileId: v.id("profiles"),
    /** "upperA", "lowerA", etc. — pode ser custom */
    templateId: v.string(),
    name: v.string(),
    /** "Dia 1 · ~40 min" — label livre */
    day: v.string(),
    focus: v.string(),
    order: v.number(),
    exercises: v.array(
      v.object({
        name: v.string(),
        sets: v.number(),
        reps: v.string(),
        rest: v.number(),
        useBar: v.optional(v.boolean()),
      }),
    ),
  })
    .index("by_profile", ["profileId"])
    .index("by_profile_template", ["profileId", "templateId"])
    .index("by_profile_order", ["profileId", "order"]),

  mealPlan: defineTable({
    profileId: v.id("profiles"),
    goals: v.object({
      kcal: v.number(),
      protein: v.number(),
      carbs: v.number(),
      fat: v.number(),
    }),
    slots: v.array(
      v.object({
        id: v.string(),
        label: v.string(),
        time: v.string(),
        hint: v.optional(v.string()),
      }),
    ),
  }).index("by_profile", ["profileId"]),

  habitItems: defineTable({
    profileId: v.id("profiles"),
    /** ID do hábito (ex.: "agua", "proteina", ou custom) */
    itemId: v.string(),
    text: v.string(),
    sub: v.optional(v.string()),
    order: v.number(),
    /** True = aparece no checklist. False = soft-deleted. */
    active: v.boolean(),
  })
    .index("by_profile", ["profileId"])
    .index("by_profile_item", ["profileId", "itemId"]),
});
