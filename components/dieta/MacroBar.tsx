import { cn } from "@/lib/utils";

type MacroBarProps = {
  label: string;
  current: number;
  goal: number;
  unit?: string;
  /** Cor da barra (CSS var). default: --brand */
  accent?: string;
  className?: string;
};

/* =================================================================
   MacroBar — barra de progresso macro (atual / meta)
   ----------------------------------------------------------------
   - Mostra fração e percentual, com cap visual em 100% (overshoot
     ainda exibe a fração real no texto).
   ================================================================= */

export function MacroBar({
  label,
  current,
  goal,
  unit = "g",
  accent = "var(--brand)",
  className,
}: MacroBarProps) {
  const pct = goal === 0 ? 0 : (current / goal) * 100;
  const clamped = Math.min(100, Math.max(0, pct));
  const over = pct > 100;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-text-mute font-sans text-[10px] tracking-[0.16em] uppercase">
          {label}
        </span>
        <span className="font-serif text-sm tabular">
          <span className={cn("font-medium", over ? "text-danger" : "text-text")}>
            {round1(current)}
          </span>
          <span className="text-text-dim"> / {goal}</span>
          <span className="text-text-mute text-xs"> {unit}</span>
        </span>
      </div>
      <div className="bg-bg-elev relative h-1.5 w-full overflow-hidden rounded-full">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-300"
          style={{
            width: `${clamped}%`,
            background: over ? "var(--danger)" : accent,
          }}
        />
      </div>
    </div>
  );
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
