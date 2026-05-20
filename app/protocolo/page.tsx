"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { PROTOCOL_SECTIONS } from "@/lib/protocol-content";
import { cn } from "@/lib/utils";

export default function ProtocoloPage() {
  const [open, setOpen] = useState<string>("01");

  return (
    <>
      <ScreenHeader title="Protocolo" subtitle="Dieta · Suplementos · Compras" />

      <div className="space-y-2">
        {PROTOCOL_SECTIONS.map((s) => {
          const isOpen = open === s.num;
          return (
            <section
              key={s.num}
              className={cn(
                "border-line bg-bg-card overflow-hidden rounded-[var(--radius-lg)] border transition-colors",
                isOpen && "border-line-strong",
              )}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? "" : s.num)}
                aria-expanded={isOpen}
                className="hover:bg-bg-elev flex w-full items-center justify-between gap-3 p-4 text-left transition-colors"
              >
                <div className="flex items-baseline gap-3">
                  <span className="text-brand font-sans text-xs tracking-[0.18em]">
                    {s.num}
                  </span>
                  <span className="font-serif text-base font-medium">{s.title}</span>
                </div>
                <ChevronDown
                  className={cn(
                    "text-text-mute h-4 w-4 flex-shrink-0 transition-transform",
                    isOpen && "rotate-180",
                  )}
                />
              </button>
              <div
                className={cn(
                  "grid transition-all duration-200",
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                )}
              >
                <div className="overflow-hidden">
                  <div className="border-line-faint border-t px-4 pt-4 pb-5">
                    {s.body}
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
