"use client";

import { useQuery } from "convex/react";
import { Pill } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { CONVEX_ENABLED } from "@/components/providers/ConvexClientProvider";
import { Panel } from "@/components/ui/Panel";
import { useDeviceId } from "@/lib/deviceId";
import { cn } from "@/lib/utils";

/* =================================================================
   SupplementsPanel — lista personalizada vinda do supplementPlan
   ----------------------------------------------------------------
   Suplementos são gerados pelo planGenerator a partir do objetivo
   do user no onboarding. Cada item tem prioridade (essencial/
   recomendado/opcional) e justificativa curta.
   ================================================================= */

const PRIORITY_STYLE: Record<string, string> = {
  essencial: "bg-success/10 text-success border-success/30",
  recomendado: "bg-brand/10 text-brand border-brand/30",
  opcional: "bg-bg-elev text-text-mute border-line",
};

const PRIORITY_LABEL: Record<string, string> = {
  essencial: "Essencial",
  recomendado: "Recomendado",
  opcional: "Opcional",
};

export function SupplementsPanel() {
  const deviceId = useDeviceId();
  const rows = useQuery(
    api.supplementPlan.list,
    CONVEX_ENABLED && deviceId ? { deviceId } : "skip",
  );

  if (!rows || rows.length === 0) return null;

  return (
    <Panel
      className="mb-3"
      title="Sua suplementação"
      action={
        <span className="inline-flex items-center gap-1 text-[10px] tracking-[0.16em] uppercase">
          <Pill className="h-3 w-3" /> Gerado pelo onboarding
        </span>
      }
    >
      <ul className="space-y-2.5">
        {rows.map((r) => {
          const priority = r.priority ?? "recomendado";
          return (
            <li
              key={r._id}
              className="border-line-faint flex gap-3 rounded-[var(--radius)] border p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-serif text-sm font-medium">{r.name}</span>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 font-sans text-[9px] tracking-[0.12em] uppercase",
                      PRIORITY_STYLE[priority],
                    )}
                  >
                    {PRIORITY_LABEL[priority]}
                  </span>
                </div>
                <div className="text-text-dim mt-0.5 font-serif text-xs tabular">
                  {r.dose} · {r.timing}
                </div>
                {r.why && (
                  <div className="text-text-mute mt-1 font-sans text-[11px] leading-snug">
                    {r.why}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
