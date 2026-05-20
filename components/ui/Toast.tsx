"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type ToastKind = "default" | "success" | "danger" | "info";

type ToastItem = {
  id: string;
  message: string;
  kind: ToastKind;
};

type ToastContextValue = {
  push: (message: string, kind?: ToastKind) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, kind: ToastKind = "default") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, kind }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 z-50 flex flex-col items-center gap-2 px-4"
        style={{ bottom: "calc(96px + var(--safe-bottom))" }}
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((t) => (
          <ToastView key={t.id} {...t} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastView({ message, kind }: ToastItem) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setShown(true));
    return () => window.cancelAnimationFrame(id);
  }, []);
  return (
    <div
      className={cn(
        "pointer-events-auto max-w-xs rounded-[var(--radius)] border px-4 py-3 font-sans text-sm shadow-[var(--shadow)] backdrop-blur-md transition-all duration-200",
        shown ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
        kind === "success" && "border-success/40 bg-bg-card text-success",
        kind === "danger" && "border-danger/40 bg-bg-card text-danger",
        kind === "info" && "border-info/40 bg-bg-card text-info",
        kind === "default" && "border-line bg-bg-card text-text",
      )}
    >
      {message}
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider />");
  return ctx;
}
