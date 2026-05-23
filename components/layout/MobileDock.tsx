"use client";

import { useQuery } from "convex/react";
import {
  Apple,
  BookOpen,
  CheckCircle2,
  Crown,
  Dumbbell,
  Home,
  LayoutGrid,
  LineChart,
  Settings,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "@/convex/_generated/api";
import { CONVEX_ENABLED } from "@/components/providers/ConvexClientProvider";
import { useDeviceId } from "@/lib/deviceId";
import { cn } from "@/lib/utils";

/* =================================================================
   MobileDock — substitui a TabBar de 6 itens
   ----------------------------------------------------------------
   Dock flutuante com 4 ações primárias (Hoje · Dieta · Treino · Mais).
   "Mais" abre bottom sheet com Corpo, Hábitos, Plano, Perfil, Admin.
   Desktop: oculto (Sidebar cuida).
   ================================================================= */

type DockItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (p: string) => boolean;
};

const PRIMARY: DockItem[] = [
  { href: "/", label: "Hoje", icon: Home, match: (p) => p === "/" },
  { href: "/dieta", label: "Dieta", icon: Apple, match: (p) => p.startsWith("/dieta") },
  { href: "/treino", label: "Treino", icon: Dumbbell, match: (p) => p.startsWith("/treino") },
];

const SECONDARY: DockItem[] = [
  { href: "/corpo", label: "Corpo", icon: LineChart, match: (p) => p.startsWith("/corpo") },
  { href: "/checklist", label: "Hábitos", icon: CheckCircle2, match: (p) => p.startsWith("/checklist") },
  { href: "/protocolo", label: "Plano", icon: BookOpen, match: (p) => p.startsWith("/protocolo") },
  { href: "/perfil", label: "Perfil", icon: Settings, match: (p) => p.startsWith("/perfil") },
];

export function MobileDock() {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);
  const deviceId = useDeviceId();
  const isAdmin = useQuery(
    api.admin.isAdmin,
    CONVEX_ENABLED && deviceId ? { deviceId } : "skip",
  );

  // Considera "Mais" ativo quando estamos em qualquer rota secundária
  const moreActive =
    SECONDARY.some((s) => s.match(pathname)) ||
    pathname.startsWith("/admin");

  return (
    <>
      <nav
        aria-label="Navegação principal"
        className="fixed bottom-0 left-0 right-0 z-40 px-3 pt-2 lg:hidden"
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom), 0.75rem)",
          paddingLeft: "max(env(safe-area-inset-left), 0.75rem)",
          paddingRight: "max(env(safe-area-inset-right), 0.75rem)",
        }}
      >
        <div className="bg-bg-card/85 border-line-faint mx-auto flex h-14 max-w-md items-stretch gap-1 rounded-full border p-1 shadow-[0_10px_32px_-12px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          {PRIMARY.map((item) => {
            const active = item.match(pathname);
            return (
              <DockLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={active}
              />
            );
          })}
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-label="Abrir mais opções"
            aria-expanded={sheetOpen}
            aria-haspopup="menu"
            className={cn(
              "focus-visible:ring-brand relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none",
              moreActive
                ? "bg-brand/15 text-brand"
                : "text-text-mute hover:text-text",
            )}
            style={{ touchAction: "manipulation" }}
          >
            <LayoutGrid className="h-4 w-4" aria-hidden strokeWidth={1.8} />
            <span className="font-sans text-[9px] tracking-[0.16em] uppercase">
              Mais
            </span>
            {moreActive && (
              <span
                aria-hidden
                className="bg-brand absolute top-0.5 h-1 w-1 rounded-full"
              />
            )}
          </button>
        </div>
      </nav>

      {sheetOpen && (
        <MoreSheet
          onClose={() => setSheetOpen(false)}
          isAdmin={isAdmin === true}
          pathname={pathname}
        />
      )}
    </>
  );
}

function DockLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "focus-visible:ring-brand relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none",
        active ? "bg-brand/15 text-brand" : "text-text-mute hover:text-text",
      )}
      style={{ touchAction: "manipulation" }}
    >
      <Icon className="h-4 w-4" aria-hidden strokeWidth={1.8} />
      <span className="font-sans text-[9px] tracking-[0.16em] uppercase">
        {label}
      </span>
      {active && (
        <span
          aria-hidden
          className="bg-brand absolute top-0.5 h-1 w-1 rounded-full"
        />
      )}
    </Link>
  );
}

function MoreSheet({
  onClose,
  isAdmin,
  pathname,
}: {
  onClose: () => void;
  isAdmin: boolean;
  pathname: string;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  if (typeof window === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mais opções"
      className="fixed inset-0 z-50 flex items-end lg:hidden"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ overscrollBehavior: "contain" }}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        style={{ animation: "sheet-fade 160ms ease-out" }}
      />
      <div
        className="bg-bg-card border-line-faint relative w-full rounded-t-[var(--radius-lg)] border-t p-3 shadow-[0_-20px_64px_-12px_rgba(0,0,0,0.5)]"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)",
          animation: "sheet-pop 220ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* drag handle */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="bg-line-faint mx-auto mb-2 block h-1.5 w-10 rounded-full"
        />

        <div className="text-text-mute mb-2 px-2 font-sans text-[10px] tracking-[0.18em] uppercase">
          Mais
        </div>

        <ul className="grid grid-cols-2 gap-2">
          {SECONDARY.map((item) => {
            const active = item.match(pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "border-line bg-bg flex items-center gap-3 rounded-[var(--radius)] border p-3 transition-colors",
                    active
                      ? "border-brand/40 bg-brand/5 text-text"
                      : "hover:bg-bg-elev text-text-dim",
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 flex-shrink-0",
                      active ? "text-brand" : "text-text-mute",
                    )}
                    aria-hidden
                  />
                  <span className="font-serif text-sm">{item.label}</span>
                </Link>
              </li>
            );
          })}
          {isAdmin && (
            <li className="col-span-2">
              <Link
                href="/admin/users"
                onClick={onClose}
                aria-current={pathname.startsWith("/admin") ? "page" : undefined}
                className={cn(
                  "border-brand/40 bg-brand/5 text-text flex items-center gap-3 rounded-[var(--radius)] border p-3 transition-colors hover:bg-brand/10",
                )}
              >
                <Crown className="text-brand h-4 w-4" aria-hidden />
                <div className="min-w-0">
                  <div className="font-serif text-sm">Painel admin</div>
                  <div className="text-text-mute font-sans text-[10px] tracking-wide">
                    Gerenciar usuários
                  </div>
                </div>
              </Link>
            </li>
          )}
        </ul>
      </div>

      <style jsx global>{`
        @keyframes sheet-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes sheet-pop {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes sheet-fade { from, to { opacity: 1; } }
          @keyframes sheet-pop { from, to { transform: none; opacity: 1; } }
        }
      `}</style>
    </div>,
    document.body,
  );
}
