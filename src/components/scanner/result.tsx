/* eslint-disable @next/next/no-img-element */
"use client";

import { motion } from "framer-motion";
import { Info, Pencil, Sparkles } from "lucide-react";
import { ItemEditor } from "@/components/food/item-editor";
import { Button } from "@/components/ui/button";
import { Pill, Segmented } from "@/components/ui/controls";
import { MacroDonut } from "@/components/ui/macro-donut";
import { AnimatedNumber } from "@/components/ui/progress";
import { cn, n0 } from "@/lib/format";
import { MEAL_LABELS, MEAL_ORDER, itemsMacros } from "@/lib/nutrition";
import type { AnalyzeResponse, FoodItem, MealType } from "@/lib/types";

export interface ResultState {
  title: string;
  items: FoodItem[];
  meal: MealType;
  date: string;
}

export function Result({
  image,
  meta,
  state,
  onChange,
  editing,
  onToggleEdit,
  onSave,
  onRetry,
  saving,
}: {
  image: string | null;
  meta: Pick<AnalyzeResponse, "confidence" | "notes" | "provider">;
  state: ResultState;
  onChange: (s: ResultState) => void;
  editing: boolean;
  onToggleEdit: () => void;
  onSave: () => void;
  onRetry: () => void;
  saving: boolean;
}) {
  const totals = itemsMacros(state.items);

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="lg:sticky lg:top-10 lg:self-start">
        {image ? (
          <img src={image} alt={state.title} className="aspect-[4/3] w-full rounded-[28px] border border-line object-cover" />
        ) : (
          <div className="grid aspect-[4/3] place-items-center rounded-[28px] border border-line bg-surface text-muted">
            <Sparkles size={28} className="text-lime" />
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {meta.provider === "demo" ? (
            <Pill>Resultado de demostración</Pill>
          ) : (
            <Pill tone="lime">
              <Sparkles size={11} /> Estimación IA · confianza {meta.confidence}
            </Pill>
          )}
        </div>
      </motion.div>

      <div>
        <input
          value={state.title}
          onChange={(e) => onChange({ ...state, title: e.target.value })}
          className="w-full bg-transparent text-[26px] font-semibold tracking-[-0.03em] outline-none md:text-[30px]"
          aria-label="Nombre de la comida"
        />

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6 flex items-center gap-6">
          <MacroDonut m={totals} size={84} stroke={10} />
          <div>
            <p className="leading-none">
              <AnimatedNumber value={totals.kcal} className="text-[48px] font-semibold" />
              <span className="ml-1.5 text-lg text-faint">kcal</span>
            </p>
            <div className="num mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
              <Macro color="var(--color-lime)" value={totals.protein} label="proteína" />
              <Macro color="var(--color-carbs)" value={totals.carbs} label="carbohidratos" />
              <Macro color="var(--color-fat)" value={totals.fat} label="grasas" />
            </div>
          </div>
        </motion.div>

        <div className="mt-8 flex items-center justify-between">
          <h2 className="label-xs">Alimentos detectados · {state.items.length}</h2>
          <button onClick={onToggleEdit} className={cn("flex items-center gap-1.5 text-[13px]", editing ? "text-lime" : "text-muted hover:text-fg")}>
            <Pencil size={13} /> {editing ? "Listo" : "Editar"}
          </button>
        </div>
        <div className="mt-1">
          <ItemEditor items={state.items} onChange={(items) => onChange({ ...state, items })} editable={editing} />
          {!state.items.length && <p className="py-6 text-sm text-muted">No se detectaron alimentos. Añádelos manualmente o vuelve a intentarlo.</p>}
        </div>

        <div className="mt-6 flex gap-3 rounded-2xl bg-surface p-4 text-[13px] text-muted">
          <Info size={15} className="mt-0.5 shrink-0" />
          <p>
            {meta.notes ? `${meta.notes} ` : ""}Los valores son estimaciones a partir de la imagen; ajusta las porciones si conoces el peso real.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <Segmented value={state.meal} onChange={(meal) => onChange({ ...state, meal })} options={MEAL_ORDER.map((m) => ({ value: m, label: MEAL_LABELS[m] }))} className="flex w-full" size="sm" />
          <div className="flex gap-2 pt-2">
            <Button variant="primary" size="lg" className="flex-1" onClick={onSave} disabled={!state.items.length || saving}>
              Guardar en mi diario
            </Button>
            <Button size="lg" onClick={onToggleEdit}>
              {editing ? "Terminar edición" : "Editar alimentos"}
            </Button>
          </div>
          <button onClick={onRetry} className="w-full py-2 text-center text-[13px] text-muted hover:text-fg">
            Analizar otra comida
          </button>
        </div>
      </div>
    </div>
  );
}

function Macro({ color, value, label }: { color: string; value: number; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      <span className="font-semibold">{n0(value)} g</span>
      <span className="text-muted">{label}</span>
    </span>
  );
}
