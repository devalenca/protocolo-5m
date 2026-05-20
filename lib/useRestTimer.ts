"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type TimerState = {
  remaining: number;
  total: number;
  running: boolean;
};

export function useRestTimer() {
  const [state, setState] = useState<TimerState>({
    remaining: 0,
    total: 0,
    running: false,
  });
  const endAtRef = useRef<number | null>(null);

  // Loop só ativo enquanto está rodando — encerra ao chegar a zero.
  useEffect(() => {
    if (!state.running || endAtRef.current == null) return;

    const id = window.setInterval(() => {
      if (endAtRef.current == null) return;
      const remaining = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
      if (remaining <= 0) {
        endAtRef.current = null;
        if ("vibrate" in navigator) navigator.vibrate?.([10, 60, 10]);
        setState({ remaining: 0, total: 0, running: false });
      } else {
        setState((prev) => ({ ...prev, remaining }));
      }
    }, 250);

    return () => window.clearInterval(id);
  }, [state.running]);

  const start = useCallback((seconds: number) => {
    endAtRef.current = Date.now() + seconds * 1000;
    setState({ remaining: seconds, total: seconds, running: true });
  }, []);

  const cancel = useCallback(() => {
    endAtRef.current = null;
    setState({ remaining: 0, total: 0, running: false });
  }, []);

  return { ...state, start, cancel };
}

export function formatMMSS(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
