"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Apple,
  BookOpen,
  CheckCircle2,
  Crown,
  Dumbbell,
  Home,
  LineChart,
  Settings,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { CONVEX_ENABLED } from "@/components/providers/ConvexClientProvider";
import { ThemeTogglerButton } from "@/components/animate-ui/components/buttons/theme-toggler";
import { useDeviceId } from "@/lib/deviceId";
import { cn } from "@/lib/utils";
import { CommandTrigger } from "./CommandTrigger";
import { NAV_ITEMS, type NavItem } from "./nav-items";
import { UserMenu } from "./UserMenu";

const ICONS = {
  Home,
  CheckCircle2,
  Dumbbell,
  BookOpen,
  LineChart,
  Apple,
} as const;

function Icon({ name }: { name: NavItem["lucide"] }) {
  const Comp = ICONS[name];
  return <Comp className="size-5" strokeWidth={1.6} aria-hidden />;
}

export function Sidebar() {
  const pathname = usePathname();
  const deviceId = useDeviceId();
  const isAdmin = useQuery(
    api.admin.isAdmin,
    CONVEX_ENABLED && deviceId ? { deviceId } : "skip",
  );

  return (
    <aside
      className="border-line-faint bg-bg-card/60 fixed top-0 left-0 z-40 hidden h-dvh w-[260px] flex-col border-r backdrop-blur-xl lg:flex"
      aria-label="Navegação principal"
    >
      {/* Brand */}
      <div className="border-line-faint flex items-center gap-3 border-b px-5 py-5">
        <div
          aria-hidden
          className="border-brand/40 bg-brand/10 text-brand relative flex h-10 w-10 items-center justify-center rounded-xl border font-serif text-sm font-semibold"
        >
          5M
          <span
            aria-hidden
            className="bg-brand absolute -top-1 -right-1 h-2 w-2 rounded-full"
            style={{ animation: "pulse-sidebar 2s ease-in-out infinite" }}
          />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-serif text-lg font-semibold tracking-tight">
            Protocolo
          </span>
          <span className="text-text-mute font-sans text-[10px] tracking-[0.18em] uppercase">
            Recomposição
          </span>
        </div>
      </div>

      {/* Cmd+K trigger */}
      <div className="border-line-faint border-b px-3 py-3">
        <CommandTrigger variant="search" />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <div className="text-text-mute mb-2 px-3 font-sans text-[9px] tracking-[0.18em] uppercase">
          Diário
        </div>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "focus-visible:ring-brand flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 font-serif text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
                    active
                      ? "bg-brand/10 text-brand"
                      : "text-text-dim hover:bg-bg-elev hover:text-text",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon name={item.lucide} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="text-text-mute mt-5 mb-2 px-3 font-sans text-[9px] tracking-[0.18em] uppercase">
          Sistema
        </div>
        <ul className="space-y-0.5">
          <li>
            <Link
              href="/perfil"
              aria-current={pathname.startsWith("/perfil") ? "page" : undefined}
              className={cn(
                "focus-visible:ring-brand flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 font-serif text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
                pathname.startsWith("/perfil")
                  ? "bg-brand/10 text-brand"
                  : "text-text-dim hover:bg-bg-elev hover:text-text",
              )}
            >
              <Settings className="size-5" strokeWidth={1.6} aria-hidden />
              <span>Perfil &amp; plano</span>
            </Link>
          </li>
          {isAdmin && (
            <li>
              <Link
                href="/admin/users"
                aria-current={pathname.startsWith("/admin") ? "page" : undefined}
                className={cn(
                  "focus-visible:ring-brand flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 font-serif text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
                  pathname.startsWith("/admin")
                    ? "bg-brand/15 text-brand"
                    : "text-brand/80 hover:bg-brand/5 hover:text-brand",
                )}
              >
                <Crown className="size-5" strokeWidth={1.6} aria-hidden />
                <span>Admin</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>

      {/* Footer: theme + user */}
      <div className="border-line-faint flex items-center justify-between gap-2 border-t px-3 py-3">
        <ThemeTogglerButton
          variant="outline"
          size="default"
          aria-label="Alternar tema"
        />
        <UserMenu />
      </div>

      <style jsx global>{`
        @keyframes pulse-sidebar {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes pulse-sidebar { from, to { opacity: 1; } }
        }
      `}</style>
    </aside>
  );
}
