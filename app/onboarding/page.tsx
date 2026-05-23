"use client";

import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useDeviceId } from "@/lib/deviceId";
import {
  ACTIVITY_LABELS,
  computeDietGoals,
  GOAL_HINTS,
  GOAL_LABELS,
  type ActivityLevel,
  type Goal,
  type Sex,
} from "@/lib/macros";
import { cn } from "@/lib/utils";

type Form = {
  displayName: string;
  age: string;
  sex: Sex | "";
  heightCm: string;
  weightKg: string;
  targetWeight: string;
  goal: Goal | "";
  biotipo: "ectomorfo" | "mesomorfo" | "endomorfo" | "";
  activityLevel: ActivityLevel | "";
  trainingDaysPerWeek: string;
  sessionDurationMin: string;
  exerciseTypes: string[];
  hasKneeIssues: boolean | null;
  dietaryRestrictions: string[];
};

const EMPTY_FORM: Form = {
  displayName: "",
  age: "",
  sex: "",
  heightCm: "",
  weightKg: "",
  targetWeight: "",
  goal: "",
  biotipo: "",
  activityLevel: "",
  trainingDaysPerWeek: "",
  sessionDurationMin: "40",
  exerciseTypes: [],
  hasKneeIssues: null,
  dietaryRestrictions: [],
};

const STEP_TITLES = [
  "Sobre você",
  "Seu corpo agora",
  "Objetivo",
  "Atividade",
  "Treino",
  "Cozinha",
  "Resumo",
];

export default function OnboardingPage() {
  const router = useRouter();
  const deviceId = useDeviceId();

  const existing = useQuery(
    api.profileSettings.get,
    deviceId ? { deviceId } : "skip",
  );
  const latestBody = useQuery(
    api.bodyMetrics.getLatest,
    deviceId ? { deviceId } : "skip",
  );
  const upsertSettings = useMutation(api.profileSettings.upsert);
  const upsertMealPlan = useMutation(api.mealPlan.upsert);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Pré-preenche com profileSettings existente (se reabrir o onboarding)
  // e com peso atual via bodyMetrics.getLatest. Marcamos com flag pra rodar
  // só na primeira vez que os dados chegam.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (hydrated) return;
    if (existing === undefined) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm((f) => ({
      ...f,
      displayName: existing?.displayName ?? f.displayName,
      age: existing?.age != null ? String(existing.age) : f.age,
      sex: existing?.sex ?? f.sex,
      heightCm: existing?.heightCm != null ? String(existing.heightCm) : f.heightCm,
      weightKg: latestBody ? String(latestBody.weight) : f.weightKg,
      targetWeight:
        existing?.targetWeight != null ? String(existing.targetWeight) : f.targetWeight,
      goal: existing?.goal ?? f.goal,
      biotipo: existing?.biotipo ?? f.biotipo,
      activityLevel: existing?.activityLevel ?? f.activityLevel,
      trainingDaysPerWeek:
        existing?.trainingDaysPerWeek != null
          ? String(existing.trainingDaysPerWeek)
          : f.trainingDaysPerWeek,
      sessionDurationMin:
        existing?.sessionDurationMin != null
          ? String(existing.sessionDurationMin)
          : f.sessionDurationMin,
      exerciseTypes: existing?.exerciseTypes ?? f.exerciseTypes,
      hasKneeIssues:
        existing?.hasKneeIssues != null ? existing.hasKneeIssues : f.hasKneeIssues,
      dietaryRestrictions: existing?.dietaryRestrictions ?? f.dietaryRestrictions,
    }));
    setHydrated(true);
  }, [existing, latestBody, hydrated]);

  const computed = useMemo(() => {
    const age = parseFloat(form.age);
    const heightCm = parseFloat(form.heightCm);
    const weightKg = parseFloat(form.weightKg);
    if (
      !form.sex ||
      !form.goal ||
      !form.activityLevel ||
      !Number.isFinite(age) ||
      !Number.isFinite(heightCm) ||
      !Number.isFinite(weightKg) ||
      age <= 0 ||
      heightCm <= 0 ||
      weightKg <= 0
    ) {
      return null;
    }
    return computeDietGoals({
      age,
      sex: form.sex,
      heightCm,
      weightKg,
      activity: form.activityLevel,
      goal: form.goal,
    });
  }, [form]);

  const update = <K extends keyof Form>(k: K, v: Form[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleListItem = (key: "exerciseTypes" | "dietaryRestrictions", id: string) =>
    setForm((f) => {
      const has = f[key].includes(id);
      return { ...f, [key]: has ? f[key].filter((x) => x !== id) : [...f[key], id] };
    });

  const canAdvance = useMemo(() => {
    switch (step) {
      case 0:
        return form.displayName.trim().length > 0 && form.age && form.sex !== "";
      case 1:
        return form.heightCm && form.weightKg;
      case 2:
        return form.goal !== "" && form.biotipo !== "";
      case 3:
        return form.activityLevel !== "";
      case 4:
        return form.trainingDaysPerWeek && form.hasKneeIssues !== null;
      case 5:
        return true; // restrições são opcionais
      case 6:
        return computed !== null;
      default:
        return false;
    }
  }, [step, form, computed]);

  const handleNext = () => {
    if (!canAdvance) return;
    if (step < STEP_TITLES.length - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!deviceId || !computed || !form.sex || !form.goal || !form.activityLevel) return;
    setSubmitting(true);
    try {
      await upsertSettings({
        deviceId,
        displayName: form.displayName.trim(),
        age: parseFloat(form.age),
        sex: form.sex,
        heightCm: parseFloat(form.heightCm),
        targetWeight: form.targetWeight ? parseFloat(form.targetWeight) : undefined,
        goal: form.goal,
        biotipo: form.biotipo || undefined,
        activityLevel: form.activityLevel,
        trainingDaysPerWeek: form.trainingDaysPerWeek
          ? parseFloat(form.trainingDaysPerWeek)
          : undefined,
        sessionDurationMin: form.sessionDurationMin
          ? parseFloat(form.sessionDurationMin)
          : undefined,
        exerciseTypes: form.exerciseTypes,
        hasKneeIssues: form.hasKneeIssues ?? undefined,
        dietaryRestrictions: form.dietaryRestrictions,
        markOnboarded: true,
      });

      await upsertMealPlan({
        deviceId,
        goals: computed,
        slots: DEFAULT_SLOTS_FOR_NEW_USER,
      });

      router.push("/");
    } catch (e) {
      console.error("Falha ao salvar onboarding", e);
      setSubmitting(false);
    }
  };

  return (
    <>
      <ScreenHeader title="Plano personalizado" subtitle={`Passo ${step + 1} de ${STEP_TITLES.length}`} />

      {/* Progress bar */}
      <div className="border-line bg-bg-card mb-4 flex items-center gap-1 overflow-hidden rounded-[var(--radius)] border p-1">
        {STEP_TITLES.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i <= step ? "bg-brand" : "bg-line",
            )}
          />
        ))}
      </div>

      <Panel className="mb-4">
        <div className="mb-3">
          <div className="text-text-mute font-sans text-[10px] tracking-[0.18em] uppercase">
            {STEP_TITLES[step]}
          </div>
        </div>

        {step === 0 && <Step0 form={form} update={update} />}
        {step === 1 && (
          <Step1 form={form} update={update} latestWeight={latestBody?.weight} />
        )}
        {step === 2 && <Step2 form={form} update={update} />}
        {step === 3 && <Step3 form={form} update={update} />}
        {step === 4 && (
          <Step4
            form={form}
            update={update}
            toggle={(id) => toggleListItem("exerciseTypes", id)}
          />
        )}
        {step === 5 && (
          <Step5
            form={form}
            toggle={(id) => toggleListItem("dietaryRestrictions", id)}
          />
        )}
        {step === 6 && <StepSummary form={form} computed={computed} />}
      </Panel>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={step === 0}
          className={cn(step === 0 && "opacity-0 pointer-events-none")}
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <div className="flex-1" />
        {step < STEP_TITLES.length - 1 ? (
          <Button type="button" onClick={handleNext} disabled={!canAdvance}>
            Avançar <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canAdvance || submitting}
          >
            <Check className="h-4 w-4" /> {submitting ? "Salvando…" : "Aplicar plano"}
          </Button>
        )}
      </div>
    </>
  );
}

/* =================================================================
   Default meal slots — usados quando aplicar o plano novo
   ----------------------------------------------------------------
   Mesma estrutura do seed mas exposta aqui pra ser substituível
   no futuro (ex.: variar conforme objetivo).
   ================================================================= */
const DEFAULT_SLOTS_FOR_NEW_USER = [
  { id: "cafe", label: "Café da manhã", time: "06:30", hint: "primeira refeição" },
  { id: "lanche_manha", label: "Lanche da manhã", time: "10:00", hint: "snack proteico" },
  { id: "almoco", label: "Almoço", time: "12:30", hint: "refeição principal" },
  { id: "pre_treino", label: "Pré-treino", time: "16:30", hint: "energia rápida" },
  { id: "jantar", label: "Jantar", time: "21:00", hint: "refeição da noite" },
  { id: "pre_sono", label: "Pré-sono", time: "22:00", hint: "leve, calmante" },
];

/* =================================================================
   Steps
   ================================================================= */

type StepProps = {
  form: Form;
  update: <K extends keyof Form>(k: K, v: Form[K]) => void;
};

function Step0({ form, update }: StepProps) {
  return (
    <div className="space-y-3">
      <Field label="Como você gostaria de ser chamado?">
        <input
          autoFocus
          type="text"
          value={form.displayName}
          onChange={(e) => update("displayName", e.target.value)}
          placeholder="ex. Gabriel, Alice…"
          className={inputCls}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Idade">
          <input
            inputMode="numeric"
            value={form.age}
            onChange={(e) => update("age", e.target.value)}
            placeholder="ex. 32"
            className={inputCls}
          />
        </Field>
        <Field label="Sexo biológico">
          <SegmentedRadio
            value={form.sex}
            onChange={(v) => update("sex", v as Sex)}
            options={[
              { value: "M", label: "Masculino" },
              { value: "F", label: "Feminino" },
            ]}
          />
        </Field>
      </div>
    </div>
  );
}

function Step1({
  form,
  update,
  latestWeight,
}: StepProps & { latestWeight?: number }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Altura (cm)">
          <input
            inputMode="decimal"
            value={form.heightCm}
            onChange={(e) => update("heightCm", e.target.value)}
            placeholder="ex. 178"
            className={inputCls}
          />
        </Field>
        <Field
          label="Peso atual (kg)"
          hint={
            latestWeight != null
              ? `Última medição: ${latestWeight.toFixed(1)} kg`
              : "Vai pra timeline em /corpo"
          }
        >
          <input
            inputMode="decimal"
            value={form.weightKg}
            onChange={(e) => update("weightKg", e.target.value)}
            placeholder="ex. 78.4"
            className={inputCls}
          />
        </Field>
      </div>
      <Field
        label="Peso alvo (kg)"
        hint="Opcional — só pra trackear no /corpo"
      >
        <input
          inputMode="decimal"
          value={form.targetWeight}
          onChange={(e) => update("targetWeight", e.target.value)}
          placeholder="ex. 75 ou deixe em branco"
          className={inputCls}
        />
      </Field>
    </div>
  );
}

function Step2({ form, update }: StepProps) {
  const goals: Goal[] = ["cut", "recomp", "maintain", "bulk"];
  const biotipos = [
    { id: "ectomorfo", label: "Ectomorfo", hint: "Magro, dificuldade pra ganhar peso" },
    { id: "mesomorfo", label: "Mesomorfo", hint: "Musculoso naturalmente, equilibrado" },
    { id: "endomorfo", label: "Endomorfo", hint: "Tendência a acumular gordura" },
  ] as const;
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel label="Objetivo principal" />
        <div className="mt-2 grid gap-2">
          {goals.map((g) => (
            <CardChoice
              key={g}
              active={form.goal === g}
              onClick={() => update("goal", g)}
              title={GOAL_LABELS[g]}
              subtitle={GOAL_HINTS[g]}
            />
          ))}
        </div>
      </div>
      <div>
        <FieldLabel label="Biotipo (auto-percebido)" />
        <div className="mt-2 grid gap-2">
          {biotipos.map((b) => (
            <CardChoice
              key={b.id}
              active={form.biotipo === b.id}
              onClick={() => update("biotipo", b.id)}
              title={b.label}
              subtitle={b.hint}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Step3({ form, update }: StepProps) {
  const levels: ActivityLevel[] = [
    "sedentary",
    "light",
    "moderate",
    "active",
    "very_active",
  ];
  return (
    <div className="space-y-2">
      <FieldLabel label="Nível geral de atividade (fora do treino)" />
      <div className="grid gap-2">
        {levels.map((l) => (
          <CardChoice
            key={l}
            active={form.activityLevel === l}
            onClick={() => update("activityLevel", l)}
            title={ACTIVITY_LABELS[l].split(" (")[0]}
            subtitle={ACTIVITY_LABELS[l].split("(")[1]?.replace(")", "")}
          />
        ))}
      </div>
    </div>
  );
}

function Step4({
  form,
  update,
  toggle,
}: StepProps & { toggle: (id: string) => void }) {
  const types = [
    { id: "peso_livre", label: "Peso livre", hint: "barra, halteres" },
    { id: "maquinario", label: "Maquinário", hint: "isolam grupos musculares" },
    { id: "funcional", label: "Funcional", hint: "movimento natural" },
    { id: "cardio", label: "Cardio", hint: "corrida, bike, esteira" },
    { id: "hiit", label: "HIIT", hint: "intervalado de alta intensidade" },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Dias por semana">
          <input
            inputMode="numeric"
            value={form.trainingDaysPerWeek}
            onChange={(e) => update("trainingDaysPerWeek", e.target.value)}
            placeholder="ex. 4"
            className={inputCls}
          />
        </Field>
        <Field label="Duração por sessão (min)">
          <input
            inputMode="numeric"
            value={form.sessionDurationMin}
            onChange={(e) => update("sessionDurationMin", e.target.value)}
            placeholder="ex. 40"
            className={inputCls}
          />
        </Field>
      </div>
      <div>
        <FieldLabel
          label="Tipos preferidos"
          hint="Pode marcar mais de um"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {types.map((t) => (
            <ChipChoice
              key={t.id}
              active={form.exerciseTypes.includes(t.id)}
              onClick={() => toggle(t.id)}
              label={t.label}
              hint={t.hint}
            />
          ))}
        </div>
      </div>
      <div>
        <FieldLabel label="Tem alguma limitação no joelho?" />
        <SegmentedRadio
          className="mt-2"
          value={
            form.hasKneeIssues === null
              ? ""
              : form.hasKneeIssues
                ? "yes"
                : "no"
          }
          onChange={(v) => update("hasKneeIssues", v === "yes")}
          options={[
            { value: "no", label: "Não" },
            { value: "yes", label: "Sim — evitar impacto" },
          ]}
        />
      </div>
    </div>
  );
}

function Step5({
  form,
  toggle,
}: {
  form: Form;
  toggle: (id: string) => void;
}) {
  const restrictions = [
    { id: "sem_lactose", label: "Sem lactose" },
    { id: "vegetariano", label: "Vegetariano" },
    { id: "vegano", label: "Vegano" },
    { id: "sem_gluten", label: "Sem glúten" },
    { id: "sem_acucar", label: "Sem açúcar refinado" },
    { id: "low_carb", label: "Low-carb" },
  ];
  return (
    <div className="space-y-3">
      <FieldLabel
        label="Restrições alimentares"
        hint="Opcional. Influencia sugestões futuras de receitas."
      />
      <div className="flex flex-wrap gap-2">
        {restrictions.map((r) => (
          <ChipChoice
            key={r.id}
            active={form.dietaryRestrictions.includes(r.id)}
            onClick={() => toggle(r.id)}
            label={r.label}
          />
        ))}
      </div>
      <div className="text-text-mute mt-3 text-xs">
        Você pode editar tudo isso depois em <span className="text-text">Configurações</span>.
      </div>
    </div>
  );
}

function StepSummary({
  form,
  computed,
}: {
  form: Form;
  computed: ReturnType<typeof computeDietGoals> | null;
}) {
  if (!computed) {
    return (
      <div className="text-text-dim text-sm">
        Volte e preencha idade, sexo, altura, peso, atividade e objetivo pra gerar o plano.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div>
        <div className="text-text-mute font-sans text-[10px] tracking-[0.18em] uppercase">
          Plano calórico
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <StatLine label="Calorias" value={`${computed.kcal} kcal`} accent />
          <StatLine label="Proteína" value={`${computed.protein} g`} />
          <StatLine label="Carboidrato" value={`${computed.carbs} g`} />
          <StatLine label="Gordura" value={`${computed.fat} g`} />
        </div>
        <div className="text-text-dim mt-2 text-[11px]">
          Calculado via Mifflin-St Jeor × atividade × ajuste por objetivo. Proteína em g/kg, gordura 28% das kcal, carboidrato como resto.
        </div>
      </div>

      <div>
        <div className="text-text-mute font-sans text-[10px] tracking-[0.18em] uppercase">
          Suas respostas
        </div>
        <ul className="divide-line-faint mt-1.5 divide-y text-sm">
          <SummaryRow label="Nome" value={form.displayName} />
          <SummaryRow
            label="Perfil"
            value={`${form.age} anos · ${form.sex === "M" ? "M" : "F"} · ${form.heightCm}cm · ${form.weightKg}kg`}
          />
          <SummaryRow label="Objetivo" value={form.goal ? GOAL_LABELS[form.goal] : "—"} />
          <SummaryRow label="Biotipo" value={form.biotipo || "—"} />
          <SummaryRow
            label="Atividade"
            value={
              form.activityLevel
                ? ACTIVITY_LABELS[form.activityLevel].split(" (")[0]
                : "—"
            }
          />
          <SummaryRow
            label="Treino"
            value={`${form.trainingDaysPerWeek}× sem · ${form.sessionDurationMin} min`}
          />
          <SummaryRow
            label="Joelho"
            value={
              form.hasKneeIssues === null
                ? "—"
                : form.hasKneeIssues
                  ? "Evitar impacto"
                  : "Sem limitação"
            }
          />
          <SummaryRow
            label="Restrições"
            value={
              form.dietaryRestrictions.length === 0
                ? "Nenhuma"
                : form.dietaryRestrictions.join(", ")
            }
          />
        </ul>
      </div>
    </div>
  );
}

/* =================================================================
   Primitives
   ================================================================= */

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <FieldLabel label={label} hint={hint} />
      {children}
    </label>
  );
}

function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <span className="block">
      <span className="text-text-mute font-sans text-[10px] tracking-[0.16em] uppercase">
        {label}
      </span>
      {hint && (
        <span className="text-text-dim mt-0.5 block font-sans text-[11px] normal-case tracking-normal">
          {hint}
        </span>
      )}
    </span>
  );
}

const inputCls =
  "border-line bg-bg text-text focus:border-brand h-11 w-full rounded-[var(--radius)] border px-3 font-sans text-sm tabular outline-none transition-colors";

function SegmentedRadio({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-line bg-bg-card flex gap-1 rounded-[var(--radius)] border p-1",
        className,
      )}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "flex-1 rounded-[var(--radius-sm)] py-2 font-sans text-xs font-medium tracking-wider uppercase transition-colors",
            value === o.value
              ? "bg-brand/15 text-brand"
              : "text-text-mute hover:text-text",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function CardChoice({
  active,
  onClick,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start justify-between gap-3 rounded-[var(--radius)] border p-3 text-left transition-colors",
        active
          ? "border-brand bg-brand/5"
          : "border-line bg-bg-card hover:border-line-strong",
      )}
    >
      <div className="min-w-0">
        <div className="font-serif text-sm font-medium leading-tight">{title}</div>
        {subtitle && (
          <div className="text-text-dim mt-1 text-[11px] leading-snug">{subtitle}</div>
        )}
      </div>
      {active && <Check className="text-brand h-4 w-4 flex-shrink-0" />}
    </button>
  );
}

function ChipChoice({
  active,
  onClick,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 font-sans text-xs transition-colors",
        active
          ? "border-brand bg-brand/10 text-brand"
          : "border-line text-text-dim hover:border-line-strong hover:text-text",
      )}
    >
      {label}
      {hint && active && (
        <span className="text-text-mute ml-1.5 text-[10px]">· {hint}</span>
      )}
    </button>
  );
}

function StatLine({
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-baseline justify-between gap-2 py-2">
      <span className="text-text-mute font-sans text-[10px] tracking-[0.16em] uppercase">
        {label}
      </span>
      <span className="text-text font-serif text-sm">{value}</span>
    </li>
  );
}
