"use client";

import { useMutation, useQuery } from "convex/react";
import { Crown, Pencil, Plus, RotateCcw, Save, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useToast } from "@/components/ui/Toast";
import { useDeviceId } from "@/lib/deviceId";
import { cn } from "@/lib/utils";

/* =================================================================
   /perfil — editor de plano
   ----------------------------------------------------------------
   Sections (cada uma é Panel independente):
   1. Identidade — read-only + link "Refazer onboarding"
   2. Metas calóricas — inline edit kcal/P/C/G
   3. Hábitos — toggle ativo + adicionar novo
   4. Suplementos — toggle ativo
   5. Templates de treino — lista + remover
   ================================================================= */

const GOAL_LABEL: Record<string, string> = {
  cut: "Cutting",
  recomp: "Recomposição",
  maintain: "Manutenção",
  bulk: "Bulking",
};

const BIOTIPO_LABEL: Record<string, string> = {
  ectomorfo: "Ectomorfo",
  mesomorfo: "Mesomorfo",
  endomorfo: "Endomorfo",
};

export default function PerfilPage() {
  const deviceId = useDeviceId();
  const settings = useQuery(
    api.profileSettings.get,
    deviceId ? { deviceId } : "skip",
  );
  const adminFlag = useQuery(
    api.admin.isAdmin,
    deviceId ? { deviceId } : "skip",
  );

  return (
    <>
      <ScreenHeader title="Perfil & Plano" subtitle="Edite metas, hábitos, treino e suplementos" />

      <IdentitySection settings={settings} isAdmin={adminFlag === true} />
      <GoalsSection />
      <HabitsSection />
      <SupplementsSection />
      <TemplatesSection />

      <Panel className="mb-3">
        <div className="flex items-start gap-3">
          <RotateCcw className="text-text-mute mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden />
          <div className="flex-1">
            <div className="font-serif text-base font-semibold">
              Refazer onboarding
            </div>
            <p className="text-text-dim mt-1 text-xs">
              Regenera todo o plano (treino, suplementos, metas) com base em
              novas respostas. Histórico de treinos/refeições é preservado.
            </p>
          </div>
          <Link
            href="/onboarding"
            className="bg-brand text-primary-foreground hover:bg-brand-bright focus-visible:ring-brand inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] px-3 font-sans text-xs font-medium tracking-wide transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Refazer
          </Link>
        </div>
      </Panel>
    </>
  );
}

/* =================================================================
   Identidade
   ================================================================= */

// Type derivation helper — usado só como typeof, não chamado.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useProfileSettings() {
  const deviceId = useDeviceId();
  return useQuery(api.profileSettings.get, deviceId ? { deviceId } : "skip");
}
type Settings = NonNullable<ReturnType<typeof useProfileSettings>>;

function IdentitySection({
  settings,
  isAdmin,
}: {
  settings: Settings | null | undefined;
  isAdmin: boolean;
}) {
  if (!settings) {
    return (
      <Panel className="mb-3" title="Identidade">
        <div className="text-text-dim text-sm">
          Plano não configurado ainda.{" "}
          <Link href="/onboarding" className="text-brand underline">
            Preencher onboarding
          </Link>
          .
        </div>
      </Panel>
    );
  }
  return (
    <Panel className="mb-3" title="Identidade">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        <Field
          label="Nome"
          value={settings.displayName ?? "—"}
          accent={Boolean(settings.displayName)}
        />
        <Field
          label="Idade · sexo"
          value={
            settings.age != null && settings.sex
              ? `${settings.age} · ${settings.sex}`
              : "—"
          }
        />
        <Field
          label="Altura"
          value={settings.heightCm != null ? `${settings.heightCm} cm` : "—"}
        />
        <Field
          label="Objetivo"
          value={settings.goal ? GOAL_LABEL[settings.goal] : "—"}
          accent
        />
        <Field
          label="Biotipo"
          value={settings.biotipo ? BIOTIPO_LABEL[settings.biotipo] : "—"}
        />
        <Field
          label="Treino"
          value={
            settings.trainingDaysPerWeek
              ? `${settings.trainingDaysPerWeek}×/sem`
              : "—"
          }
        />
        {settings.onboardedAt && (
          <Field
            label="Onboarding em"
            value={new Date(settings.onboardedAt).toLocaleDateString("pt-BR")}
            full
          />
        )}
      </dl>

      {isAdmin && (
        <div className="border-line-faint mt-3 flex items-center justify-between gap-3 border-t pt-3">
          <div className="flex items-center gap-2">
            <Crown className="text-brand h-4 w-4" aria-hidden />
            <span className="font-serif text-sm font-medium">Administrador</span>
          </div>
          <Link
            href="/admin/users"
            className="text-brand hover:text-brand-bright font-sans text-xs tracking-[0.12em] uppercase transition-colors"
          >
            Abrir painel →
          </Link>
        </div>
      )}
    </Panel>
  );
}

/* =================================================================
   Metas calóricas — inline edit
   ================================================================= */

function GoalsSection() {
  const deviceId = useDeviceId();
  const plan = useQuery(api.mealPlan.get, deviceId ? { deviceId } : "skip");
  const upsert = useMutation(api.mealPlan.upsert);
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ kcal: "", protein: "", carbs: "", fat: "" });
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    if (!plan) return;
    setDraft({
      kcal: String(plan.goals.kcal),
      protein: String(plan.goals.protein),
      carbs: String(plan.goals.carbs),
      fat: String(plan.goals.fat),
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!deviceId || !plan) return;
    const next = {
      kcal: parseFloat(draft.kcal.replace(",", ".")) || plan.goals.kcal,
      protein: parseFloat(draft.protein.replace(",", ".")) || plan.goals.protein,
      carbs: parseFloat(draft.carbs.replace(",", ".")) || plan.goals.carbs,
      fat: parseFloat(draft.fat.replace(",", ".")) || plan.goals.fat,
    };
    setSaving(true);
    try {
      await upsert({ deviceId, goals: next, slots: plan.slots });
      toast.push("Metas atualizadas", "success");
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (!plan) {
    return (
      <Panel className="mb-3" title="Metas calóricas">
        <div className="text-text-dim text-sm">Sem plano configurado.</div>
      </Panel>
    );
  }

  return (
    <Panel
      className="mb-3"
      title="Metas calóricas"
      action={
        !editing && (
          <button
            type="button"
            onClick={startEdit}
            className="text-brand hover:text-brand-bright inline-flex items-center gap-1 font-sans text-[10px] tracking-[0.16em] uppercase transition-colors"
          >
            <Pencil className="h-3 w-3" aria-hidden /> Editar
          </button>
        )
      }
    >
      {!editing ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Field label="Calorias" value={`${plan.goals.kcal} kcal`} accent />
          <Field label="Proteína" value={`${plan.goals.protein} g`} />
          <Field label="Carboidrato" value={`${plan.goals.carbs} g`} />
          <Field label="Gordura" value={`${plan.goals.fat} g`} />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <NumberField
              label="Calorias (kcal)"
              value={draft.kcal}
              onChange={(v) => setDraft((d) => ({ ...d, kcal: v }))}
            />
            <NumberField
              label="Proteína (g)"
              value={draft.protein}
              onChange={(v) => setDraft((d) => ({ ...d, protein: v }))}
            />
            <NumberField
              label="Carbo (g)"
              value={draft.carbs}
              onChange={(v) => setDraft((d) => ({ ...d, carbs: v }))}
            />
            <NumberField
              label="Gordura (g)"
              value={draft.fat}
              onChange={(v) => setDraft((d) => ({ ...d, fat: v }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-3.5 w-3.5" aria-hidden />
              {saving ? "Salvando…" : "Salvar"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </Panel>
  );
}

/* =================================================================
   Hábitos — toggle active + add new
   ================================================================= */

function HabitsSection() {
  const deviceId = useDeviceId();
  const habits = useQuery(
    api.habitItems.list,
    deviceId ? { deviceId, includeInactive: true } : "skip",
  );
  const save = useMutation(api.habitItems.save);
  const setActive = useMutation(api.habitItems.setActive);
  const toast = useToast();
  const [newText, setNewText] = useState("");
  const [adding, setAdding] = useState(false);

  const addHabit = async () => {
    if (!deviceId || !newText.trim()) return;
    const itemId = `custom_${Date.now()}`;
    setAdding(true);
    try {
      const max = Math.max(0, ...(habits ?? []).map((h) => h.order));
      await save({
        deviceId,
        itemId,
        text: newText.trim(),
        order: max + 1,
        active: true,
      });
      toast.push("Hábito adicionado", "success");
      setNewText("");
    } finally {
      setAdding(false);
    }
  };

  if (!habits) {
    return (
      <Panel className="mb-3" title="Hábitos do checklist">
        <div className="text-text-dim text-sm">Carregando…</div>
      </Panel>
    );
  }

  return (
    <Panel
      className="mb-3"
      title="Hábitos do checklist"
      action={
        <span className="text-[10px] tracking-[0.16em] uppercase">
          {habits.filter((h) => h.active).length} ativos
        </span>
      }
    >
      <ul className="divide-line-faint mb-3 divide-y">
        {habits.map((h) => (
          <li
            key={h._id}
            className={cn(
              "flex items-center justify-between gap-3 py-2.5 transition-opacity",
              !h.active && "opacity-50",
            )}
          >
            <div className="min-w-0">
              <div className="font-serif text-sm">{h.text}</div>
              {h.sub && (
                <div className="text-text-mute mt-0.5 font-sans text-[10px]">
                  {h.sub}
                </div>
              )}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={h.active}
              aria-label={`${h.active ? "Desativar" : "Ativar"} hábito ${h.text}`}
              onClick={() => {
                if (!deviceId) return;
                void setActive({
                  deviceId,
                  itemId: h.itemId,
                  active: !h.active,
                });
              }}
              className={cn(
                "focus-visible:ring-brand relative h-6 w-11 flex-shrink-0 rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none",
                h.active ? "bg-brand" : "bg-bg-elev",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                  h.active && "translate-x-5",
                )}
              />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2">
        <label htmlFor="new-habit" className="sr-only">
          Novo hábito
        </label>
        <input
          id="new-habit"
          type="text"
          autoComplete="off"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newText.trim()) void addHabit();
          }}
          placeholder="Adicionar hábito custom…"
          className="border-line bg-bg text-text focus-visible:border-brand placeholder:text-text-faint h-10 flex-1 rounded-[var(--radius)] border px-3 font-sans text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/30"
        />
        <Button size="sm" onClick={addHabit} disabled={adding || !newText.trim()}>
          <Plus className="h-3.5 w-3.5" aria-hidden /> Adicionar
        </Button>
      </div>
    </Panel>
  );
}

/* =================================================================
   Suplementos — toggle active
   ================================================================= */

function SupplementsSection() {
  const deviceId = useDeviceId();
  const supps = useQuery(
    api.supplementPlan.list,
    deviceId ? { deviceId, includeInactive: true } : "skip",
  );
  const setActive = useMutation(api.supplementPlan.setActive);

  if (!supps) {
    return (
      <Panel className="mb-3" title="Suplementação">
        <div className="text-text-dim text-sm">Carregando…</div>
      </Panel>
    );
  }
  if (supps.length === 0) {
    return (
      <Panel className="mb-3" title="Suplementação">
        <div className="text-text-dim text-sm">
          Sem suplementos. Refaça o onboarding pra gerar a lista.
        </div>
      </Panel>
    );
  }

  return (
    <Panel
      className="mb-3"
      title="Suplementação"
      action={
        <span className="text-[10px] tracking-[0.16em] uppercase">
          {supps.filter((s) => s.active).length} ativos
        </span>
      }
    >
      <ul className="divide-line-faint divide-y">
        {supps.map((s) => (
          <li
            key={s._id}
            className={cn(
              "flex items-center justify-between gap-3 py-2.5 transition-opacity",
              !s.active && "opacity-50",
            )}
          >
            <div className="min-w-0 flex-1">
              <div className="font-serif text-sm font-medium">{s.name}</div>
              <div className="text-text-mute mt-0.5 font-sans text-[10px] tabular">
                {s.dose} · {s.timing}
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={s.active}
              aria-label={`${s.active ? "Pausar" : "Ativar"} ${s.name}`}
              onClick={() => {
                if (!deviceId) return;
                void setActive({ deviceId, suppId: s.suppId, active: !s.active });
              }}
              className={cn(
                "focus-visible:ring-brand relative h-6 w-11 flex-shrink-0 rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none",
                s.active ? "bg-brand" : "bg-bg-elev",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                  s.active && "translate-x-5",
                )}
              />
            </button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* =================================================================
   Templates de treino — view + remover
   ================================================================= */

function TemplatesSection() {
  const deviceId = useDeviceId();
  const templates = useQuery(
    api.workoutTemplates.list,
    deviceId ? { deviceId } : "skip",
  );
  const remove = useMutation(api.workoutTemplates.remove);
  const toast = useToast();

  if (!templates) {
    return (
      <Panel className="mb-3" title="Templates de treino">
        <div className="text-text-dim text-sm">Carregando…</div>
      </Panel>
    );
  }
  if (templates.length === 0) {
    return (
      <Panel className="mb-3" title="Templates de treino">
        <div className="text-text-dim text-sm">
          Sem templates. Refaça o onboarding pra gerar a divisão.
        </div>
      </Panel>
    );
  }

  return (
    <Panel
      className="mb-3"
      title="Templates de treino"
      action={
        <span className="text-[10px] tracking-[0.16em] uppercase">
          {templates.length} {templates.length === 1 ? "split" : "splits"}
        </span>
      }
    >
      <ul className="space-y-2">
        {templates.map((t) => (
          <li
            key={t._id}
            className="border-line-faint rounded-[var(--radius)] border p-3"
          >
            <header className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-text-mute font-sans text-[9px] tracking-[0.18em] uppercase">
                  {t.day}
                </div>
                <div className="mt-0.5 font-serif text-sm font-semibold">
                  {t.name}
                </div>
                <div className="text-text-dim mt-0.5 text-[11px]">{t.focus}</div>
              </div>
              <button
                type="button"
                aria-label={`Remover ${t.name}`}
                onClick={() => {
                  if (!deviceId) return;
                  if (
                    !confirm(
                      `Remover o template "${t.name}"? O histórico de treinos é preservado.`,
                    )
                  ) {
                    return;
                  }
                  void remove({ deviceId, templateId: t.templateId }).then(() => {
                    toast.push(`${t.name} removido`, "success");
                  });
                }}
                className="text-text-mute hover:text-danger flex h-8 w-8 items-center justify-center rounded-full transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              </button>
            </header>
            <ol className="text-text-dim mt-2 list-decimal pl-5 font-sans text-[11px] tabular">
              {t.exercises.map((e, i) => (
                <li key={i} className="py-0.5">
                  <span className="text-text">{e.name}</span>{" "}
                  <span className="text-text-mute">
                    · {e.sets}×{e.reps} · {e.rest}s
                  </span>
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ul>
      <div className="text-text-mute mt-3 flex items-start gap-2 font-sans text-[11px]">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" aria-hidden />
        <span>
          Quer adicionar ou editar exercícios? Por ora use{" "}
          <Link href="/onboarding" className="text-brand underline">
            Refazer onboarding
          </Link>{" "}
          — o editor inline vem na próxima slice.
        </span>
      </div>
    </Panel>
  );
}

/* =================================================================
   Primitives
   ================================================================= */

function Field({
  label,
  value,
  accent,
  full,
}: {
  label: string;
  value: string;
  accent?: boolean;
  full?: boolean;
}) {
  return (
    <div className={cn("min-w-0", full && "col-span-2 sm:col-span-3")}>
      <div className="text-text-mute font-sans text-[9px] tracking-[0.16em] uppercase">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 font-serif text-base tabular truncate",
          accent ? "text-brand font-semibold" : "text-text",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = `nf-${label.replace(/\W/g, "-").toLowerCase()}`;
  return (
    <label htmlFor={id} className="flex flex-col gap-1">
      <span className="text-text-mute font-sans text-[10px] tracking-[0.16em] uppercase">
        {label}
      </span>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-line bg-bg text-text focus-visible:border-brand h-10 w-full rounded-[var(--radius)] border px-2.5 font-serif text-sm tabular outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/30"
      />
    </label>
  );
}
