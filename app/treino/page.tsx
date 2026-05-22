"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronRight, Trophy } from "lucide-react";
import { ExerciseHistoryModal } from "@/components/treino/ExerciseHistoryModal";
import { ExerciseLogger } from "@/components/treino/ExerciseLogger";
import { RestTimerFloat } from "@/components/treino/RestTimerFloat";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useToast } from "@/components/ui/Toast";
import { WORKOUTS, WORKOUT_ORDER } from "@/lib/constants";
import { formatDateBR } from "@/lib/dates";
import {
  getAllPRs,
  getBestE1RM,
  getPreviousBest,
  isPR,
  suggestNextWorkout,
} from "@/lib/domain";
import type { LoggedExercise, WorkoutId } from "@/lib/types";
import { useRestTimer } from "@/lib/useRestTimer";
import { useDataStore } from "@/lib/useDataStore";
import { cn } from "@/lib/utils";

type View = { mode: "picker" } | { mode: "active"; workoutId: WorkoutId };

export default function TreinoPage() {
  const { data, finishWorkout } = useDataStore();
  const [view, setView] = useState<View>({ mode: "picker" });
  const [historyExercise, setHistoryExercise] = useState<string | null>(null);
  const toast = useToast();
  const timer = useRestTimer();

  const suggestion = useMemo(
    () => suggestNextWorkout(data, WORKOUTS, WORKOUT_ORDER),
    [data],
  );
  const prs = useMemo(() => getAllPRs(data), [data]);
  const recent = useMemo(() => data.workouts.slice().reverse().slice(0, 5), [data]);

  if (view.mode === "active") {
    return (
      <>
        <ActiveWorkoutView
          workoutId={view.workoutId}
          onExit={() => setView({ mode: "picker" })}
          onFinish={(exercises, startedAt) => {
            finishWorkout(view.workoutId, exercises, startedAt);
            toast.push("Treino finalizado", "success");
            setView({ mode: "picker" });
          }}
          onShowHistory={(name) => setHistoryExercise(name)}
          timer={timer}
        />
        {historyExercise && (
          <ExerciseHistoryModal
            open={historyExercise !== null}
            onClose={() => setHistoryExercise(null)}
            exerciseName={historyExercise}
          />
        )}
      </>
    );
  }

  return (
    <>
      <ScreenHeader title="Treino" subtitle="Upper / Lower · 4× semana" />

      {/* Sugestão de próximo treino */}
      <Panel className="mb-4">
        <div className="text-text-mute font-sans text-[10px] tracking-[0.18em] uppercase">
          Sugerido agora
        </div>
        <div className="mt-1.5 flex items-end justify-between gap-3">
          <div>
            <div className="text-brand font-sans text-xs tracking-wide">
              {suggestion.day}
            </div>
            <div className="mt-0.5 font-serif text-xl font-semibold">
              {suggestion.name}
            </div>
            <div className="text-text-dim mt-0.5 text-xs">{suggestion.focus}</div>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => setView({ mode: "active", workoutId: suggestion.id })}
          >
            Começar
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </Panel>

      {/* Todos os splits */}
      <Panel title="Todos os splits" className="mb-4">
        <ul className="-m-1 grid grid-cols-1 gap-1 sm:grid-cols-2">
          {WORKOUT_ORDER.map((wid) => {
            const w = WORKOUTS[wid];
            return (
              <li key={w.id}>
                <button
                  type="button"
                  onClick={() => setView({ mode: "active", workoutId: w.id })}
                  className={cn(
                    "hover:bg-bg-elev flex w-full items-center justify-between gap-3 rounded-[var(--radius)] p-3 text-left transition-colors",
                    w.id === suggestion.id && "bg-brand/5",
                  )}
                >
                  <div className="min-w-0">
                    <div className="text-text-mute font-sans text-[10px] tracking-[0.18em] uppercase">
                      {w.day}
                    </div>
                    <div className="mt-0.5 font-serif text-sm font-medium">
                      {w.name}
                    </div>
                    <div className="text-text-dim truncate text-[11px]">
                      {w.focus}
                    </div>
                  </div>
                  <ChevronRight className="text-text-mute h-4 w-4 flex-shrink-0" />
                </button>
              </li>
            );
          })}
        </ul>
      </Panel>

      {/* PRs */}
      <Panel title="Recordes pessoais" className="mb-4">
        {Object.keys(prs).length === 0 ? (
          <div className="text-text-dim text-sm">
            Nenhum PR ainda — finalize um treino com cargas.
          </div>
        ) : (
          <ul className="divide-line-faint divide-y">
            {Object.entries(prs)
              .sort(
                ([, a], [, b]) =>
                  Number(b.weight) * Number(b.reps) - Number(a.weight) * Number(a.reps),
              )
              .slice(0, 8)
              .map(([name, pr]) => (
                <li key={name} className="first:pt-0 last:pb-0">
                  <button
                    type="button"
                    onClick={() => setHistoryExercise(name)}
                    className="hover:text-text flex w-full items-center justify-between gap-2 py-2.5 text-left transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-serif text-sm">{name}</div>
                      <div className="text-text-mute text-[10px]">
                        {formatDateBR(pr.date)} · toque pra ver histórico
                      </div>
                    </div>
                    <div className="text-brand font-serif text-sm font-medium tabular">
                      <Trophy className="mr-1 inline h-3.5 w-3.5" />
                      {pr.weight}kg × {pr.reps}
                    </div>
                  </button>
                </li>
              ))}
          </ul>
        )}
      </Panel>

      {/* Histórico */}
      <Panel title="Histórico">
        {recent.length === 0 ? (
          <div className="text-text-dim text-sm">Sem treinos registrados ainda.</div>
        ) : (
          <ul className="divide-line-faint divide-y">
            {recent.map((w) => {
              const template = WORKOUTS[w.workoutId];
              const filledSets = w.exercises.flatMap((e) =>
                e.sets.filter((s) => s.weight && s.reps),
              );
              return (
                <li
                  key={w.id}
                  className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                >
                  <div>
                    <div className="font-serif text-sm">{template.name}</div>
                    <div className="text-text-mute text-[10px]">
                      {formatDateBR(w.date)} · {filledSets.length} séries com carga
                    </div>
                  </div>
                  <ChevronRight className="text-text-mute h-4 w-4" />
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <RestTimerFloat
        remaining={timer.remaining}
        total={timer.total}
        running={timer.running}
        onCancel={timer.cancel}
      />

      {historyExercise && (
        <ExerciseHistoryModal
          open={historyExercise !== null}
          onClose={() => setHistoryExercise(null)}
          exerciseName={historyExercise}
        />
      )}
    </>
  );
}

/* ============================================================
   ACTIVE WORKOUT VIEW
   ============================================================ */

function ActiveWorkoutView({
  workoutId,
  onExit,
  onFinish,
  onShowHistory,
  timer,
}: {
  workoutId: WorkoutId;
  onExit: () => void;
  onFinish: (exercises: LoggedExercise[], startedAt: number) => void;
  onShowHistory: (exerciseName: string) => void;
  timer: ReturnType<typeof useRestTimer>;
}) {
  const { data } = useDataStore();
  const template = WORKOUTS[workoutId];
  const [startedAt] = useState(() => Date.now());
  const [exercises, setExercises] = useState<LoggedExercise[]>(() =>
    template.exercises.map((ex) => ({
      name: ex.name,
      sets: Array.from({ length: ex.sets }, () => ({ weight: "", reps: "" })),
    })),
  );

  const updateExercise = (idx: number, next: LoggedExercise) => {
    setExercises((prev) => {
      const out = prev.slice();
      out[idx] = next;
      return out;
    });
  };

  const isPRForExercise = (exName: string, weight: number, reps: number) =>
    isPR(data, workoutId, exName, weight, reps);

  const previousBests = template.exercises.map((ex) =>
    getPreviousBest(data, workoutId, ex.name),
  );

  const bestE1RMs = template.exercises.map((ex) => getBestE1RM(data, ex.name));

  return (
    <>
      <div className="border-line bg-bg-card mb-4 flex items-center justify-between rounded-[var(--radius)] border p-3">
        <div>
          <div className="text-brand font-sans text-[10px] tracking-[0.18em] uppercase">
            {template.day}
          </div>
          <div className="font-serif text-base font-medium">{template.name}</div>
          <div className="text-text-dim text-[11px]">{template.focus}</div>
        </div>
        <button
          type="button"
          aria-label="Sair do treino"
          onClick={onExit}
          className="border-line text-text-dim hover:bg-bg-elev hover:text-text flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        {template.exercises.map((ex, idx) => (
          <ExerciseLogger
            key={ex.name}
            workoutId={workoutId}
            template={ex}
            state={exercises[idx]}
            previousBest={previousBests[idx]}
            bestE1RM={bestE1RMs[idx]}
            isPRSet={(weight, reps) => isPRForExercise(ex.name, weight, reps)}
            onChange={(next) => updateExercise(idx, next)}
            onSetCompleted={(s) => timer.start(s)}
            onShowHistory={() => onShowHistory(ex.name)}
          />
        ))}
      </div>

      <div className="mt-6 mb-2">
        <Button
          variant="primary"
          size="lg"
          block
          onClick={() => onFinish(exercises, startedAt)}
        >
          Finalizar treino
        </Button>
      </div>

      <RestTimerFloat
        remaining={timer.remaining}
        total={timer.total}
        running={timer.running}
        onCancel={timer.cancel}
      />
    </>
  );
}
