"use client";

import { Command, Search } from "lucide-react";
import { useEffect, useState } from "react";

/* =================================================================
   CommandTrigger — botão visível pro Cmd+K
   ----------------------------------------------------------------
   Detecta plataforma pra exibir "⌘ K" no Mac e "Ctrl K" no resto.
   O atalho real é tratado pelo CommandPalette listener.
   ================================================================= */

type Variant = "compact" | "search";

export function CommandTrigger({ variant = "compact" }: { variant?: Variant }) {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    // userAgent é deprecated mas funciona; userAgentData só Chromium
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMac(/Mac|iPhone|iPad/.test(navigator.userAgent));
  }, []);

  const dispatch = () => {
    // Reusa o handler global enviando ⌘K sintético
    const ev = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: isMac,
      ctrlKey: !isMac,
      bubbles: true,
    });
    window.dispatchEvent(ev);
  };

  if (variant === "search") {
    return (
      <button
        type="button"
        onClick={dispatch}
        className="border-line bg-bg-card/60 hover:border-line-strong hover:bg-bg-elev focus-visible:ring-brand text-text-mute flex w-full max-w-xs items-center gap-2 rounded-full border px-3 py-1.5 font-sans text-xs tracking-wide transition-colors focus-visible:ring-2 focus-visible:outline-none"
        aria-label="Abrir paleta de comandos"
      >
        <Search className="h-3.5 w-3.5" aria-hidden />
        <span className="hidden sm:inline">Buscar página, ação…</span>
        <span className="inline sm:hidden">Buscar…</span>
        <span className="flex-1" />
        <kbd
          aria-hidden
          className="border-line bg-bg/60 inline-flex h-5 items-center rounded border px-1.5 font-sans text-[10px] tracking-wider"
        >
          {isMac ? "⌘" : "Ctrl"} K
        </kbd>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={dispatch}
      className="border-line bg-bg-card/60 hover:bg-bg-elev focus-visible:ring-brand text-text-mute hover:text-text inline-flex h-9 items-center gap-1.5 rounded-full border px-2.5 font-sans text-[11px] tracking-wide transition-colors focus-visible:ring-2 focus-visible:outline-none"
      aria-label="Abrir paleta de comandos"
    >
      <Command className="h-3 w-3" aria-hidden />
      <span className="hidden md:inline">K</span>
      <span className="md:hidden">Buscar</span>
    </button>
  );
}
