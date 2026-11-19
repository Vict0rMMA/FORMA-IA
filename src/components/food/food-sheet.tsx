"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/controls";
import { Sheet } from "@/components/ui/sheet";
import { n0, uid } from "@/lib/format";
import { MEAL_LABELS, MEAL_ORDER, itemsMacros } from "@/lib/nutrition";
import { useStore } from "@/lib/store";
import type { FoodEntry, FoodItem, MealType } from "@/lib/types";
import { ItemEditor } from "./item-editor";

/** Crear o editar una comida manualmente. */
export function FoodSheet({
  open,
  onClose,
  date,
  meal,
  entry,
}: {
  open: boolean;
  onClose: () => void;
  date: string;
  meal: MealType;
  entry?: FoodEntry | null;
}) {
  const { saveFood } = useStore();
  const [items, setItems] = useState<FoodItem[]>([]);
  const [title, setTitle] = useState("");
  const [mealType, setMealType] = useState<MealType>(meal);

  useEffect(() => {
    if (!open) return;
    setItems(entry?.items ?? []);
    setTitle(entry?.title ?? "");
    setMealType(entry?.meal ?? meal);
  }, [open, entry, meal]);

  const totals = itemsMacros(items);
  const autoTitle = items.slice(0, 3).map((i) => i.name).join(", ");

  const save = () => {
    const finalTitle = title.trim() || autoTitle || "Comida";
    saveFood({
      id: entry?.id ?? uid(),
      date: entry?.date ?? date,
      meal: mealType,
      title: finalTitle,
      items,
      image: entry?.image ?? null,
      source: entry?.source ?? "manual",
      createdAt: entry?.createdAt ?? new Date().toISOString(),
    });
    toast.success(entry ? "Comida actualizada" : "Guardado en tu diario", { description: `${finalTitle} · ${n0(totals.kcal)} kcal` });
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={entry ? "Editar comida" : "Añadir comida"}
      footer={
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="num text-[22px] font-semibold leading-none">
              {n0(totals.kcal)} <span className="text-sm font-normal text-faint">kcal</span>
            </p>
            <p className="num mt-1 text-[12px] text-muted">
              {n0(totals.protein)} g P · {n0(totals.carbs)} g C · {n0(totals.fat)} g G
            </p>
          </div>
          <Button variant="primary" size="lg" onClick={save} disabled={!items.length}>
            Guardar
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <Segmented value={mealType} onChange={setMealType} options={MEAL_ORDER.map((m) => ({ value: m, label: MEAL_LABELS[m] }))} className="flex w-full" size="sm" />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={autoTitle || "Nombre de la comida (opcional)"}
          className="h-11 w-full rounded-xl border border-line bg-surface-2 px-3.5 outline-none placeholder:text-faint focus:border-lime/40"
        />
        <ItemEditor items={items} onChange={setItems} />
      </div>
    </Sheet>
  );
}
