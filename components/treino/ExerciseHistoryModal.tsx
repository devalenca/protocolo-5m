"use client";

import { useQuery } from "convex/react";
import { useMemo } from "react";
import { api } from "@/convex/_generated/api";
import { Modal } from "@/components/ui/Modal";
import { formatDateBR, parseDate } from "@/lib/dates";
import { useDeviceId } from "@/lib/deviceId";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  exerciseName: string;
};

const CHART_W = 560;
const CHART_H = 160;
const PAD_T = 16;
const PAD_B = 22;
const PAD_L = 32;
const PAD_R = 10;

/* =================================================================
   ExerciseHistoryModal — timeline de e1RM + sessões
   ----------------------------------------------------------------
   Mostra:
   - Stats: e1RM atual + máx + tonnage da última sessão
   - Mini-chart de e1RM ao longo do tempo (SVG inline)
   - Lista das últimas sessões com séries detalhadas
   ================================================================= */

export function ExerciseHistoryModal({ open, onClose, exerciseName }: Props) {
  const deviceId = useDeviceId();
  const sessions = useQuery(
    api.workouts.getExerciseHistory,
    deviceId && open ? { deviceId, exerciseName, limit: 25 } : "skip",
  );

  const ordered = useMemo(
    () => (sessions ?? []).slice().sort((a, b) => a.finishedAt - b.finishedAt),
    [sessions],
  );

  const maxE1RM = useMemo(
    () => ordered.reduce((m, s) => Math.max(m, s.bestE1RM), 0),
    [ordered],
  );
  const currentE1RM = ordered.length > 0 ? ordered[ordered.length - 1].bestE1RM : 0;
  const lastTonnage = ordered.length > 0 ? ordered[ordered.length - 1].tonnage : 0;

  return (
    <Modal open={open} onClose={onClose} title={exerciseName}>
      {sessions === undefined ? (
        <div className="text-text-mute py-6 text-center text-sm">Carregando…</div>
      ) : ordered.length === 0 ? (
        <div className="text-text-mute py-6 text-center text-sm">
          Sem histórico desse exercício ainda.
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-3 gap-2">
            <StatCell label="e1RM atual" value={`${currentE1RM} kg`} />
            <StatCell label="Melhor e1RM" value={`${maxE1RM} kg`} accent />
            <StatCell label="Última tonelagem" value={`${lastTonnage} kg`} />
          </div>

          <div className="border-line bg-bg-card mb-4 rounded-[var(--radius)] border p-2">
            <E1RMChart sessions={ordered} maxE1RM={maxE1RM} />
          </div>

          <div className="text-text-mute mb-2 font-sans text-[10px] tracking-[0.18em] uppercase">
            Sessões ({ordered.length})
          </div>
          <ul className="-mx-1 max-h-[40dvh] space-y-1 overflow-y-auto">
            {ordered
              .slice()
              .reverse()
              .map((s, i) => (
                <li
                  key={s.finishedAt + "_" + i}
                  className="border-line-faint hover:bg-bg-elev rounded-[var(--radius)] border px-3 py-2.5"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-serif text-sm">{formatDateBR(s.date)}</span>
                    <span className="text-brand font-serif text-sm tabular">
                      e1RM {s.bestE1RM}
                      <span className="text-text-dim text-xs"> kg</span>
                    </span>
                  </div>
                  <div className="text-text-mute mt-1 flex flex-wrap gap-x-3 gap-y-1 font-sans text-[10px] tabular">
                    {s.sets
                      .filter((set) => set.weight && set.reps)
                      .map((set, j) => (
                        <span key={j} className="text-text-dim">
                          {set.weight}
                          <span className="text-text-mute">kg</span> × {set.reps}
                          {set.rpe && (
                            <span className="text-text-mute"> @ RPE{set.rpe}</span>
                          )}
                        </span>
                      ))}
                  </div>
                  {s.sets.some((set) => set.notes) && (
                    <div className="text-text-dim mt-1 font-sans text-[10px] italic">
                      {s.sets
                        .filter((set) => set.notes)
                        .map((set) => set.notes)
                        .join(" · ")}
                    </div>
                  )}
                </li>
              ))}
          </ul>
        </>
      )}
    </Modal>
  );
}

function StatCell({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="border-line bg-bg-card rounded-[var(--radius)] border p-2.5">
      <div className="text-text-mute font-sans text-[9px] tracking-[0.16em] uppercase">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 font-serif text-base tabular",
          accent ? "text-brand font-semibold" : "text-text",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function E1RMChart({
  sessions,
  maxE1RM,
}: {
  sessions: { date: string; bestE1RM: number; finishedAt: number }[];
  maxE1RM: number;
}) {
  if (sessions.length === 0) return null;

  if (sessions.length === 1) {
    return (
      <div className="text-text-mute flex h-[120px] items-center justify-center text-xs">
        Logue mais sessões pra ver tendência
      </div>
    );
  }

  const minE = sessions.reduce((m, s) => Math.min(m, s.bestE1RM), Infinity);
  const pad = Math.max(2, (maxE1RM - minE) * 0.15);
  const yMin = Math.floor(minE - pad);
  const yMax = Math.ceil(maxE1RM + pad);
  const yRange = yMax - yMin || 1;

  const firstT = parseDate(sessions[0].date).getTime();
  const lastT = parseDate(sessions[sessions.length - 1].date).getTime();
  const xRange = lastT - firstT || 1;

  const xOf = (d: string) =>
    PAD_L + ((parseDate(d).getTime() - firstT) / xRange) * (CHART_W - PAD_L - PAD_R);
  const yOf = (v: number) =>
    PAD_T + (1 - (v - yMin) / yRange) * (CHART_H - PAD_T - PAD_B);

  const points = sessions.map((s) => ({ x: xOf(s.date), y: yOf(s.bestE1RM), s }));
  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${CHART_H - PAD_B} L ${points[0].x.toFixed(1)} ${CHART_H - PAD_B} Z`;

  const yTicks = [0, 1, 2].map((i) => {
    const v = yMin + (yRange * i) / 2;
    return { v: Math.round(v), y: yOf(yMin + (yRange * i) / 2) };
  });

  return (
    <svg
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      className="block h-auto w-full"
      role="img"
      aria-label="Evolução do e1RM"
    >
      <defs>
        <linearGradient id="e1rm-area" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {yTicks.map((t) => (
        <g key={t.v}>
          <line
            x1={PAD_L}
            x2={CHART_W - PAD_R}
            y1={t.y}
            y2={t.y}
            stroke="var(--line-faint)"
            strokeWidth={1}
            strokeDasharray="2 3"
          />
          <text
            x={PAD_L - 4}
            y={t.y + 3}
            textAnchor="end"
            fontSize="9"
            fill="var(--text-mute)"
          >
            {t.v}
          </text>
        </g>
      ))}

      <text
        x={points[0].x}
        y={CHART_H - 6}
        textAnchor="start"
        fontSize="9"
        fill="var(--text-mute)"
      >
        {formatDateBR(sessions[0].date)}
      </text>
      <text
        x={points[points.length - 1].x}
        y={CHART_H - 6}
        textAnchor="end"
        fontSize="9"
        fill="var(--text-mute)"
      >
        {formatDateBR(sessions[sessions.length - 1].date)}
      </text>

      <path d={areaD} fill="url(#e1rm-area)" />
      <path
        d={pathD}
        fill="none"
        stroke="var(--brand)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {points.map((p) => (
        <circle
          key={p.s.finishedAt}
          cx={p.x}
          cy={p.y}
          r={3}
          fill="var(--bg-card)"
          stroke="var(--brand)"
          strokeWidth={2}
        >
          <title>
            {formatDateBR(p.s.date)} — e1RM {p.s.bestE1RM} kg
          </title>
        </circle>
      ))}
    </svg>
  );
}
