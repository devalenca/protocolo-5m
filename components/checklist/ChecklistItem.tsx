"use client";

import { cn } from "@/lib/utils";
import type { ChecklistItem as ChecklistItemType } from "@/lib/types";

type Props = {
  item: ChecklistItemType;
  checked: boolean;
  onToggle: () => void;
};

export function ChecklistItem({ item, checked, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className={cn(
        "border-line bg-bg-card hover:border-line-strong flex w-full items-start gap-3 rounded-[var(--radius)] border p-3.5 text-left transition-colors",
        checked && "border-success/40 bg-success/5",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border transition-colors",
          checked
            ? "border-success bg-success text-white"
            : "border-line-strong bg-bg",
        )}
        aria-hidden="true"
      >
        {checked && (
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
            <path
              d="M3 8.5l3 3 7-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <div className="flex-1">
        <div
          className={cn(
            "font-serif text-[15px] leading-tight",
            checked ? "text-text-dim line-through" : "text-text",
          )}
        >
          {item.text}
        </div>
        <div className="text-text-mute mt-0.5 font-sans text-[11px]">{item.sub}</div>
      </div>
    </button>
  );
}
