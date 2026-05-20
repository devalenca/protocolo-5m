"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="border-line-faint bg-bg/90 fixed right-0 bottom-0 left-0 z-40 border-t backdrop-blur-md lg:hidden"
      style={{
        paddingBottom: "var(--safe-bottom)",
        paddingLeft: "var(--safe-left)",
        paddingRight: "var(--safe-right)",
      }}
      aria-label="Navegação principal"
    >
      <ul className="mx-auto flex h-[72px] w-full max-w-md items-stretch">
        {NAV_ITEMS.map((tab) => {
          const active = tab.match(pathname);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 transition-colors",
                  active ? "text-brand" : "text-text-mute hover:text-text-dim",
                )}
                aria-current={active ? "page" : undefined}
              >
                <span className="text-lg leading-none">{tab.glyph}</span>
                <span className="font-sans text-[10px] tracking-[0.12em] uppercase">
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
