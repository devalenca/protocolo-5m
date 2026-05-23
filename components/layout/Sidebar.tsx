"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Apple, BookOpen, CheckCircle2, Dumbbell, Home, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, type NavItem } from "./nav-items";
import { SettingsButton } from "./SettingsButton";
import { ThemeTogglerButton } from "@/components/animate-ui/components/buttons/theme-toggler";

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
  return <Comp className="size-5" strokeWidth={1.6} />;
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="border-line-faint bg-bg-card/60 fixed top-0 left-0 z-40 hidden h-dvh w-[260px] flex-col border-r backdrop-blur-md lg:flex"
      aria-label="Navegação principal"
    >
      {/* Logo */}
      <div className="border-line-faint flex items-center gap-3 border-b px-6 py-6">
        <div className="border-brand/40 bg-brand/10 text-brand flex h-10 w-10 items-center justify-center rounded-xl border font-serif text-sm font-semibold">
          5M
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-serif text-lg font-semibold">Protocolo</span>
          <span className="text-text-mute font-sans text-[10px] tracking-[0.18em] uppercase">
            Recomposição
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 font-serif text-sm transition-colors",
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
      </nav>

      {/* Footer: theme toggler + settings */}
      <div className="border-line-faint flex items-center justify-between gap-2 border-t px-6 py-4">
        <span className="text-text-mute font-sans text-[10px] tracking-[0.18em] uppercase">
          Ajustes
        </span>
        <div className="flex items-center gap-2">
          <ThemeTogglerButton
            variant="outline"
            size="default"
            aria-label="Alternar tema"
          />
          <SettingsButton />
        </div>
      </div>
    </aside>
  );
}
