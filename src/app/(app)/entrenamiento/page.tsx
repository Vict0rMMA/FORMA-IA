"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Dumbbell, Play, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { ActiveWorkout } from "@/components/workout/active-workout";
import { LoadChart, MuscleBreakdown } from "@/components/workout/stats";
import { Pill } from "@/components/ui/controls";
import { Empty, PageHeader, SectionTitle, Surface } from "@/components/ui/layout";
import { relativeDay, startOfWeek, todayKey, weekdayShort, formatShort } from "@/lib/dates";
import { cn, formatDuration, n0, n1 } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Workout } from "@/lib/types";
import { MUSCLE_LABELS, TEMPLATES, workoutFromTemplate, workoutMuscles, workoutSets, workoutVolume } from "@/lib/workouts";

export default function TrainingPage() {
  const { data, saveWorkout } = useStore();
  const today = todayKey();
  const active = data.workouts.find((w) => !w.finished);
  const todayDone = data.workouts.filter((w) => w.date === today && w.finished);
  const weekStart = startOfWeek(today);
  const thisWeek = data.workouts.filter((w) => w.finished && w.date >= weekStart);
  const minutes = thisWeek.reduce((a, w) => a + w.durationMin, 0);
  const history = useMemo(() => data.workouts.filter((w) => w.finished).sort((a, b) => b.date.localeCompare(a.date) || (b.startedAt ?? "").localeCompare(a.startedAt ?? "")), [data.workouts]);

  const start = (name: string) => {
    const w = name === "Libre" ? { ...workoutFromTemplate("Libre", today, []), exercises: [] } : workoutFromTemplate(name, today, data.workouts);
    saveWorkout(w);
  };

  return (
    <>
      <PageHeader title="Entrenamientos" subtitle={active ? undefined : "Registra cada serie en segundos."} />

      <section className="mb-10 grid grid-cols-3 gap-px overflow-hidden rounded-[22px] border border-line bg-line">
        <Stat label="Esta semana" value={`${thisWeek.length}`} suffix={`/ ${data.profile.workoutsPerWeek}`} />
        <Stat label="Tiempo" value={formatDuration(minutes)} />
        <Stat label="Volumen" value={n1(thisWeek.reduce((a, w) => a + workoutVolume(w), 0) / 1000)} suffix="t" />
      </section>

      {active ? (
        <ActiveWorkout workout={active} />
      ) : (
        <section>
          <SectionTitle>{todayDone.length ? "Entrenamiento de hoy" : "Empezar entrenamiento"}</SectionTitle>
          {todayDone.map((w) => (
            <div key={w.id} className="mb-5">
              <WorkoutRow w={w} defaultOpen />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
            {[...TEMPLATES.map((t) => t.name), "Libre"].map((name) => {
              const last = data.workouts.filter((w) => w.name === name && w.finished).sort((a, b) => b.date.localeCompare(a.date))[0];
              return (
                <button
                  key={name}
                  onClick={() => start(name)}
                  className="group flex flex-col items-start rounded-[20px] border border-line bg-surface p-4 text-left transition-colors hover:border-line-strong hover:bg-surface-2"
                >
                  <span className="mb-6 grid h-9 w-9 place-items-center rounded-full bg-surface-3 text-muted transition-colors group-hover:bg-lime group-hover:text-lime-ink">
                    <Play size={14} />
                  </span>
                  <span className="font-medium">{name}</span>
                  <span className="mt-0.5 text-[12px] text-faint">{last ? `Última: ${formatShort(last.date)}` : name === "Libre" ? "Desde cero" : "Plantilla"}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <div className="mt-12 grid gap-4 lg:grid-cols-2">
        <Surface className="p-5 md:p-6">
          <SectionTitle>Evolución de cargas</SectionTitle>
          <LoadChart workouts={data.workouts} />
        </Surface>
        <Surface className="p-5 md:p-6">
          <SectionTitle>Grupos musculares · 30 días</SectionTitle>
          <MuscleBreakdown workouts={data.workouts} />
        </Surface>
      </div>

      <section className="mt-12">
        <SectionTitle>Historial</SectionTitle>
        {history.length ? (
          <div className="divide-y divide-line border-t border-line">
            {history.slice(0, 30).map((w) => (
              <WorkoutRow key={w.id} w={w} />
            ))}
          </div>
        ) : (
          <Empty icon={<Dumbbell size={18} />} title="Sin entrenamientos aún" text="Elige una plantilla arriba para registrar tu primera sesión." />
        )}
      </section>
    </>
  );
}

function Stat({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="bg-bg p-4 md:p-6">
      <p className="label-xs">{label}</p>
      <p className="num mt-3 text-[24px] font-semibold leading-none md:text-[30px]">
        {value}
        {suffix && <span className="ml-1 text-sm font-normal text-faint">{suffix}</span>}
      </p>
    </div>
  );
}

function WorkoutRow({ w, defaultOpen = false }: { w: Workout; defaultOpen?: boolean }) {
  const { deleteWorkout, saveWorkout } = useStore();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn(defaultOpen && "rounded-[22px] border border-line bg-surface px-4")}>
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-4 py-4 text-left">
        <div className="w-11 shrink-0 text-center">
          <p className="text-[11px] uppercase text-faint">{weekdayShort(w.date)}</p>
          <p className="num text-lg font-semibold">{w.date.slice(8)}</p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{w.name}</p>
          <p className="truncate text-[13px] text-muted">{workoutMuscles(w).map((m) => MUSCLE_LABELS[m]).join(" · ")}</p>
        </div>
        <div className="num hidden text-right text-[13px] text-muted sm:block">
          <p>{formatDuration(w.durationMin)}</p>
          <p>{n0(workoutVolume(w))} kg</p>
        </div>
        <ChevronDown size={16} className={cn("shrink-0 text-faint transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="space-y-2.5 pb-4 pl-[60px]">
              <div className="flex flex-wrap gap-1.5">
                <Pill>{relativeDay(w.date)}</Pill>
                <Pill>{formatDuration(w.durationMin)}</Pill>
                <Pill>{workoutSets(w)} series</Pill>
                <Pill>{n0(w.kcal)} kcal</Pill>
              </div>
              {w.exercises.map((e) => (
                <div key={e.id} className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="truncate">{e.name}</span>
                  <span className="num shrink-0 text-muted">
                    {e.sets
                      .filter((s) => s.done)
                      .map((s) => (s.weight ? `${s.weight}×${s.reps}` : `${s.reps}`))
                      .join("  ")}
                  </span>
                </div>
              ))}
              <div className="flex gap-4 pt-1">
                <button onClick={() => saveWorkout({ ...w, finished: false, startedAt: new Date(Date.now() - w.durationMin * 60000).toISOString() })} className="text-[12px] text-muted hover:text-fg">
                  Reabrir para editar
                </button>
                <button onClick={() => confirm("¿Eliminar este entrenamiento?") && deleteWorkout(w.id)} className="flex items-center gap-1 text-[12px] text-faint hover:text-danger">
                  <Trash2 size={12} /> Eliminar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
