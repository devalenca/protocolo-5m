"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Flame, Trophy } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { StatCard } from "@/components/ui/StatCard";
import { WeekGrid } from "@/components/ui/WeekGrid";
import { ACHIEVEMENTS, PROTOCOL_DAYS, WORKOUTS, WORKOUT_ORDER } from "@/lib/constants";
import { formatDateBR, greetingFor, todayStr } from "@/lib/dates";
import {
  daysSinceStart,
  getDayProgress,
  getStreakFromData,
  getWeekAdherence,
  getWeekDays,
  lastWorkout,
  suggestNextWorkout,
} from "@/lib/domain";
import { useDataStore } from "@/lib/useDataStore";

export default function HomePage() {
  const { data, hydrated } = useDataStore();
  const [now, setNow] = useState<Date | null>(null);

  // Greeting depende do horário do cliente — deferido pra evitar mismatch SSR.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
  }, []);

  const today = todayStr();
  const todayPct = getDayProgress(data, today);
  const streak = getStreakFromData(data);
  const weekPct = getWeekAdherence(data);
  const totalDays = daysSinceStart(data);
  const totalWorkouts = data.workouts.length;
  const suggestion = suggestNextWorkout(data, WORKOUTS, WORKOUT_ORDER);
  const last = lastWorkout(data);

  const weekDays = useMemo(
    () =>
      getWeekDays().map(({ date, today }) => ({
        date,
        today,
        pct: getDayProgress(data, date).pct,
      })),
    [data],
  );

  const unlocked = ACHIEVEMENTS.filter((a) => data.achievements.includes(a.id));

  const greeting = now ? greetingFor(now.getHours()) : "Olá";

  return (
    <>
      <ScreenHeader title={greeting} subtitle={`Dia ${totalDays} de ${PROTOCOL_DAYS}`} />

      {/* Hero — streak */}
      <Panel className="from-bg-card to-bg-elev mb-4 bg-gradient-to-br text-center">
        <div className="text-text-mute inline-flex items-center gap-1.5 font-sans text-[10px] tracking-[0.18em] uppercase">
          <Flame className="text-brand h-3 w-3" />
          Sequência atual
        </div>
        <div className="text-brand mt-2 font-serif text-5xl font-semibold tabular">
          {streak}
          <span className="text-text-dim ml-2 text-lg">{streak === 1 ? "dia" : "dias"}</span>
        </div>
        <p className="text-text-dim mt-2 text-sm">{streakMessage(streak, hydrated)}</p>
      </Panel>

      {/* Quick action */}
      <Link
        href="/treino"
        className="border-brand/30 bg-brand/5 hover:bg-brand/10 mb-4 flex items-center justify-between rounded-[var(--radius-lg)] border p-4 transition-colors"
      >
        <div>
          <div className="text-text-mute font-sans text-[10px] tracking-[0.18em] uppercase">
            Próximo treino
          </div>
          <div className="mt-1 font-serif text-base font-medium">
            {suggestion.name} · {suggestion.focus.split(" · ")[0]}
          </div>
        </div>
        <ArrowRight className="text-brand h-5 w-5" />
      </Link>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <StatCard
          label="Hoje"
          value={todayPct.pct}
          unit="%"
          sub={`${todayPct.count} de ${todayPct.total} itens`}
        />
        <StatCard
          label="Esta semana"
          value={weekPct}
          unit="%"
          sub="Média de adesão"
        />
      </div>

      {/* Week grid */}
      <Panel title="Últimos 7 dias" className="mb-4">
        <WeekGrid days={weekDays} />
      </Panel>

      {/* Last workout */}
      {last && (
        <Panel
          title="Último treino"
          action={<Link href="/treino">Ver tudo →</Link>}
          className="mb-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-serif text-base font-medium">
                {WORKOUTS[last.workoutId].name}
              </div>
              <div className="text-text-mute text-xs">{formatDateBR(last.date)}</div>
            </div>
            <div className="text-right">
              <div className="text-text-dim font-sans text-[10px] tracking-[0.18em] uppercase">
                Séries
              </div>
              <div className="text-brand font-serif text-lg font-semibold tabular">
                {last.exercises.reduce(
                  (acc, e) => acc + e.sets.filter((s) => s.weight && s.reps).length,
                  0,
                )}
              </div>
            </div>
          </div>
        </Panel>
      )}

      {/* Achievements */}
      {unlocked.length > 0 && (
        <Panel title="Conquistas" className="mb-4">
          <div className="-m-1 flex flex-wrap gap-2">
            {unlocked.slice(-8).map((a) => (
              <div
                key={a.id}
                className="border-brand/30 bg-brand/5 flex items-center gap-2 rounded-full border px-3 py-1.5"
                title={a.desc}
              >
                <span className="text-base">{a.icon}</span>
                <span className="font-serif text-xs">{a.name}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* General stats */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <StatCard
          label="Treinos feitos"
          value={totalWorkouts}
          sub={totalWorkouts === 0 ? "Comece hoje" : "registrados"}
        />
        <StatCard
          label="Dias no protocolo"
          value={totalDays}
          sub={`de ${PROTOCOL_DAYS} (5 meses)`}
        />
      </div>

      {totalWorkouts === 0 && (
        <div className="text-text-faint mt-2 flex items-center justify-center gap-1 text-center font-sans text-[10px] tracking-[0.18em] uppercase">
          <Trophy className="h-3 w-3" />
          Próxima conquista: primeiro treino
        </div>
      )}
    </>
  );
}

function streakMessage(streak: number, hydrated: boolean): string {
  if (!hydrated) return "Carregando…";
  if (streak === 0) return "Comece hoje. Cada dia conta.";
  if (streak < 3) return "Mantém a régua. Pequeno passo, grande hábito.";
  if (streak < 7) return "Boa. O hábito está virando seu padrão.";
  if (streak < 14) return "Excelente — uma semana redonda.";
  if (streak < 30) return "Disciplina pura. Continua.";
  return "Mestre do protocolo.";
}
