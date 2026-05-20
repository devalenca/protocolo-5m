"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
};

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  // Garante acesso seguro ao document só após mount (SSR safe).
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  // Portal pro body — escapa de qualquer stacking context (backdrop-blur,
  // transform, filter, etc.) na árvore acima. Sem isso o modal fica preso
  // dentro da TopBar fixa em mobile.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div
        className={cn(
          "border-line bg-bg-card relative w-full max-w-md rounded-t-[var(--radius-xl)] border p-5 shadow-[var(--shadow-lg)] sm:rounded-[var(--radius-xl)]",
          "max-h-[88dvh] overflow-y-auto",
          className,
        )}
        style={{ paddingBottom: "calc(20px + var(--safe-bottom))" }}
      >
        <div className="bg-line-strong mx-auto mb-4 h-1 w-10 rounded-full sm:hidden" />
        {title && (
          <h3 className="mb-3 font-serif text-lg font-semibold tracking-tight">
            {title}
          </h3>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
