"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Camera, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { EntryRow } from "@/components/food/entry-row";
import { FoodSheet } from "@/components/food/food-sheet";
import { useDeleteFood } from "@/components/food/use-delete-food";
import { PageHeader } from "@/components/ui/layout";
import { Bar } from "@/components/ui/progress";
import { addDays, formatShort, fromKey, relativeDay, todayKey, weekDays, weekdayLetter } from "@/lib/dates";
import { cn, n0 } from "@/lib/format";
import { MEAL_LABELS, MEAL_ORDER, dayMacros, entryMacros, mealForHour } from "@/lib/nutrition";
import { useStore } from "@/lib/store";
import type { FoodEntry, MealType } from "@/lib/types";

export default function DiaryPage() {
  return (
    <Suspense>
      <Diary />
    </Suspense>
  );
}

function Diary() {
  const params = useSearchParams();
  const router = useRouter();
  const { data, targets } = useStore();
  const today = todayKey();
  const date = params.get("date") ?? today;
  const setDate = (d: string) => router.replace(`/diario?date=${d}`, { scroll: false });
  const days = weekDays(date);
  const totals = dayMacros(data.foods, date);
  const remove = useDeleteFood();
  const [sheet, setSheet] = useState<{ open: boolean; meal: MealType; entry: FoodEntry | null }>({ open: false, meal: mealForHour(), entry: null });

  return (
    <>
      <PageHeader eyebrow={relativeDay(date)} title="Mi alimentación" />

      {/* Semana */}
      <div className="mb-8 flex items-center gap-1 md:gap-2">
        <button onClick={() => setDate(addDays(date, -7))} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-surface hover:text-fg" aria-label="Semana anterior">
          <ChevronLeft size={18} />
        </button>
        <div className="grid flex-1 grid-cols-7 gap-1">
          {days.map((d) => {
            const kcal = dayMacros(data.foods, d).kcal;
            const active = d === date;
            const future = d > today;
            return (
              <button
                key={d}
                onClick={() => setDate(d)}
                disabled={future}
                className={cn(
                  "relative flex flex-col items-center gap-1.5 rounded-2xl py-2.5 transition-colors disabled:opacity-30",
                  active ? "text-lime-ink" : "hover:bg-surface",
                )}
              >
                {active && <motion.span layoutId="day-active" className="absolute inset-0 rounded-2xl bg-lime" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                <span className={cn("relative text-[11px] font-medium", active ? "" : "text-faint")}>{weekdayLetter(d)}</span>
                <span className="num relative text-[17px] font-semibold">{fromKey(d).getDate()}</span>
                <span className={cn("relative h-1 w-1 rounded-full", kcal ? (active ? "bg-lime-ink" : d === today ? "bg-lime" : "bg-muted") : "bg-transparent")} />
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setDate(addDays(date, 7))}
          disabled={addDays(days[0], 7) > today}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-surface hover:text-fg disabled:opacity-30"
          aria-label="Semana siguiente"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Resumen del día */}
      <div className="mb-10">
        <div className="mb-3 flex items-baseline justify-between">
          <p className="num text-[30px] font-semibold leading-none">
            {n0(totals.kcal)}
            <span className="text-base font-normal text-faint"> / {n0(targets.kcal)} kcal</span>
          </p>
          <p className="text-[13px] text-muted">{formatShort(date)}</p>
        </div>
        <Bar value={totals.kcal} max={targets.kcal} />
        <p className="num mt-3 text-[13px] text-muted">
          <span className="text-lime">{n0(totals.protein)}</span>/{n0(targets.protein)} g proteína · {n0(totals.carbs)}/{n0(targets.carbs)} g carbohidratos · {n0(totals.fat)}/{n0(targets.fat)} g grasa
        </p>
      </div>

      {/* Comidas */}
      <div className="space-y-9">
        {MEAL_ORDER.map((meal) => {
          const entries = data.foods.filter((f) => f.date === date && f.meal === meal).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
          const kcal = entries.reduce((a, e) => a + entryMacros(e).kcal, 0);
          return (
            <section key={meal}>
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div className="flex items-baseline gap-3">
                  <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em]">{MEAL_LABELS[meal]}</h2>
                  {kcal > 0 && <span className="num text-[13px] text-muted">{n0(kcal)} kcal</span>}
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/escaner?date=${date}&meal=${meal}`}
                    className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-surface hover:text-lime"
                    aria-label={`Analizar foto para ${MEAL_LABELS[meal]}`}
                  >
                    <Camera size={16} />
                  </Link>
                  <button
                    onClick={() => setSheet({ open: true, meal, entry: null })}
                    className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-surface hover:text-fg"
                    aria-label={`Añadir comida a ${MEAL_LABELS[meal]}`}
                  >
                    <Plus size={17} />
                  </button>
                </div>
              </div>
              <div className="divide-y divide-line">
                <AnimatePresence initial={false}>
                  {entries.map((e) => (
                    <EntryRow key={e.id} entry={e} onEdit={() => setSheet({ open: true, meal, entry: e })} onDelete={() => remove(e.id)} />
                  ))}
                </AnimatePresence>
              </div>
              {!entries.length && (
                <button onClick={() => setSheet({ open: true, meal, entry: null })} className="mt-3 text-[13px] text-faint hover:text-muted">
                  Sin registros · añadir
                </button>
              )}
            </section>
          );
        })}
      </div>

      <FoodSheet open={sheet.open} entry={sheet.entry} date={date} meal={sheet.meal} onClose={() => setSheet((s) => ({ ...s, open: false, entry: null }))} />
    </>
  );
}
