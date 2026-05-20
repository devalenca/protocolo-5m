"use client";

import { useEffect, useState } from "react";

/* =================================================================
   deviceId — identidade anônima estável para esse navegador.
   Persistido em localStorage. Substitui (ou complementa) auth.
   ================================================================= */

const STORAGE_KEY = "protocolo-device-id";

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return (
    Math.random().toString(36).slice(2) + "-" + Date.now().toString(36)
  );
}

export function readDeviceId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function ensureDeviceId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const fresh = generateId();
    localStorage.setItem(STORAGE_KEY, fresh);
    return fresh;
  } catch {
    return generateId();
  }
}

/**
 * Hook que retorna o deviceId, gerando-o no primeiro render do client.
 * Retorna null no SSR e no primeiro paint (evita mismatch).
 */
export function useDeviceId(): string | null {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setId(ensureDeviceId());
  }, []);
  return id;
}
