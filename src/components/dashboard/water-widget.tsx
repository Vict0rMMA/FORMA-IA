"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Droplet, Settings2, Undo2 } from "lucide-react";
import { useState } from "react";
import { Ring } from "@/components/ui/progress";
import { n0 } from "@/lib/format";
import { useStore } from "@/lib/store";

const QUICK = [250, 500, 750];

export function WaterWidget({ date }: { date: string }) {
  const { data, updateDaily, updateProfile } = useStore();
  const water = data.daily[date]?.waterMl ?? 0;
  const goal = data.profile.waterGoalMl;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(goal));
  const [last, setLast] = useState<number | null>(null);

  const add = (ml: number) => {
    updateDaily(date, { waterMl: water + ml });
    setLast(ml);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="label-xs">Hidratación</h2>
        <button onClick={() => (setDraft(String(goal)), setEditing((v) => !v))} className="text-faint hover:text-fg" aria-label="Cambiar objetivo de agua">
          <Settings2 size={15} />
        </button>
      </div>

      <div className="flex items-center gap-5">
        <Ring value={water} max={goal} size={92} stroke={8} color="var(--color-water)">
          <Droplet size={18} className="text-water" />
        </Ring>
        <div>
          <p className="num text-[28px] font-semibold leading-none">
            {n0(water)}
            <span className="text-[15px] font-normal text-faint"> / {n0(goal)} ml</span>
          </p>
          <p className="mt-2 text-[13px] text-muted">{water >= goal ? "Objetivo cumplido" : `Faltan ${n0(goal - water)} ml`}</p>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {editing && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
            onSubmit={(e) => {
              e.preventDefault();
              const v = parseInt(draft, 10);
              if (v >= 500 && v <= 8000) updateProfile({ waterGoalMl: v });
              setEditing(false);
            }}
          >
            <div className="mt-4 flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="num h-9 w-full rounded-full border border-line bg-surface-2 px-4 outline-none focus:border-lime/40"
                aria-label="Objetivo diario en ml"
              />
              <button type="submit" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-lime text-lime-ink" aria-label="Guardar objetivo">
                <Check size={16} />
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="mt-auto flex items-center gap-2 pt-5">
        {QUICK.map((ml) => (
          <button
            key={ml}
            onClick={() => add(ml)}
            className="num h-9 flex-1 rounded-full border border-line bg-surface-2 text-[13px] font-medium transition-[background-color,transform] hover:bg-surface-3 active:scale-95"
          >
            +{ml}
          </button>
        ))}
        <button
          onClick={() => {
            updateDaily(date, { waterMl: water - (last ?? 250) });
            setLast(null);
          }}
          disabled={water === 0}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-faint hover:text-fg disabled:opacity-30"
          aria-label="Deshacer"
        >
          <Undo2 size={15} />
        </button>
      </div>
    </div>
  );
}
