import { todayStr } from "./dates";
import { SCHEMA_VERSION, type AppData } from "./types";

export const STORAGE_KEY = "protocolo5m_v2";
const LEGACY_KEY = "protocolo5m_v1";

export function emptyData(): AppData {
  return {
    checklist: {},
    workouts: [],
    achievements: [],
    startDate: todayStr(),
    v: SCHEMA_VERSION,
  };
}

export function loadData(): AppData {
  if (typeof window === "undefined") return emptyData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalize(JSON.parse(raw) as Partial<AppData>);
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) return normalize(JSON.parse(legacy) as Partial<AppData>);
  } catch {
    // ignore
  }
  return emptyData();
}

function normalize(d: Partial<AppData>): AppData {
  return {
    checklist: d.checklist ?? {},
    workouts: d.workouts ?? [],
    achievements: d.achievements ?? [],
    startDate: d.startDate ?? todayStr(),
    v: SCHEMA_VERSION,
  };
}

export function saveData(data: AppData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("protocolo:change"));
  } catch {
    // ignore quota errors silently
  }
}

export function exportData(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function importData(json: string): AppData | null {
  try {
    const parsed = JSON.parse(json);
    return normalize(parsed);
  } catch {
    return null;
  }
}

export function resetData(): AppData {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_KEY);
  }
  const fresh = emptyData();
  saveData(fresh);
  return fresh;
}
