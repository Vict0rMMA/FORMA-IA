"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, MoreHorizontal, Plus, Search, Timer, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/controls";
import { Sheet } from "@/components/ui/sheet";
import { cn, formatDuration, n0, uid } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { workoutKcal } from "@/lib/nutrition";
import { useStore } from "@/lib/store";
import type { Exercise, MuscleGroup, SetEntry, Workout } from "@/lib/types";
import { EXERCISE_LIBRARY, MUSCLE_LABELS, buildExercise, workoutSets, workoutVolume } from "@/lib/workouts";

const clock = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h ? `${h}:` : ""}${String(m).padStart(h ? 2 : 1, "0")}:${String(sec).padStart(2, "0")}`;
};

/** Registro en vivo: pensado para usarse con una mano entre series. */
export function ActiveWorkout({ workout }: { workout: Workout }) {
  const { saveWorkout, deleteWorkout, data } = useStore();
  const now = useNow(1000);
  const [rest, setRest] = useState<{ until: number; total: number } | null>(null);
  const [adding, setAdding] = useState(false);
  const elapsed = workout.startedAt ? now - new Date(workout.startedAt).getTime() : 0;

  const update = (exercises: Exercise[]) => saveWorkout({ ...workout, exercises });
  const updateEx = (id: string, patch: Partial<Exercise>) => update(workout.exercises.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const updateSet = (ex: Exercise, setId: string, patch: Partial<SetEntry>) => updateEx(ex.id, { sets: ex.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) });

  const toggleSet = (ex: Exercise, s: SetEntry) => {
    updateSet(ex, s.id, { done: !s.done });
    if (!s.done && ex.restSec > 0) setRest({ until: Date.now() + ex.restSec * 1000, total: ex.restSec });
  };

  const finish = () => {
    const minutes = Math.max(1, Math.round(elapsed / 60000));
    saveWorkout({ ...workout, finished: true, durationMin: minutes, kcal: workoutKcal(data.profile.weightKg, minutes) });
    toast.success("Entrenamiento completado", { description: `${formatDuration(minutes)} · ${workoutSets(workout)} series` });
  };

  const restLeft = rest ? rest.until - now : 0;
  useEffect(() => {
    if (rest && restLeft <= 0) {
      setRest(null);
      if ("vibrate" in navigator) navigator.vibrate?.(200);
    }
  }, [rest, restLeft]);

  return (
    <div>
      {/* Barra de sesión */}
      <div className="sticky top-0 z-20 -mx-4 mb-6 flex items-center justify-between gap-3 border-b border-line bg-bg/85 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 md:static md:mx-0 md:rounded-[22px] md:border md:bg-surface md:px-5">
        <div>
          <p className="label-xs">{workout.name} · en curso</p>
          <p className="num mt-1.5 text-[26px] font-semibold leading-none">{clock(elapsed)}</p>
        </div>
        <div className="num hidden text-right text-[13px] text-muted sm:block">
          <p>{workoutSets(workout)} series</p>
          <p>{n0(workoutVolume(workout))} kg volumen</p>
        </div>
        <Button variant="primary" onClick={finish}>
          <Check size={16} /> Finalizar
        </Button>
      </div>

      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {workout.exercises.map((ex) => (
            <motion.div key={ex.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} className="rounded-[22px] border border-line bg-surface p-4 md:p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{ex.name}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Pill>{MUSCLE_LABELS[ex.muscle]}</Pill>
                    <button
                      onClick={() => updateEx(ex.id, { restSec: ex.restSec >= 180 ? 60 : ex.restSec + 30 })}
                      className="flex items-center gap-1 text-[11px] text-muted hover:text-fg"
                      title="Cambiar descanso"
                    >
                      <Timer size={12} /> {ex.restSec}s descanso
                    </button>
                  </div>
                </div>
                <ExerciseMenu onDelete={() => update(workout.exercises.filter((e) => e.id !== ex.id))} />
              </div>

              <div className="grid grid-cols-[28px_1fr_1fr_44px] items-center gap-2 px-1 pb-1.5 text-[11px] text-faint">
                <span>#</span>
                <span className="text-center">KG</span>
                <span className="text-center">{ex.muscle === "core" && ex.sets[0]?.reps >= 30 ? "SEG" : "REPS"}</span>
                <span />
              </div>
              <div className="space-y-1.5">
                {ex.sets.map((s, i) => (
                  <motion.div
                    key={s.id}
                    layout
                    className={cn("grid grid-cols-[28px_1fr_1fr_44px] items-center gap-2 rounded-xl px-1 py-1 transition-colors", s.done && "bg-lime-soft")}
                  >
                    <span className="num text-[13px] text-muted">{i + 1}</span>
                    <NumberCell value={s.weight} step={2.5} onChange={(v) => updateSet(ex, s.id, { weight: v })} />
                    <NumberCell value={s.reps} step={1} onChange={(v) => updateSet(ex, s.id, { reps: v })} />
                    <button
                      onClick={() => toggleSet(ex, s)}
                      className={cn("grid h-10 w-10 place-items-center rounded-xl transition-all active:scale-90", s.done ? "bg-lime text-lime-ink" : "bg-surface-3 text-faint hover:text-fg")}
                      aria-label={s.done ? "Marcar como pendiente" : "Completar serie"}
                    >
                      <Check size={17} strokeWidth={2.6} />
                    </button>
                  </motion.div>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => {
                    const last = ex.sets.at(-1);
                    updateEx(ex.id, { sets: [...ex.sets, { id: uid(), reps: last?.reps ?? 10, weight: last?.weight ?? 0, done: false }] });
                  }}
                  className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl text-[13px] text-muted hover:bg-white/[0.03] hover:text-fg"
                >
                  <Plus size={14} /> Serie
                </button>
                {ex.sets.length > 1 && (
                  <button onClick={() => updateEx(ex.id, { sets: ex.sets.slice(0, -1) })} className="h-9 rounded-xl px-3 text-[13px] text-faint hover:text-fg">
                    Quitar última
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <button
          onClick={() => setAdding(true)}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-[22px] border border-dashed border-line-strong text-sm text-muted transition-colors hover:text-fg"
        >
          <Plus size={16} /> Añadir ejercicio
        </button>
        <button
          onClick={() => {
            if (confirm("¿Descartar este entrenamiento?")) deleteWorkout(workout.id);
          }}
          className="w-full py-3 text-center text-[13px] text-faint hover:text-danger"
        >
          Descartar entrenamiento
        </button>
      </div>

      {/* Descanso */}
      <AnimatePresence>
        {rest && restLeft > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed inset-x-0 bottom-[86px] z-40 mx-auto flex w-[min(92vw,360px)] items-center gap-4 overflow-hidden rounded-full border border-line-strong bg-surface-2 py-2 pl-5 pr-2 md:bottom-8"
          >
            <motion.div className="absolute inset-y-0 left-0 bg-lime-soft" style={{ width: `${(restLeft / (rest.total * 1000)) * 100}%` }} />
            <Timer size={16} className="relative text-lime" />
            <div className="relative flex-1">
              <p className="text-[11px] text-muted">Descanso</p>
              <p className="num text-lg font-semibold leading-tight">{clock(restLeft)}</p>
            </div>
            <button onClick={() => setRest({ ...rest, until: rest.until + 30_000 })} className="relative h-9 rounded-full px-3 text-[13px] text-muted hover:text-fg">
              +30s
            </button>
            <button onClick={() => setRest(null)} className="relative grid h-9 w-9 place-items-center rounded-full bg-surface-3 text-muted hover:text-fg" aria-label="Saltar descanso">
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AddExerciseSheet
        open={adding}
        onClose={() => setAdding(false)}
        onAdd={(name, muscle) => {
          const ex = buildExercise(name, 0, 10);
          update([...workout.exercises, { ...ex, muscle }]);
          setAdding(false);
        }}
      />
    </div>
  );
}

function NumberCell({ value, step, onChange }: { value: number; step: number; onChange: (v: number) => void }) {
  return (
    <div className="flex h-10 items-center rounded-xl bg-surface-2">
      <button onClick={() => onChange(Math.max(0, value - step))} className="h-full w-7 shrink-0 text-faint hover:text-fg" aria-label="Restar">
        −
      </button>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onFocus={(e) => e.target.select()}
        onChange={(e) => onChange(Math.max(0, parseFloat(e.target.value) || 0))}
        className="num w-full min-w-0 bg-transparent text-center text-[16px] font-semibold outline-none"
      />
      <button onClick={() => onChange(value + step)} className="h-full w-7 shrink-0 text-faint hover:text-fg" aria-label="Sumar">
        +
      </button>
    </div>
  );
}

function ExerciseMenu({ onDelete }: { onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="grid h-8 w-8 place-items-center rounded-full text-faint hover:bg-white/5 hover:text-fg" aria-label="Opciones">
        <MoreHorizontal size={17} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute right-0 top-9 z-10 w-40 origin-top-right rounded-xl border border-line-strong bg-surface-2 p-1"
          >
            <button onClick={() => (setOpen(false), onDelete())} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] text-danger hover:bg-danger/10">
              <Trash2 size={14} /> Eliminar ejercicio
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AddExerciseSheet({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (name: string, muscle: MuscleGroup) => void }) {
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState<MuscleGroup>("pecho");
  const list = useMemo(() => EXERCISE_LIBRARY.filter((e) => e.name.toLowerCase().includes(q.toLowerCase())), [q]);
  const grouped = useMemo(() => {
    const m = new Map<MuscleGroup, string[]>();
    list.forEach((e) => m.set(e.muscle, [...(m.get(e.muscle) ?? []), e.name]));
    return [...m.entries()];
  }, [list]);

  return (
    <Sheet open={open} onClose={onClose} title="Añadir ejercicio">
      <div className="flex h-11 items-center gap-2 rounded-xl border border-line bg-surface-2 px-3">
        <Search size={15} className="text-faint" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar o escribir uno nuevo" className="w-full bg-transparent outline-none placeholder:text-faint" />
      </div>
      {q && !EXERCISE_LIBRARY.some((e) => e.name.toLowerCase() === q.toLowerCase()) && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-surface-2 p-2">
          <select value={muscle} onChange={(e) => setMuscle(e.target.value as MuscleGroup)} className="h-9 rounded-lg bg-surface px-2 text-sm outline-none">
            {Object.entries(MUSCLE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <Button size="sm" variant="primary" className="ml-auto" onClick={() => (onAdd(q.trim(), muscle), setQ(""))}>
            Crear «{q.trim()}»
          </Button>
        </div>
      )}
      <div className="mt-4 space-y-5">
        {grouped.map(([m, names]) => (
          <div key={m}>
            <p className="label-xs mb-2">{MUSCLE_LABELS[m]}</p>
            {names.map((n) => (
              <button key={n} onClick={() => (onAdd(n, m), setQ(""))} className="flex w-full items-center justify-between rounded-lg px-2 py-2.5 text-left text-sm hover:bg-white/[0.04]">
                {n} <Plus size={15} className="text-faint" />
              </button>
            ))}
          </div>
        ))}
      </div>
    </Sheet>
  );
}
