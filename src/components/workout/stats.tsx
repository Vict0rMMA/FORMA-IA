"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Bar } from "@/components/ui/progress";
import { addDays, formatShort, todayKey } from "@/lib/dates";
import { n0, n1 } from "@/lib/format";
import type { MuscleGroup, Workout } from "@/lib/types";
import { MUSCLE_LABELS, e1rm } from "@/lib/workouts";

/** Series por grupo muscular en los últimos 30 días. */
export function MuscleBreakdown({ workouts }: { workouts: Workout[] }) {
  const rows = useMemo(() => {
    const since = addDays(todayKey(), -30);
    const counts = new Map<MuscleGroup, number>();
    workouts
      .filter((w) => w.finished && w.date >= since)
      .forEach((w) => w.exercises.forEach((e) => counts.set(e.muscle, (counts.get(e.muscle) ?? 0) + e.sets.filter((s) => s.done).length)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [workouts]);
  const max = rows[0]?.[1] ?? 1;

  if (!rows.length) return <p className="text-sm text-muted">Completa entrenamientos para ver tu reparto muscular.</p>;
  return (
    <div className="space-y-4">
      {rows.map(([m, n], i) => (
        <div key={m}>
          <div className="mb-2 flex justify-between text-[13px]">
            <span>{MUSCLE_LABELS[m]}</span>
            <span className="num text-muted">{n} series</span>
          </div>
          <Bar value={n} max={max} delay={i * 0.05} color={i === 0 ? "var(--color-lime)" : "rgb(244 244 245 / 0.55)"} />
        </div>
      ))}
    </div>
  );
}

/** Evolución de carga: 1RM estimado por sesión para el ejercicio elegido. */
export function LoadChart({ workouts }: { workouts: Workout[] }) {
  const exercises = useMemo(() => {
    const count = new Map<string, number>();
    workouts.forEach((w) => w.exercises.forEach((e) => e.sets.some((s) => s.weight > 0) && count.set(e.name, (count.get(e.name) ?? 0) + 1)));
    return [...count.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).map(([n]) => n);
  }, [workouts]);
  const [name, setName] = useState<string | null>(null);
  const selected = name && exercises.includes(name) ? name : exercises[0];

  const points = useMemo(
    () =>
      workouts
        .filter((w) => w.finished)
        .sort((a, b) => a.date.localeCompare(b.date))
        .flatMap((w) => {
          const ex = w.exercises.find((e) => e.name === selected);
          const sets = ex?.sets.filter((s) => s.done && s.weight > 0) ?? [];
          if (!sets.length) return [];
          const best = Math.max(...sets.map((s) => e1rm(s.weight, s.reps)));
          const top = Math.max(...sets.map((s) => s.weight));
          return [{ date: w.date, e1rm: Math.round(best * 10) / 10, top }];
        }),
    [workouts, selected],
  );

  if (!selected) return <p className="text-sm text-muted">Registra un ejercicio con peso en al menos dos sesiones.</p>;
  const first = points[0]?.e1rm ?? 0;
  const last = points.at(-1)?.e1rm ?? 0;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <select value={selected} onChange={(e) => setName(e.target.value)} className="h-9 rounded-full border border-line bg-surface-2 px-3 text-[13px] outline-none">
          {exercises.map((e) => (
            <option key={e}>{e}</option>
          ))}
        </select>
        <p className="num text-right">
          <span className="text-[22px] font-semibold">{n1(last)} kg</span>
          <span className={`ml-2 text-[13px] ${last >= first ? "text-lime" : "text-danger"}`}>
            {last >= first ? "+" : "−"}
            {n1(Math.abs(last - first))}
          </span>
          <span className="block text-[11px] text-muted">1RM estimado</span>
        </p>
      </div>
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="load" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C6F36B" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#C6F36B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tickFormatter={formatShort} tick={{ fill: "#5c5c64", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={30} />
            <YAxis domain={["dataMin - 3", "dataMax + 3"]} tick={{ fill: "#5c5c64", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              cursor={{ stroke: "rgb(255 255 255 / 0.12)" }}
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <div className="rounded-xl border border-line-strong bg-surface-2 px-3 py-2 text-[12px]">
                    <p className="text-muted">{formatShort(payload[0].payload.date)}</p>
                    <p className="num font-semibold">1RM {n1(payload[0].payload.e1rm)} kg</p>
                    <p className="num text-muted">Máx. {n0(payload[0].payload.top)} kg</p>
                  </div>
                ) : null
              }
            />
            <Area type="monotone" dataKey="e1rm" stroke="#C6F36B" strokeWidth={2} fill="url(#load)" dot={false} activeDot={{ r: 4, fill: "#C6F36B", stroke: "#0A0A0B", strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
