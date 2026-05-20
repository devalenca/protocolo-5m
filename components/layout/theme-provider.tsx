"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  type Resolved,
  type ThemePref,
} from "@/lib/theme";

/* =================================================================
   ThemeProvider customizado — substitui next-themes pra evitar
   o warning de "script tag during render" do React 19.
   API compatível com next-themes' useTheme() pro animate-ui consumir.
   ================================================================= */

type ThemeContextValue = {
  theme: ThemePref;
  resolvedTheme: Resolved;
  setTheme: (t: ThemePref) => void;
  themes: ThemePref[];
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const ALL_THEMES: ThemePref[] = ["light", "dark", "system"];

function getSystemPreference(): Resolved {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readStoredTheme(): ThemePref {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    // ignore
  }
  return DEFAULT_THEME;
}

function applyClass(resolved: Resolved): void {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.classList.toggle("light", resolved === "light");
  root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Inicializa com DEFAULT pra evitar mismatch SSR — atualiza no useEffect.
  const [theme, setThemeState] = useState<ThemePref>(DEFAULT_THEME);
  const [systemResolved, setSystemResolved] = useState<Resolved>("dark");
  const [hydrated, setHydrated] = useState(false);

  // Hidratação: ler stored + system
  useEffect(() => {
    const stored = readStoredTheme();
    const sys = getSystemPreference();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(stored);
    setSystemResolved(sys);
    setHydrated(true);
  }, []);

  // Observar mudanças do system color scheme (se theme === "system")
  useEffect(() => {
    if (!hydrated) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      setSystemResolved(e.matches ? "dark" : "light");
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [hydrated]);

  const resolvedTheme: Resolved = theme === "system" ? systemResolved : theme;

  // Aplicar a classe sempre que o resolved mudar
  useEffect(() => {
    if (!hydrated) return;
    applyClass(resolvedTheme);
  }, [resolvedTheme, hydrated]);

  // Multi-tab sync via storage event
  useEffect(() => {
    if (!hydrated) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== THEME_STORAGE_KEY) return;
      const v = e.newValue;
      if (v === "light" || v === "dark" || v === "system") {
        setThemeState(v);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [hydrated]);

  const setTheme = useCallback((t: ThemePref) => {
    setThemeState(t);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, t);
    } catch {
      // ignore quota errors
    }
  }, []);

  return (
    <ThemeContext.Provider
      value={{ theme, resolvedTheme, setTheme, themes: ALL_THEMES }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within <ThemeProvider />");
  }
  return ctx;
}
