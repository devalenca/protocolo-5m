"use client";

import { Settings as SettingsIcon } from "lucide-react";
import { useState } from "react";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function SettingsButton({ className }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label="Configurações"
        onClick={() => setOpen(true)}
        className={cn(
          "border-line bg-bg-card text-text-dim hover:text-text hover:border-line-strong flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
          className,
        )}
      >
        <SettingsIcon className="h-4 w-4" strokeWidth={1.6} />
      </button>
      <SettingsModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
