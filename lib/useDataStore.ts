"use client";

import { CONVEX_ENABLED } from "@/components/providers/ConvexClientProvider";
import { useConvexStore } from "./useConvexStore";
import { useStore } from "./useStore";

/* =================================================================
   useDataStore — escolhe local (localStorage) ou cloud (Convex).
   Decisão feita uma vez por sessão baseado em NEXT_PUBLIC_CONVEX_URL.
   Hooks são chamados deterministicamente — não viola rules of hooks
   porque o flag é constante em tempo de bundle.
   ================================================================= */

export function useDataStore() {
  if (CONVEX_ENABLED) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useConvexStore();
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return { ...useStore(), deviceId: null as string | null };
}
