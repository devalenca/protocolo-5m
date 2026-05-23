"use client";

import { useQuery } from "convex/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { CONVEX_ENABLED } from "@/components/providers/ConvexClientProvider";
import { useDeviceId } from "@/lib/deviceId";

/* =================================================================
   OnboardingGate — redireciona pra /onboarding se profile não está
   "onboardado" (profileSettings.onboardedAt == null).
   ----------------------------------------------------------------
   - Skipa em rotas onde redirect seria loop ou seria intrusivo:
     /onboarding, /login
   - Skipa se Convex desligado (modo offline)
   - Skipa enquanto query ainda está loading
   ================================================================= */

const SKIP_PATHS = ["/onboarding", "/login"];

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const deviceId = useDeviceId();

  const settings = useQuery(
    api.profileSettings.get,
    CONVEX_ENABLED && deviceId ? { deviceId } : "skip",
  );

  useEffect(() => {
    if (!CONVEX_ENABLED) return;
    if (settings === undefined) return; // still loading
    if (SKIP_PATHS.some((p) => pathname.startsWith(p))) return;

    const onboarded = settings != null && settings.onboardedAt != null;
    if (!onboarded) {
      router.replace("/onboarding");
    }
  }, [settings, pathname, router]);

  return <>{children}</>;
}
