"use client";

import { useState } from "react";
import { Trophy } from "lucide-react";
import { calcPlates, formatPlates } from "@/lib/plates";
import type {
  ExerciseSet,
  ExerciseTemplate,
  LoggedExercise,
  WorkoutId,
} from "@/lib/types";
import type { ExerciseBest } from "@/lib/domain";
import { cn } from "@/lib/utils";

type Props = {
  workoutId: WorkoutId;
  template: ExerciseTemplate;
  state: LoggedExercise;
  previousBest: ExerciseBest | null;
  isPRSet: (weight: number, reps: number) => boolean;
  onChange: (next: LoggedExercise) => void;
  onSetCompleted: (restSeconds: number) => void;
};

export function ExerciseLogger({
  template,
  state,
  previousBest,
  isPRSet,
  onChange,
  onSetCompleted,
}: Props) {
  const [expandedSetIdx, setExpandedSetIdx] = useState<number | null>(null);

  const updateSet = (idx: number, patch: Partial<ExerciseSet>) => {
    const sets = state.sets.slice();
    sets[idx] = { ...sets[idx], ...patch };
    onChange({ ...state, sets });
  };

  const markSetDone = (idx: number) => {
    onSetCompleted(template.rest);
    setExpandedSetIdx(null);
    void idx;
  };

  return (
    <div className="border-line bg-bg-card rounded-[var(--radius-lg)] border p-4">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-serif text-base font-semibold leading-tight">
            {template.name}
          </h3>
          <div className="text-text-dim mt-0.5 font-sans text-[11px]">
            {template.sets}× {template.reps} · descanso {template.rest}s
          </div>
        </div>
        {previousBest && (
          <div className="text-text-mute font-sans text-[10px] leading-tight tracking-[0.05em] text-right uppercase">
            Anterior
            <div className="text-text-dim mt-0.5 font-serif text-sm normal-case tabular">
              {previousBest.weight}kg × {previousBest.reps}
            </div>
          </div>
        )}
      </header>

      <div className="space-y-1.5">
        {state.sets.map((set, idx) => {
          const weight = Number(set.weight);
          const reps = Number(set.reps);
          const filled = weight > 0 && reps > 0;
          const pr = filled && isPRSet(weight, reps);
          const plates = template.useBar && weight > 0 ? calcPlates(weight) : null;
          const expanded = expandedSetIdx === idx;

          return (
            <div
              key={idx}
              className={cn(
                "border-line-faint rounded-[var(--radius-sm)] border p-2.5",
                filled && "border-line",
                pr && "border-warning/40 bg-warning/5",
              )}
            >
              <div className="grid grid-cols-[28px_1fr_1fr_auto] items-center gap-2">
                <span className="text-text-mute font-serif text-xs tabular">
                  {idx + 1}.
                </span>
                <NumberInput
                  value={set.weight}
                  onChange={(v) => updateSet(idx, { weight: v })}
                  placeholder={previousBest ? String(previousBest.weight) : "kg"}
                  suffix="kg"
                  step={2.5}
                  onFocus={() => setExpandedSetIdx(idx)}
                />
                <NumberInput
                  value={set.reps}
                  onChange={(v) => updateSet(idx, { reps: v })}
                  placeholder={previousBest ? String(previousBest.reps) : "reps"}
                  suffix="rep"
                  step={1}
                  onFocus={() => setExpandedSetIdx(idx)}
                />
                <button
                  type="button"
                  disabled={!filled}
                  onClick={() => markSetDone(idx)}
                  className={cn(
                    "h-9 rounded-md px-3 font-sans text-[11px] font-medium tracking-wider uppercase transition-colors",
                    filled
                      ? "bg-brand/15 text-brand hover:bg-brand/25"
                      : "bg-bg-elev text-text-mute cursor-not-allowed",
                  )}
                >
                  ✓
                </button>
              </div>
              {pr && (
                <div className="text-warning mt-1.5 flex items-center gap-1 font-sans text-[10px] tracking-[0.12em] uppercase">
                  <Trophy className="h-3 w-3" />
                  Novo recorde
                </div>
              )}
              {expanded && plates && (
                <div className="text-text-dim border-line-faint mt-2 border-t pt-2 font-sans text-[10px]">
                  Anilhas por lado: <span className="text-text">{formatPlates(plates)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type NumberInputProps = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  suffix?: string;
  step?: number;
  onFocus?: () => void;
};

function NumberInput({
  value,
  onChange,
  placeholder,
  suffix,
  step = 1,
  onFocus,
}: NumberInputProps) {
  return (
    <div className="border-line bg-bg focus-within:border-brand/50 relative flex h-9 items-center rounded-md border transition-colors">
      <input
        type="number"
        inputMode="decimal"
        value={value}
        step={step}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        className="text-text placeholder:text-text-faint w-full bg-transparent px-2.5 font-serif text-sm tabular outline-none"
      />
      {suffix && (
        <span className="text-text-mute pr-2 font-sans text-[10px] tracking-wide uppercase">
          {suffix}
        </span>
      )}
    </div>
  );
}
