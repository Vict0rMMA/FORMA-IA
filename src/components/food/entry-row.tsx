"use client";

import { motion } from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";
import { n0 } from "@/lib/format";
import { entryMacros } from "@/lib/nutrition";
import type { FoodEntry } from "@/lib/types";
import { FoodThumb } from "./food-thumb";

export function EntryRow({ entry, onEdit, onDelete }: { entry: FoodEntry; onEdit?: () => void; onDelete?: () => void }) {
  const m = entryMacros(entry);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12, transition: { duration: 0.18 } }}
      className="group flex items-center gap-3.5 py-3"
    >
      <FoodThumb image={entry.image} meal={entry.meal} size={52} />
      <button onClick={onEdit} className="min-w-0 flex-1 text-left" disabled={!onEdit}>
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate font-medium">{entry.title}</p>
          <p className="num shrink-0 font-semibold">
            {n0(m.kcal)} <span className="text-[12px] font-normal text-faint">kcal</span>
          </p>
        </div>
        <p className="num mt-1 truncate text-[12.5px] text-muted">
          {n0(m.protein)} g proteína · {n0(m.carbs)} g carbohidratos · {n0(m.fat)} g grasa
        </p>
      </button>
      {(onEdit || onDelete) && (
        <div className="hover-reveal flex shrink-0 items-center transition-opacity">
          {onEdit && (
            <button onClick={onEdit} className="grid h-8 w-8 place-items-center rounded-full text-faint hover:bg-white/5 hover:text-fg" aria-label="Editar">
              <Pencil size={14} />
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} className="grid h-8 w-8 place-items-center rounded-full text-faint hover:bg-danger/10 hover:text-danger" aria-label="Eliminar">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
