"use client";

import { ArrowUpRight, Dumbbell, Footprints, Flame, Timer } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { formatDuration, n0 } from "@/lib/format";
import { stepsKcal } from "@/lib/nutrition";
import { useStore } from "@/lib/store";
import { MUSCLE_LABELS, workoutMuscles } from "@/lib/workouts";

export function Activity({ date }: { date: string }) {
  const { data, updateDaily } = useStore();
  const workout = data.workouts.find((w) => w.date === date);
  const steps = data.daily[date]?.steps ?? 0;
  const [editSteps, setEditSteps] = useState(false);
  const burned = (workout?.finished ? workout.kcal : 0) + stepsKcal(steps, data.profile.weightKg);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="label-xs">Actividad de hoy</h2>
        <Link href="/entrenamiento" className="flex items-center gap-1 text-[12px] text-muted hover:text-fg">
          Entrenamientos <ArrowUpRight size={13} />
        </Link>
      </div>

      <Link href="/entrenamiento" className="group -mx-2 flex items-center gap-4 rounded-2xl px-2 py-2 transition-colors hover:bg-white/[0.02]">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-lime-soft text-lime">
          <Dumbbell size={19} />
        </div>
        <div className="min-w-0 flex-1">
          {workout ? (
            <>
              <p className="font-medium">
                {workout.name} <span className="text-faint">· {workout.finished ? "completado" : "en curso"}</span>
              </p>
              <p className="truncate text-[13px] text-muted">{workoutMuscles(workout).map((m) => MUSCLE_LABELS[m]).join(" · ")}</p>
            </>
          ) : (
            <>
              <p className="font-medium">Sin entrenamiento registrado</p>
              <p className="text-[13px] text-muted">Toca para empezar una sesión</p>
            </>
          )}
        </div>
      </Link>

      <div className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line">
        <Cell icon={<Timer size={14} />} label="Duración" value={workout?.finished ? formatDuration(workout.durationMin) : "—"} />
        <button onClick={() => setEditSteps(true)} className="bg-surface p-3.5 text-left transition-colors hover:bg-surface-2">
          <span className="flex items-center gap-1.5 text-[11px] text-muted">
            <Footprints size={14} /> Pasos
          </span>
          {editSteps ? (
            <input
              autoFocus
              type="number"
              inputMode="numeric"
              defaultValue={steps || ""}
              onBlur={(e) => {
                updateDaily(date, { steps: parseInt(e.target.value, 10) || 0 });
                setEditSteps(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              className="num mt-1.5 w-full bg-transparent text-[18px] font-semibold outline-none"
              aria-label="Pasos de hoy"
            />
          ) : (
            <p className="num mt-1.5 text-[18px] font-semibold">{steps ? n0(steps) : "Añadir"}</p>
          )}
        </button>
        <Cell icon={<Flame size={14} />} label="Kcal ejercicio" value={n0(burned)} />
      </div>
    </div>
  );
}

function Cell({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-surface p-3.5">
      <span className="flex items-center gap-1.5 text-[11px] text-muted">
        {icon} {label}
      </span>
      <p className="num mt-1.5 text-[18px] font-semibold">{value}</p>
    </div>
  );
}
