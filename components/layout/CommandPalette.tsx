"use client";

import {
  Activity,
  Apple,
  BookOpen,
  CheckCircle2,
  Crown,
  Dumbbell,
  Home,
  LineChart,
  Pencil,
  Plus,
  RotateCcw,
  Scale,
  Search,
  Settings,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "@/convex/_generated/api";
import { CONVEX_ENABLED } from "@/components/providers/ConvexClientProvider";
import { useDeviceId } from "@/lib/deviceId";
import { cn } from "@/lib/utils";

/* =================================================================
   CommandPalette — Cmd+K (⌘K) / Ctrl+K
   ----------------------------------------------------------------
   Modal de navegação rápida + ações. Inspirado em Linear, Raycast,
   Vercel. Foco em teclado-first:
   - ⌘K abre, Esc fecha
   - Arrow up/down navega, Enter executa
   - Filtro fuzzy por nome ou label
   - Hover/focus mostra hint de atalho
   ================================================================= */

type Cmd = {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  section: "Navegação" | "Ações" | "Admin";
  shortcut?: string;
  run: () => void;
  /** Hide condicionalmente (ex.: admin só pra admins) */
  visible?: boolean;
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const deviceId = useDeviceId();
  const isAdmin = useQuery(
    api.admin.isAdmin,
    CONVEX_ENABLED && deviceId ? { deviceId } : "skip",
  );

  const close = useCallback(() => setOpen(false), []);
  const goto = useCallback(
    (path: string) => {
      router.push(path);
      setOpen(false);
    },
    [router],
  );

  const commands = useMemo<Cmd[]>(
    () => [
      { id: "nav-home", section: "Navegação", label: "Hoje", hint: "dashboard", icon: Home, run: () => goto("/") },
      { id: "nav-dieta", section: "Navegação", label: "Dieta", hint: "refeições, macros", icon: Apple, run: () => goto("/dieta") },
      { id: "nav-treino", section: "Navegação", label: "Treino", hint: "splits, séries, e1RM", icon: Dumbbell, run: () => goto("/treino") },
      { id: "nav-corpo", section: "Navegação", label: "Corpo", hint: "peso, medidas, gráfico", icon: LineChart, run: () => goto("/corpo") },
      { id: "nav-checklist", section: "Navegação", label: "Hábitos", hint: "checklist diário", icon: CheckCircle2, run: () => goto("/checklist") },
      { id: "nav-protocolo", section: "Navegação", label: "Plano", hint: "protocolo, suplementação", icon: BookOpen, run: () => goto("/protocolo") },
      { id: "nav-perfil", section: "Navegação", label: "Perfil", hint: "editar metas, hábitos, treino", icon: Settings, run: () => goto("/perfil") },

      { id: "act-weight", section: "Ações", label: "Registrar peso", hint: "abre /corpo", icon: Scale, run: () => goto("/corpo") },
      { id: "act-meal", section: "Ações", label: "Adicionar refeição", hint: "abre /dieta", icon: Plus, run: () => goto("/dieta") },
      { id: "act-workout", section: "Ações", label: "Começar treino sugerido", hint: "abre /treino", icon: Activity, run: () => goto("/treino") },
      { id: "act-redo-onboarding", section: "Ações", label: "Refazer onboarding", hint: "regerar plano completo", icon: RotateCcw, run: () => goto("/onboarding") },
      { id: "act-edit-plan", section: "Ações", label: "Editar plano", hint: "metas, hábitos, suplementos", icon: Pencil, run: () => goto("/perfil") },

      {
        id: "admin-users",
        section: "Admin",
        label: "Painel de usuários",
        hint: "todos os profiles",
        icon: Crown,
        run: () => goto("/admin/users"),
        visible: Boolean(isAdmin),
      },
    ],
    [goto, isAdmin],
  );

  return (
    <>
      <KeyboardListener onOpen={() => setOpen(true)} />
      {open && (
        <PaletteModal commands={commands.filter((c) => c.visible !== false)} onClose={close} />
      )}
    </>
  );
}

function KeyboardListener({ onOpen }: { onOpen: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isCmdK) {
        e.preventDefault();
        onOpen();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onOpen]);
  return null;
}

function PaletteModal({ commands, onClose }: { commands: Cmd[]; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        (c.hint ?? "").toLowerCase().includes(q),
    );
  }, [commands, query]);

  // Agrupa por seção mantendo ordem original
  const grouped = useMemo(() => {
    const order: Cmd["section"][] = ["Navegação", "Ações", "Admin"];
    return order
      .map((section) => ({
        section,
        items: filtered.filter((c) => c.section === section),
      }))
      .filter((g) => g.items.length > 0);
  }, [filtered]);

  // Lista achatada na ordem visual (pra arrow nav)
  const flat = useMemo(() => grouped.flatMap((g) => g.items), [grouped]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Reset highlight when query muda. eslint-disable-next-line:
  // este reset depende de prop externa, é o caso canônico.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setActiveIdx(0), [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, flat.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        flat[activeIdx]?.run();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [flat, activeIdx, onClose]);

  // Scroll item ativo pra view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-cmd-idx="${activeIdx}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  if (typeof window === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Paleta de comandos"
      className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[12vh]"
      onMouseDown={(e) => {
        // Fecha clicando no backdrop
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ overscrollBehavior: "contain" }}
    >
      {/* Backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        style={{
          animation: "cmdk-fade 120ms ease-out",
        }}
      />

      {/* Card */}
      <div
        className={cn(
          "border-line-strong bg-bg-card relative w-full max-w-xl overflow-hidden rounded-[var(--radius-lg)] border shadow-[0_24px_64px_-12px_rgba(0,0,0,0.5)]",
        )}
        style={{ animation: "cmdk-pop 160ms ease-out" }}
      >
        {/* Search input */}
        <div className="border-line-faint flex items-center gap-2 border-b px-4 py-3">
          <Search className="text-text-mute h-4 w-4 flex-shrink-0" aria-hidden />
          <label htmlFor="cmdk-input" className="sr-only">
            Buscar comando
          </label>
          <input
            id="cmdk-input"
            ref={inputRef}
            type="text"
            inputMode="search"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar página, ação…"
            className="text-text placeholder:text-text-mute h-7 flex-1 bg-transparent font-sans text-sm outline-none"
          />
          <kbd className="border-line text-text-mute hidden h-6 items-center rounded border px-1.5 font-sans text-[10px] tracking-wider sm:inline-flex">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="max-h-[60vh] overflow-y-auto py-2"
          role="listbox"
          aria-label="Resultados"
        >
          {grouped.length === 0 && (
            <div className="text-text-dim px-4 py-6 text-center text-sm">
              Nenhum resultado para &ldquo;{query}&rdquo;.
            </div>
          )}
          {grouped.map((g) => (
            <div key={g.section}>
              <div className="text-text-mute px-4 py-1.5 font-sans text-[9px] tracking-[0.18em] uppercase">
                {g.section}
              </div>
              <ul className="mb-1.5">
                {g.items.map((cmd) => {
                  const idx = flat.findIndex((c) => c.id === cmd.id);
                  const active = idx === activeIdx;
                  return (
                    <li key={cmd.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={active}
                        data-cmd-idx={idx}
                        onMouseEnter={() => setActiveIdx(idx)}
                        onClick={() => cmd.run()}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-2 text-left transition-colors",
                          active
                            ? "bg-brand/10 text-text"
                            : "text-text-dim hover:bg-bg-elev",
                        )}
                      >
                        <cmd.icon
                          className={cn(
                            "h-4 w-4 flex-shrink-0",
                            active ? "text-brand" : "text-text-mute",
                          )}
                          aria-hidden
                        />
                        <span className="font-serif text-sm">{cmd.label}</span>
                        {cmd.hint && (
                          <span className="text-text-mute hidden font-sans text-[11px] sm:inline">
                            · {cmd.hint}
                          </span>
                        )}
                        <span className="flex-1" />
                        {active && (
                          <kbd
                            aria-hidden
                            className="border-line text-text-mute hidden h-5 items-center rounded border px-1 font-sans text-[9px] sm:inline-flex"
                          >
                            ↵
                          </kbd>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="border-line-faint text-text-mute flex items-center justify-between gap-3 border-t bg-bg-card/80 px-4 py-2 font-sans text-[10px] tracking-[0.04em] backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" aria-hidden /> Paleta de comandos
            </span>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span>↑ ↓ navegar</span>
            <span>·</span>
            <span>↵ executar</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes cmdk-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cmdk-pop {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes cmdk-fade { from, to { opacity: 1; } }
          @keyframes cmdk-pop { from, to { opacity: 1; transform: none; } }
        }
      `}</style>
    </div>,
    document.body,
  );
}
