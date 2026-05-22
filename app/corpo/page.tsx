"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { WeightChart } from "@/components/corpo/WeightChart";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { StatCard } from "@/components/ui/StatCard";
import { formatDateBR, todayStr } from "@/lib/dates";
import type { BodyMetric } from "@/lib/types";
import { useDataStore } from "@/lib/useDataStore";
import { cn } from "@/lib/utils";

type FormState = {
  date: string;
  weight: string;
  bodyFatPct: string;
  waist: string;
  chest: string;
  arm: string;
  hip: string;
  thigh: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  date: todayStr(),
  weight: "",
  bodyFatPct: "",
  waist: "",
  chest: "",
  arm: "",
  hip: "",
  thigh: "",
  notes: "",
};

export default function CorpoPage() {
  const store = useDataStore();
  const { data, hydrated } = store;
  const upsertBodyMetric = store.upsertBodyMetric;
  const deleteBodyMetric = store.deleteBodyMetric;

  const metrics = data.bodyMetrics;
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  // Pré-preenche peso/medidas com a entrada existente da data selecionada
  // (sem useEffect — recomputado direto a partir do valor de date).
  const existingForDate = useMemo(
    () => metrics.find((m) => m.date === form.date),
    [metrics, form.date],
  );

  const sortedDesc = useMemo(
    () => [...metrics].sort((a, b) => b.date.localeCompare(a.date)),
    [metrics],
  );
  const latest = sortedDesc[0];
  const first = sortedDesc[sortedDesc.length - 1];
  const delta = latest && first && latest.date !== first.date
    ? latest.weight - first.weight
    : null;

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onDateChange = (newDate: string) => {
    const found = metrics.find((m) => m.date === newDate);
    if (found) {
      setForm({
        date: newDate,
        weight: String(found.weight),
        bodyFatPct: found.bodyFatPct != null ? String(found.bodyFatPct) : "",
        waist: found.waist != null ? String(found.waist) : "",
        chest: found.chest != null ? String(found.chest) : "",
        arm: found.arm != null ? String(found.arm) : "",
        hip: found.hip != null ? String(found.hip) : "",
        thigh: found.thigh != null ? String(found.thigh) : "",
        notes: found.notes ?? "",
      });
    } else {
      setForm({ ...EMPTY_FORM, date: newDate });
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const weight = parseFloat(form.weight.replace(",", "."));
    if (!Number.isFinite(weight) || weight <= 0) {
      alert("Informe o peso em kg.");
      return;
    }
    const metric: BodyMetric = {
      date: form.date,
      weight,
      bodyFatPct: parseOptional(form.bodyFatPct),
      waist: parseOptional(form.waist),
      chest: parseOptional(form.chest),
      arm: parseOptional(form.arm),
      hip: parseOptional(form.hip),
      thigh: parseOptional(form.thigh),
      notes: form.notes.trim() || undefined,
    };
    upsertBodyMetric?.(metric);
    setForm((f) => ({ ...EMPTY_FORM, date: f.date }));
  };

  return (
    <>
      <ScreenHeader title="Corpo" subtitle="Peso e medidas" />

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard
          label="Peso atual"
          value={latest ? latest.weight.toFixed(1) : "—"}
          unit={latest ? "kg" : undefined}
          sub={latest ? formatDateBR(latest.date) : "Sem dados"}
        />
        <StatCard
          label="Variação"
          value={delta == null ? "—" : (delta > 0 ? "+" : "") + delta.toFixed(1)}
          unit={delta != null ? "kg" : undefined}
          sub={delta == null ? "1+ medição" : `desde ${formatDateBR(first.date)}`}
        />
        <StatCard
          label="Medições"
          value={metrics.length}
          sub={metrics.length === 1 ? "registro" : "registros"}
          className="col-span-2 md:col-span-1"
        />
      </div>

      {/* Chart */}
      <Panel title="Histórico de peso" className="mb-4">
        <WeightChart metrics={metrics} />
      </Panel>

      {/* Form */}
      <Panel
        title={existingForDate ? "Editar medição" : "Nova medição"}
        className="mb-4"
      >
        <form onSubmit={submit} className={cn(!hydrated && "opacity-60")}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Data" full>
              <input
                type="date"
                value={form.date}
                max={todayStr()}
                onChange={(e) => onDateChange(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Peso (kg)" required>
              <input
                inputMode="decimal"
                placeholder="ex. 78.4"
                value={form.weight}
                onChange={(e) => update("weight", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="% Gordura">
              <input
                inputMode="decimal"
                placeholder="opcional"
                value={form.bodyFatPct}
                onChange={(e) => update("bodyFatPct", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Cintura (cm)">
              <input
                inputMode="decimal"
                value={form.waist}
                onChange={(e) => update("waist", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Peito (cm)">
              <input
                inputMode="decimal"
                value={form.chest}
                onChange={(e) => update("chest", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Braço (cm)">
              <input
                inputMode="decimal"
                value={form.arm}
                onChange={(e) => update("arm", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Quadril (cm)">
              <input
                inputMode="decimal"
                value={form.hip}
                onChange={(e) => update("hip", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Coxa (cm)">
              <input
                inputMode="decimal"
                value={form.thigh}
                onChange={(e) => update("thigh", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Notas" full>
              <input
                type="text"
                placeholder="ex. após treino, em jejum…"
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit" block>
              {existingForDate ? "Atualizar" : "Salvar"}
            </Button>
          </div>
        </form>
      </Panel>

      {/* History list */}
      {sortedDesc.length > 0 && (
        <Panel title="Medições anteriores" className="mb-4">
          <ul className="divide-line-faint divide-y">
            {sortedDesc.map((m) => (
              <li key={m.date} className="flex items-center justify-between py-3">
                <button
                  type="button"
                  onClick={() => onDateChange(m.date)}
                  className="flex flex-col items-start text-left"
                >
                  <span className="font-serif text-lg font-medium tabular">
                    {m.weight.toFixed(1)}{" "}
                    <span className="text-text-dim text-sm">kg</span>
                  </span>
                  <span className="text-text-mute mt-0.5 font-sans text-[10px] tracking-[0.16em] uppercase">
                    {formatDateBR(m.date)}
                    {m.bodyFatPct != null && ` · ${m.bodyFatPct.toFixed(1)}% gordura`}
                    {m.waist != null && ` · cintura ${m.waist}cm`}
                  </span>
                  {m.notes && (
                    <span className="text-text-dim mt-1 text-xs">{m.notes}</span>
                  )}
                </button>
                <button
                  type="button"
                  aria-label={`Apagar medição de ${formatDateBR(m.date)}`}
                  onClick={() => {
                    if (confirm(`Apagar a medição de ${formatDateBR(m.date)}?`)) {
                      deleteBodyMetric?.(m.date);
                    }
                  }}
                  className="text-text-mute hover:text-danger flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}

function parseOptional(s: string): number | undefined {
  const v = parseFloat(s.replace(",", "."));
  return Number.isFinite(v) && v > 0 ? v : undefined;
}

const inputCls =
  "border-line bg-bg text-text focus:border-brand h-11 w-full rounded-[var(--radius)] border px-3 font-sans text-sm tabular outline-none transition-colors";

function Field({
  label,
  required,
  full,
  children,
}: {
  label: string;
  required?: boolean;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", full && "col-span-2")}>
      <span className="text-text-mute font-sans text-[10px] tracking-[0.16em] uppercase">
        {label}
        {required && <span className="text-brand ml-1">*</span>}
      </span>
      {children}
    </label>
  );
}
