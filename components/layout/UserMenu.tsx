"use client";

import { useQuery } from "convex/react";
import { Crown, LogOut, Settings as SettingsIcon, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import { CONVEX_ENABLED } from "@/components/providers/ConvexClientProvider";
import { useDeviceId } from "@/lib/deviceId";
import { cn } from "@/lib/utils";

/* =================================================================
   UserMenu — avatar com initials + dropdown (perfil/admin/sair)
   ----------------------------------------------------------------
   Mostra inicial do displayName quando setado, fallback do email,
   senão "?". Click toggle dropdown; Escape fecha.
   ================================================================= */

export function UserMenu() {
  const deviceId = useDeviceId();
  const settings = useQuery(
    api.profileSettings.get,
    CONVEX_ENABLED && deviceId ? { deviceId } : "skip",
  );
  const me = useQuery(api.profiles.me, CONVEX_ENABLED ? {} : "skip");
  const isAdmin = useQuery(
    api.admin.isAdmin,
    CONVEX_ENABLED && deviceId ? { deviceId } : "skip",
  );

  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initial =
    settings?.displayName?.[0]?.toUpperCase() ??
    me?.name?.[0]?.toUpperCase() ??
    me?.email?.[0]?.toUpperCase() ??
    "?";
  const fullName = settings?.displayName ?? me?.name ?? "Convidado";
  const email = me?.email ?? "";

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Menu de usuário · ${fullName}`}
        className={cn(
          "border-line bg-bg-card hover:border-line-strong focus-visible:ring-brand relative flex h-9 w-9 items-center justify-center rounded-full border font-serif text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none",
          isAdmin
            ? "bg-brand/15 text-brand"
            : "text-text-dim hover:text-text",
        )}
      >
        {isAdmin ? (
          <Crown className="h-4 w-4" aria-hidden />
        ) : (
          <span aria-hidden>{initial}</span>
        )}
        {isAdmin && (
          <span
            aria-hidden
            className="border-bg-card bg-brand absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2"
          />
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Menu de usuário"
          className="border-line-strong bg-bg-card absolute right-0 z-50 mt-2 w-56 origin-top-right overflow-hidden rounded-[var(--radius-lg)] border shadow-[0_12px_40px_-8px_rgba(0,0,0,0.4)]"
          style={{ animation: "menu-pop 140ms ease-out" }}
        >
          <div className="border-line-faint border-b px-3 py-2.5">
            <div className="text-text truncate font-serif text-sm font-medium">
              {fullName}
            </div>
            {email && (
              <div className="text-text-mute mt-0.5 truncate font-sans text-[11px]">
                {email}
              </div>
            )}
          </div>
          <MenuItem href="/perfil" icon={User} onClick={() => setOpen(false)}>
            Perfil &amp; plano
          </MenuItem>
          <MenuItem
            href="/onboarding"
            icon={SettingsIcon}
            onClick={() => setOpen(false)}
          >
            Refazer onboarding
          </MenuItem>
          {isAdmin && (
            <MenuItem
              href="/admin/users"
              icon={Crown}
              onClick={() => setOpen(false)}
              accent
            >
              Painel admin
            </MenuItem>
          )}
          <div className="border-line-faint border-t">
            <MenuItem href="/login" icon={LogOut} onClick={() => setOpen(false)}>
              Login / Sair
            </MenuItem>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes menu-pop {
          from { opacity: 0; transform: translateY(-4px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes menu-pop { from, to { opacity: 1; transform: none; } }
        }
      `}</style>
    </div>
  );
}

function MenuItem({
  href,
  icon: Icon,
  onClick,
  children,
  accent,
}: {
  href: string;
  icon: React.ElementType;
  onClick: () => void;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2.5 font-sans text-sm transition-colors",
        accent
          ? "text-brand hover:bg-brand/10"
          : "text-text-dim hover:bg-bg-elev hover:text-text",
      )}
    >
      <Icon className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
      <span>{children}</span>
    </Link>
  );
}
