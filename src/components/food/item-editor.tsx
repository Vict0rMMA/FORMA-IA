"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Stepper } from "@/components/ui/controls";
import { FOOD_DB, searchFoods } from "@/lib/food-db";
import { cn, n0, uid } from "@/lib/format";
import { itemMacros } from "@/lib/nutrition";
import type { FoodItem } from "@/lib/types";

/** Lista de alimentos de una comida: editar gramos, eliminar y añadir desde la base local o como personalizado. */
export function ItemEditor({
  items,
  onChange,
  editable = true,
  showAdd = true,
}: {
  items: FoodItem[];
  onChange: (items: FoodItem[]) => void;
  editable?: boolean;
  showAdd?: boolean;
}) {
  const update = (id: string, patch: Partial<FoodItem>) => onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const remove = (id: string) => onChange(items.filter((i) => i.id !== id));

  return (
    <div>
      <ul className="divide-y divide-line">
        <AnimatePresence initial={false}>
          {items.map((item) => {
            const m = itemMacros(item);
            return (
              <motion.li
                key={item.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-3 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold uppercase tracking-[0.06em]">{item.name}</p>
                    <p className="num mt-1 text-[12px] text-muted">
                      {n0(m.kcal)} kcal · {n0(m.protein)}P · {n0(m.carbs)}C · {n0(m.fat)}G
                    </p>
                  </div>
                  {editable ? (
                    <>
                      <Stepper compact value={item.grams} step={10} min={1} max={3000} suffix="g" onChange={(g) => update(item.id, { grams: g })} className="w-[124px]" />
                      <button onClick={() => remove(item.id)} className="grid h-8 w-8 place-items-center rounded-full text-faint hover:bg-danger/10 hover:text-danger" aria-label={`Eliminar ${item.name}`}>
                        <Trash2 size={15} />
                      </button>
                    </>
                  ) : (
                    <p className="num text-[15px] font-medium">
                      {n0(item.grams)} <span className="text-faint">g</span>
                    </p>
                  )}
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
      {editable && showAdd && <AddItem onAdd={(i) => onChange([...items, i])} />}
    </div>
  );
}

function AddItem({ onAdd }: { onAdd: (i: FoodItem) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [custom, setCustom] = useState(false);
  const results = useMemo(() => (q ? searchFoods(q, 6) : FOOD_DB.slice(0, 6)), [q]);

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="mt-2 flex h-11 w-full items-center gap-2 rounded-xl px-1 text-[13px] text-muted hover:text-fg">
        <Plus size={15} /> Añadir alimento
      </button>
    );

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-3 rounded-2xl border border-line bg-surface-2 p-3">
      {custom ? (
        <CustomForm
          initialName={q}
          onCancel={() => setCustom(false)}
          onAdd={(i) => {
            onAdd(i);
            setOpen(false);
            setCustom(false);
            setQ("");
          }}
        />
      ) : (
        <>
          <div className="flex h-10 items-center gap-2 rounded-xl bg-surface px-3">
            <Search size={15} className="text-faint" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar alimento…" className="w-full bg-transparent outline-none placeholder:text-faint" />
          </div>
          <ul className="mt-2 max-h-56 overflow-y-auto">
            {results.map((f) => (
              <li key={f.name}>
                <button
                  onClick={() => {
                    onAdd({ id: uid(), name: f.name, grams: f.portion, per100: f.per100 });
                    setOpen(false);
                    setQ("");
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-2.5 text-left text-sm hover:bg-white/[0.04]"
                >
                  <span>{f.name}</span>
                  <span className="num text-[12px] text-faint">{n0(f.per100.kcal)} kcal/100 g</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex justify-between border-t border-line pt-2">
            <button onClick={() => setCustom(true)} className="px-2 py-1.5 text-[13px] text-lime">
              Crear personalizado
            </button>
            <button onClick={() => setOpen(false)} className="px-2 py-1.5 text-[13px] text-muted">
              Cancelar
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}

function CustomForm({ initialName, onAdd, onCancel }: { initialName: string; onAdd: (i: FoodItem) => void; onCancel: () => void }) {
  const [name, setName] = useState(initialName);
  const [v, setV] = useState({ grams: "100", kcal: "", protein: "", carbs: "", fat: "" });
  const num = (s: string) => Math.max(0, parseFloat(s.replace(",", ".")) || 0);
  const valid = name.trim() && num(v.grams) > 0 && num(v.kcal) > 0;
  const field = (k: keyof typeof v, label: string) => (
    <label className="block">
      <span className="text-[11px] text-muted">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        value={v[k]}
        onChange={(e) => setV({ ...v, [k]: e.target.value })}
        className="num mt-1 h-9 w-full rounded-lg border border-line bg-surface px-2.5 outline-none focus:border-lime/40"
      />
    </label>
  );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        const g = num(v.grams);
        const k = 100 / g;
        onAdd({
          id: uid(),
          name: name.trim(),
          grams: g,
          per100: { kcal: num(v.kcal) * k, protein: num(v.protein) * k, carbs: num(v.carbs) * k, fat: num(v.fat) * k },
        });
      }}
      className="space-y-3"
    >
      <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del alimento" className="h-10 w-full rounded-xl bg-surface px-3 outline-none placeholder:text-faint" />
      <p className="text-[11px] text-faint">Valores de la porción completa</p>
      <div className="grid grid-cols-5 gap-2">
        {field("grams", "Gramos")}
        {field("kcal", "Kcal")}
        {field("protein", "Prot.")}
        {field("carbs", "Carbs")}
        {field("fat", "Grasa")}
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-[13px] text-muted">
          Volver
        </button>
        <button type="submit" disabled={!valid} className={cn("rounded-full px-4 py-1.5 text-[13px] font-medium", valid ? "bg-lime text-lime-ink" : "bg-surface-3 text-faint")}>
          Añadir
        </button>
      </div>
    </form>
  );
}
