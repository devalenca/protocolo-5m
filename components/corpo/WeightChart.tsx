"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatDateBR, parseDate } from "@/lib/dates";
import type { BodyMetric } from "@/lib/types";

type WeightChartProps = {
  metrics: BodyMetric[];
  className?: string;
};

/* =================================================================
   WeightChart — SVG line chart de peso ao longo do tempo
   ----------------------------------------------------------------
   - Mostra pontos + linha conectando.
   - Eixo Y auto-escala (min/max do conjunto com folga 1kg).
   - Tooltip nativo via <title> em cada ponto.
   - Sem libs externas.
   ================================================================= */

const WIDTH = 640;
const HEIGHT = 220;
const PAD_TOP = 20;
const PAD_BOTTOM = 28;
const PAD_LEFT = 36;
const PAD_RIGHT = 12;

export function WeightChart({ metrics, className }: WeightChartProps) {
  const series = useMemo(
    () => [...metrics].sort((a, b) => a.date.localeCompare(b.date)),
    [metrics],
  );

  if (series.length === 0) {
    return (
      <div
        className={cn(
          "border-line bg-bg-card text-text-mute flex h-[220px] items-center justify-center rounded-[var(--radius)] border text-sm",
          className,
        )}
      >
        Sem medições ainda — registre seu primeiro peso.
      </div>
    );
  }

  if (series.length === 1) {
    const single = series[0];
    return (
      <div
        className={cn(
          "border-line bg-bg-card flex h-[220px] flex-col items-center justify-center gap-2 rounded-[var(--radius)] border",
          className,
        )}
      >
        <div className="text-brand font-serif text-4xl font-semibold tabular">
          {single.weight.toFixed(1)}
          <span className="text-text-dim ml-1 text-lg">kg</span>
        </div>
        <div className="text-text-mute font-sans text-[10px] tracking-[0.18em] uppercase">
          {formatDateBR(single.date)} · registre outra medição pra ver tendência
        </div>
      </div>
    );
  }

  const weights = series.map((m) => m.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  // folga 1kg acima/abaixo, mas mínimo de 2kg de range pra não achatar
  const padW = Math.max(1, (maxW - minW) * 0.15);
  const yMin = Math.floor(minW - padW);
  const yMax = Math.ceil(maxW + padW);
  const yRange = yMax - yMin || 1;

  const firstTime = parseDate(series[0].date).getTime();
  const lastTime = parseDate(series[series.length - 1].date).getTime();
  const xRange = lastTime - firstTime || 1;

  const xOf = (date: string) => {
    const t = parseDate(date).getTime();
    return (
      PAD_LEFT +
      ((t - firstTime) / xRange) * (WIDTH - PAD_LEFT - PAD_RIGHT)
    );
  };
  const yOf = (weight: number) => {
    const norm = (weight - yMin) / yRange;
    return PAD_TOP + (1 - norm) * (HEIGHT - PAD_TOP - PAD_BOTTOM);
  };

  const points = series.map((m) => ({
    x: xOf(m.date),
    y: yOf(m.weight),
    metric: m,
  }));
  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(2)} ${HEIGHT - PAD_BOTTOM} L ${points[0].x.toFixed(2)} ${HEIGHT - PAD_BOTTOM} Z`;

  // 4 ticks no eixo Y
  const yTicks = [0, 1, 2, 3].map((i) => {
    const v = yMin + (yRange * i) / 3;
    return { v, y: yOf(v) };
  });

  // Mostra primeiro, último, e ~3 intermediários no eixo X
  const xTicksIdx = pickIndices(series.length, 5);

  return (
    <div
      className={cn(
        "border-line bg-bg-card rounded-[var(--radius)] border p-2",
        className,
      )}
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="block h-auto w-full"
        role="img"
        aria-label="Gráfico de peso ao longo do tempo"
      >
        <defs>
          <linearGradient id="weight-area" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y gridlines + labels */}
        {yTicks.map((t) => (
          <g key={t.v}>
            <line
              x1={PAD_LEFT}
              x2={WIDTH - PAD_RIGHT}
              y1={t.y}
              y2={t.y}
              stroke="var(--line-faint)"
              strokeWidth={1}
              strokeDasharray="2 3"
            />
            <text
              x={PAD_LEFT - 6}
              y={t.y + 3}
              textAnchor="end"
              fontSize="10"
              fill="var(--text-mute)"
              fontFamily="var(--font-sans-family)"
            >
              {t.v.toFixed(0)}
            </text>
          </g>
        ))}

        {/* X labels */}
        {xTicksIdx.map((idx) => {
          const p = points[idx];
          return (
            <text
              key={series[idx].date}
              x={p.x}
              y={HEIGHT - 8}
              textAnchor="middle"
              fontSize="9"
              fill="var(--text-mute)"
              fontFamily="var(--font-sans-family)"
            >
              {formatDateBR(series[idx].date)}
            </text>
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill="url(#weight-area)" />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="var(--brand)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Points */}
        {points.map((p) => (
          <g key={p.metric.date}>
            <circle
              cx={p.x}
              cy={p.y}
              r={3.5}
              fill="var(--bg-card)"
              stroke="var(--brand)"
              strokeWidth={2}
            >
              <title>
                {formatDateBR(p.metric.date)} — {p.metric.weight.toFixed(1)} kg
              </title>
            </circle>
          </g>
        ))}
      </svg>
    </div>
  );
}

function pickIndices(total: number, want: number): number[] {
  if (total <= want) return Array.from({ length: total }, (_, i) => i);
  const out: number[] = [];
  for (let i = 0; i < want; i++) {
    out.push(Math.round((i * (total - 1)) / (want - 1)));
  }
  return Array.from(new Set(out));
}
