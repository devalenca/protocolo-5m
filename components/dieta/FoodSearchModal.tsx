"use client";

import { useMutation, useQuery } from "convex/react";
import { Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useDeviceId } from "@/lib/deviceId";
import { macrosForPortion, type MealSlot } from "@/lib/diet";
import { cn } from "@/lib/utils";

type FoodSearchModalProps = {
  open: boolean;
  onClose: () => void;
  date: string;
  slot: MealSlot;
};

type FoodRow = {
  _id: string;
  name: string;
  brand?: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  defaultPortionGrams?: number;
  defaultPortionLabel?: string;
  profileId?: string;
};

/* =================================================================
   FoodSearchModal — busca + seleção + porção + add OR custom food
   ================================================================= */

export function FoodSearchModal({ open, onClose, date, slot }: FoodSearchModalProps) {
  const deviceId = useDeviceId();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<FoodRow | null>(null);
  const [portion, setPortion] = useState<string>("");
  const [showCustom, setShowCustom] = useState(false);

  const results = useQuery(
    api.foods.search,
    deviceId ? { deviceId, query, limit: 30 } : "skip",
  );

  const addEntry = useMutation(api.meals.addEntry);
  const addCustom = useMutation(api.foods.addCustom);
  const deleteCustom = useMutation(api.foods.deleteCustom);

  const handlePick = (f: FoodRow) => {
    setSelected(f);
    setPortion(
      f.defaultPortionGrams != null ? String(f.defaultPortionGrams) : "100",
    );
  };

  const handleConfirm = async () => {
    if (!selected || !deviceId) return;
    const grams = parseFloat(portion.replace(",", "."));
    if (!Number.isFinite(grams) || grams <= 0) {
      alert("Informe a porção em gramas.");
      return;
    }
    const macros = macrosForPortion(selected, grams);
    await addEntry({
      deviceId,
      date,
      mealType: slot.id,
      foodId: selected._id as never,
      foodName: selected.name + (selected.brand ? ` · ${selected.brand}` : ""),
      portionGrams: grams,
      ...macros,
    });
    reset();
    onClose();
  };

  const reset = () => {
    setQuery("");
    setSelected(null);
    setPortion("");
    setShowCustom(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title={`Adicionar em ${slot.label}`}>
      {!selected && !showCustom && (
        <>
          <div className="border-line bg-bg-elev mb-3 flex items-center gap-2 rounded-[var(--radius)] border px-3">
            <Search className="text-text-mute h-4 w-4" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar (ex: frango, arroz, ovo…)"
              className="text-text placeholder:text-text-mute h-11 flex-1 bg-transparent font-sans text-sm outline-none"
            />
          </div>

          <ul className="-mx-1 mb-3 max-h-[50dvh] divide-y divide-[var(--line-faint)] overflow-y-auto">
            {(results ?? []).map((f) => (
              <li key={f._id} className="flex items-center gap-2 px-1">
                <button
                  type="button"
                  onClick={() => handlePick(f as FoodRow)}
                  className="hover:bg-bg-elev flex-1 rounded-[var(--radius)] px-2 py-2.5 text-left transition-colors"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-text font-serif text-sm font-medium">
                      {f.name}
                    </span>
                    <span className="text-text-dim font-sans text-xs tabular">
                      {f.kcal} kcal
                    </span>
                  </div>
                  <div className="text-text-mute mt-0.5 font-sans text-[10px] tracking-[0.04em]">
                    {f.protein}g P · {f.carbs}g C · {f.fat}g G
                    {f.defaultPortionLabel && (
                      <span className="text-text-dim"> · {f.defaultPortionLabel}</span>
                    )}
                    {f.profileId != null && (
                      <span className="text-brand ml-1">· seu</span>
                    )}
                  </div>
                </button>
                {f.profileId != null && deviceId && (
                  <button
                    type="button"
                    aria-label="Apagar alimento custom"
                    onClick={() => {
                      if (confirm(`Apagar "${f.name}"?`)) {
                        void deleteCustom({ deviceId, foodId: f._id as never });
                      }
                    }}
                    className="text-text-mute hover:text-danger flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            ))}
            {results && results.length === 0 && (
              <li className="text-text-mute py-6 text-center text-sm">
                Nenhum alimento encontrado
              </li>
            )}
          </ul>

          <Button variant="outline" block onClick={() => setShowCustom(true)}>
            <Plus className="h-4 w-4" /> Novo alimento
          </Button>
        </>
      )}

      {selected && (
        <PortionStep
          food={selected}
          portion={portion}
          onPortionChange={setPortion}
          onBack={() => setSelected(null)}
          onConfirm={handleConfirm}
        />
      )}

      {showCustom && (
        <CustomFoodStep
          onCancel={() => setShowCustom(false)}
          onCreated={async (payload) => {
            if (!deviceId) return;
            const newId = await addCustom({ deviceId, ...payload });
            setShowCustom(false);
            // pré-seleciona o food recém-criado pra adicionar agora
            handlePick({
              _id: newId as string,
              ...payload,
              defaultPortionGrams: payload.defaultPortionGrams,
            } as FoodRow);
          }}
        />
      )}
    </Modal>
  );
}

function PortionStep({
  food,
  portion,
  onPortionChange,
  onBack,
  onConfirm,
}: {
  food: FoodRow;
  portion: string;
  onPortionChange: (s: string) => void;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const grams = parseFloat(portion.replace(",", ".")) || 0;
  const preview = macrosForPortion(food, grams);

  return (
    <div>
      <div className="border-line bg-bg-elev mb-4 rounded-[var(--radius)] border p-3">
        <div className="font-serif text-base font-medium">{food.name}</div>
        {food.brand && (
          <div className="text-text-dim text-xs">{food.brand}</div>
        )}
        <div className="text-text-mute mt-2 font-sans text-[10px] tracking-[0.04em]">
          Por 100g: {food.kcal} kcal · {food.protein}g P · {food.carbs}g C ·{" "}
          {food.fat}g G
        </div>
      </div>

      <label className="mb-4 flex flex-col gap-1.5">
        <span className="text-text-mute font-sans text-[10px] tracking-[0.16em] uppercase">
          Porção (g)
        </span>
        <input
          autoFocus
          inputMode="decimal"
          value={portion}
          onChange={(e) => onPortionChange(e.target.value)}
          className="border-line bg-bg focus:border-brand h-12 w-full rounded-[var(--radius)] border px-3 font-serif text-xl tabular outline-none"
        />
        {food.defaultPortionLabel && (
          <span className="text-text-mute text-xs">
            sugestão: {food.defaultPortionLabel}
          </span>
        )}
      </label>

      <div className="border-line mb-4 grid grid-cols-4 gap-2 rounded-[var(--radius)] border p-3">
        <PreviewCell label="kcal" value={preview.kcal} />
        <PreviewCell label="P" value={preview.protein} />
        <PreviewCell label="C" value={preview.carbs} />
        <PreviewCell label="G" value={preview.fat} />
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} block>
          Voltar
        </Button>
        <Button onClick={onConfirm} block>
          Adicionar
        </Button>
      </div>
    </div>
  );
}

function PreviewCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-text-mute font-sans text-[9px] tracking-[0.18em] uppercase">
        {label}
      </div>
      <div className="font-serif text-base font-medium tabular">{value}</div>
    </div>
  );
}

type CustomPayload = {
  name: string;
  brand?: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  defaultPortionGrams?: number;
};

function CustomFoodStep({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: (payload: CustomPayload) => void | Promise<void>;
}) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [kcal, setKcal] = useState("");
  const [p, setP] = useState("");
  const [c, setC] = useState("");
  const [g, setG] = useState("");
  const [portion, setPortion] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CustomPayload = {
      name: name.trim(),
      brand: brand.trim() || undefined,
      kcal: parseFloat(kcal.replace(",", ".")) || 0,
      protein: parseFloat(p.replace(",", ".")) || 0,
      carbs: parseFloat(c.replace(",", ".")) || 0,
      fat: parseFloat(g.replace(",", ".")) || 0,
      defaultPortionGrams: parseFloat(portion.replace(",", ".")) || undefined,
    };
    if (!payload.name) {
      alert("Informe o nome do alimento.");
      return;
    }
    void onCreated(payload);
  };

  return (
    <form onSubmit={submit}>
      <div className="mb-3 grid grid-cols-2 gap-3">
        <Field label="Nome" full>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
            placeholder="ex. Frango xadrez (marmita)"
          />
        </Field>
        <Field label="Marca" full>
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className={inputCls}
            placeholder="opcional"
          />
        </Field>
        <p className="text-text-mute col-span-2 mt-1 font-sans text-[10px] tracking-[0.16em] uppercase">
          Por 100g do alimento
        </p>
        <Field label="kcal">
          <input
            inputMode="decimal"
            value={kcal}
            onChange={(e) => setKcal(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Proteína (g)">
          <input
            inputMode="decimal"
            value={p}
            onChange={(e) => setP(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Carbs (g)">
          <input
            inputMode="decimal"
            value={c}
            onChange={(e) => setC(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Gordura (g)">
          <input
            inputMode="decimal"
            value={g}
            onChange={(e) => setG(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Porção típica (g)" full>
          <input
            inputMode="decimal"
            value={portion}
            onChange={(e) => setPortion(e.target.value)}
            className={inputCls}
            placeholder="ex. 150 — pré-preenche ao adicionar"
          />
        </Field>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel} block>
          Cancelar
        </Button>
        <Button type="submit" block>
          Salvar
        </Button>
      </div>
    </form>
  );
}

const inputCls =
  "border-line bg-bg text-text focus:border-brand h-11 w-full rounded-[var(--radius)] border px-3 font-sans text-sm tabular outline-none transition-colors";

function Field({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", full && "col-span-2")}>
      <span className="text-text-mute font-sans text-[10px] tracking-[0.16em] uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}
