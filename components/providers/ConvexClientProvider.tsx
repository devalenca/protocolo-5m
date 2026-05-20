"use client";

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";
import { useState, type ReactNode } from "react";

/* =================================================================
   ConvexClientProvider
   ----------------------------------------------------------------
   Wrapper que:
   - Instancia o ConvexReactClient apontando pra NEXT_PUBLIC_CONVEX_URL
   - Envelopa filhos com ConvexAuthNextjsProvider (auth context)
   Se a env var estiver ausente, devolve children direto (modo offline).
   ================================================================= */

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => {
    if (!CONVEX_URL) return null;
    return new ConvexReactClient(CONVEX_URL, {
      unsavedChangesWarning: false,
    });
  });

  if (!client) return <>{children}</>;

  return (
    <ConvexAuthNextjsProvider client={client}>
      {children}
    </ConvexAuthNextjsProvider>
  );
}

export const CONVEX_ENABLED = Boolean(CONVEX_URL);
