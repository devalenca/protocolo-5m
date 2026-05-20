import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import {
  type MutationCtx,
  mutation,
  type QueryCtx,
  query,
} from "./_generated/server";
import {
  CHECKLIST_IDS,
  STREAK_THRESHOLD_PCT,
  TOTAL_CHECKLIST_ITEMS,
  type ChecklistItemId,
} from "./lib/constants";
import { addDaysStr, todayStrUTC } from "./lib/dates";
import {
  ensureProfileForIdentity,
  findProfileForRequest,
  resolveIdentity,
} from "./lib/identity";

/* =================================================================
   Helpers
   ================================================================= */

function progressOf(items: Record<string, boolean> | undefined): {
  count: number;
  pct: number;
} {
  if (!items) return { count: 0, pct: 0 };
  const count = CHECKLIST_IDS.filter((id) => items[id]).length;
  return {
    count,
    pct: Math.round((count / TOTAL_CHECKLIST_ITEMS) * 100),
  };
}

async function getEntry(
  ctx: QueryCtx | MutationCtx,
  profileId: Id<"profiles">,
  date: string,
): Promise<Doc<"checklistEntries"> | null> {
  return await ctx.db
    .query("checklistEntries")
    .withIndex("by_profile_date", (q) =>
      q.eq("profileId", profileId).eq("date", date),
    )
    .unique();
}

/* =================================================================
   Queries
   ================================================================= */

export const getDay = query({
  args: { deviceId: v.optional(v.string()), date: v.string() },
  returns: v.object({
    items: v.record(v.string(), v.boolean()),
    count: v.number(),
    pct: v.number(),
  }),
  handler: async (ctx, { deviceId, date }) => {
    const profile = await findProfileForRequest(ctx, deviceId);
    if (!profile) return { items: {}, count: 0, pct: 0 };
    const entry = await getEntry(ctx, profile._id, date);
    const items = entry?.items ?? {};
    const { count, pct } = progressOf(items);
    return { items, count, pct };
  },
});

export const getRange = query({
  args: { deviceId: v.optional(v.string()), days: v.number() },
  returns: v.array(
    v.object({
      date: v.string(),
      count: v.number(),
      pct: v.number(),
    }),
  ),
  handler: async (ctx, { deviceId, days }) => {
    const profile = await findProfileForRequest(ctx, deviceId);
    const today = todayStrUTC();
    const out: { date: string; count: number; pct: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = addDaysStr(today, -i);
      if (!profile) {
        out.push({ date, count: 0, pct: 0 });
        continue;
      }
      const entry = await getEntry(ctx, profile._id, date);
      const { count, pct } = progressOf(entry?.items);
      out.push({ date, count, pct });
    }
    return out;
  },
});

export const getStreak = query({
  args: { deviceId: v.optional(v.string()) },
  returns: v.number(),
  handler: async (ctx, { deviceId }) => {
    const profile = await findProfileForRequest(ctx, deviceId);
    if (!profile) return 0;

    const today = todayStrUTC();
    const todayEntry = await getEntry(ctx, profile._id, today);
    const todayPct = progressOf(todayEntry?.items).pct;

    let cursor = today;
    if (todayPct < STREAK_THRESHOLD_PCT) cursor = addDaysStr(today, -1);

    let streak = 0;
    while (streak < 365) {
      const entry = await getEntry(ctx, profile._id, cursor);
      const pct = progressOf(entry?.items).pct;
      if (pct >= STREAK_THRESHOLD_PCT) {
        streak++;
        cursor = addDaysStr(cursor, -1);
      } else {
        break;
      }
    }
    return streak;
  },
});

/**
 * Lista todos os entries do profile. Usado pelo client pra montar
 * o shape `AppData.checklist` (compatível com a versão localStorage).
 */
export const listAllEntries = query({
  args: { deviceId: v.optional(v.string()) },
  returns: v.array(
    v.object({
      date: v.string(),
      items: v.record(v.string(), v.boolean()),
    }),
  ),
  handler: async (ctx, { deviceId }) => {
    const profile = await findProfileForRequest(ctx, deviceId);
    if (!profile) return [];
    const entries = await ctx.db
      .query("checklistEntries")
      .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
      .collect();
    return entries.map((e) => ({ date: e.date, items: e.items }));
  },
});

export const getWeekAdherence = query({
  args: { deviceId: v.optional(v.string()) },
  returns: v.number(),
  handler: async (ctx, { deviceId }) => {
    const profile = await findProfileForRequest(ctx, deviceId);
    if (!profile) return 0;
    const today = todayStrUTC();
    let total = 0;
    let count = 0;
    for (let i = 0; i < 7; i++) {
      const date = addDaysStr(today, -i);
      const entry = await getEntry(ctx, profile._id, date);
      if (entry) {
        total += progressOf(entry.items).pct;
        count++;
      }
    }
    return count === 0 ? 0 : Math.round(total / count);
  },
});

/* =================================================================
   Mutations
   ================================================================= */

export const toggleItem = mutation({
  args: {
    deviceId: v.optional(v.string()),
    date: v.string(),
    itemId: v.string(),
  },
  returns: v.object({
    count: v.number(),
    pct: v.number(),
  }),
  handler: async (ctx, { deviceId, date, itemId }) => {
    const identity = await resolveIdentity(ctx, deviceId);
    const profileId = await ensureProfileForIdentity(ctx, identity);

    if (!CHECKLIST_IDS.includes(itemId as ChecklistItemId)) {
      throw new Error(`Invalid checklist item id: ${itemId}`);
    }

    const existing = await getEntry(ctx, profileId, date);

    if (!existing) {
      const items: Record<string, boolean> = { [itemId]: true };
      await ctx.db.insert("checklistEntries", {
        profileId,
        date,
        items,
      });
      return progressOf(items);
    }

    const items = { ...existing.items };
    if (items[itemId]) delete items[itemId];
    else items[itemId] = true;

    await ctx.db.patch(existing._id, { items });
    return progressOf(items);
  },
});
