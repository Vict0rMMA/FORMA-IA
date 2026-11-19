"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Plus, ScanLine, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Activity } from "@/components/dashboard/activity";
import { CalorieHero } from "@/components/dashboard/calorie-hero";
import { MacroBars } from "@/components/dashboard/macro-bars";
import { WaterWidget } from "@/components/dashboard/water-widget";
import { EntryRow } from "@/components/food/entry-row";
import { FoodSheet } from "@/components/food/food-sheet";
import { useDeleteFood } from "@/components/food/use-delete-food";
import { DemoBanner } from "@/components/shell/demo-banner";
import { Surface } from "@/components/ui/layout";
import { formatLong, greeting, todayKey } from "@/lib/dates";
import { n1 } from "@/lib/format";
import { dayMacros, mealForHour } from "@/lib/nutrition";
import { useStore } from "@/lib/store";
import type { FoodEntry, Macros, Profile } from "@/lib/types";

const rise = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.05 + i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
});

function tagline(p: Profile, consumed: Macros, targets: Macros, latestKg: number): string {
  const kgLeft = latestKg - p.targetWeightKg;
  const kcalLeft = targets.kcal - consumed.kcal;
  const proteinPct = consumed.protein / targets.protein;
  if (consumed.kcal === 0) return "Un día nuevo. Empieza registrando tu primera comida.";
  if (kcalLeft < 0) return "Hoy te pasaste un poco. Mañana, vuelta al plan — sin compensar.";
  if (proteinPct < 0.5 && new Date().getHours() >= 15) return "La proteína va rezagada. Prioriza una fuente magra en la próxima comida.";
  if (p.goal === "lose" && kgLeft > 0) return `Te faltan ${n1(kgLeft)} kg para tus ${p.targetWeightKg} kg. Cada día cuenta.`;
  if (p.goal === "gain") return "Volumen limpio: cubre tus calorías y prioriza el descanso.";
  return "Vas en línea con tu plan. Mantén el ritmo.";
}

export default function Dashboard() {
  const { data, targets } = useStore();
  const today = todayKey();
  const consumed = dayMacros(data.foods, today);
  const todayFoods = data.foods.filter((f) => f.date === today).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const latestKg = data.weights.at(-1)?.kg ?? data.profile.weightKg;
  const [sheet, setSheet] = useState<{ open: boolean; entry: FoodEntry | null }>({ open: false, entry: null });
  const remove = useDeleteFood();

  return (
    <>
      <motion.header {...rise(0)} className="mb-8 flex items-start justify-between gap-4 md:mb-12">
        <div className="min-w-0">
          <p className="label-xs mb-3">{formatLong(today)}</p>
          <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.03em] md:text-[36px]">
            {greeting()}, {data.profile.name.split(" ")[0]} 👋
          </h1>
          <p className="mt-2 max-w-md text-[15px] text-muted">{tagline(data.profile, consumed, targets, latestKg)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/coach" className="grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-muted hover:text-fg md:hidden" aria-label="AI Coach">
            <Sparkles size={17} />
          </Link>
          <Link href="/perfil" className="grid h-10 w-10 place-items-center rounded-full bg-surface-3 text-sm font-semibold transition-colors hover:bg-surface-2" aria-label="Perfil y configuración">
            {data.profile.name.charAt(0)}
          </Link>
        </div>
      </motion.header>

      <DemoBanner />

      {/* Protagonista: anillo + macros */}
      <section className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <motion.div {...rise(1)}>
          <CalorieHero consumed={consumed.kcal} target={targets.kcal} />
        </motion.div>
        <motion.div {...rise(2)} className="space-y-8">
          <div>
            <h2 className="label-xs mb-6">Macronutrientes</h2>
            <MacroBars consumed={consumed} targets={targets} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/escaner?meal=${mealForHour()}`} className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-lime px-6 text-[15px] font-semibold text-lime-ink transition-transform active:scale-[0.98] sm:flex-none">
              <Plus size={18} strokeWidth={2.5} /> Analizar comida
            </Link>
            <button
              onClick={() => setSheet({ open: true, entry: null })}
              className="inline-flex h-12 items-center justify-center rounded-full border border-line-strong px-5 text-[14px] text-fg transition-colors hover:bg-surface-2"
            >
              Registrar manual
            </button>
          </div>
        </motion.div>
      </section>

      <div className="my-12 h-px bg-line md:my-14" />

      <section className="grid gap-4 md:grid-cols-[1.35fr_1fr]">
        <motion.div {...rise(3)}>
          <Surface className="h-full p-5 md:p-6">
            <Activity date={today} />
          </Surface>
        </motion.div>
        <motion.div {...rise(4)}>
          <Surface className="h-full p-5 md:p-6">
            <WaterWidget date={today} />
          </Surface>
        </motion.div>
      </section>

      <motion.section {...rise(5)} className="mt-10">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="label-xs">Hoy has comido</h2>
          <Link href="/diario" className="flex items-center gap-1 text-[12px] text-muted hover:text-fg">
            Ver diario <ArrowUpRight size={13} />
          </Link>
        </div>
        {todayFoods.length ? (
          <div className="divide-y divide-line">
            {todayFoods.map((e) => (
              <EntryRow key={e.id} entry={e} onEdit={() => setSheet({ open: true, entry: e })} onDelete={() => remove(e.id)} />
            ))}
          </div>
        ) : (
          <Link href="/escaner" className="mt-3 flex items-center gap-4 rounded-2xl border border-dashed border-line-strong p-5 text-muted transition-colors hover:text-fg">
            <ScanLine size={20} className="text-lime" />
            <span className="text-sm">Aún no hay comidas hoy. Toma una foto de tu plato y la IA hace el resto.</span>
          </Link>
        )}
      </motion.section>

      <FoodSheet open={sheet.open} entry={sheet.entry} date={today} meal={mealForHour()} onClose={() => setSheet({ open: false, entry: null })} />
    </>
  );
}
