"use client";

import { ThemeTogglerButton } from "@/components/animate-ui/components/buttons/theme-toggler";
import { CommandTrigger } from "./CommandTrigger";
import { UserMenu } from "./UserMenu";

/* =================================================================
   TopBar — barra superior persistente
   ----------------------------------------------------------------
   Mobile-only (desktop usa Sidebar). Visível em todas as rotas.
   Layout: logo · Cmd+K trigger · theme · user menu
   ================================================================= */

export function TopBar() {
  return (
    <header
      className="border-line-faint bg-bg/70 fixed top-0 right-0 left-0 z-40 border-b backdrop-blur-xl lg:hidden"
      style={{
        paddingTop: "max(env(safe-area-inset-top), 0px)",
        paddingLeft: "max(env(safe-area-inset-left), 16px)",
        paddingRight: "max(env(safe-area-inset-right), 16px)",
      }}
    >
      <div className="mx-auto flex h-14 w-full max-w-md items-center gap-2">
        <div className="flex items-center gap-2">
          <div
            aria-hidden
            className="border-brand/40 bg-brand/10 text-brand relative flex h-8 w-8 items-center justify-center rounded-xl border font-serif text-[11px] font-semibold"
          >
            5M
            <span
              aria-hidden
              className="bg-brand absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full"
              style={{ animation: "pulse 2s ease-in-out infinite" }}
            />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-serif text-[13px] font-semibold tracking-tight">
              Protocolo
            </span>
            <span className="text-text-mute font-sans text-[8px] tracking-[0.2em] uppercase">
              Recomposição
            </span>
          </div>
        </div>

        <div className="ml-2 flex-1">
          <CommandTrigger variant="compact" />
        </div>

        <div className="flex items-center gap-1.5">
          <ThemeTogglerButton
            variant="outline"
            size="default"
            aria-label="Alternar tema"
          />
          <UserMenu />
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes pulse { from, to { opacity: 1; } }
        }
      `}</style>
    </header>
  );
}
