"use client";

import { useMemo } from "react";
import { CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from "recharts";
import { addDays, diffDays, formatMedium, formatShort, todayKey } from "@/lib/dates";
import { n1 } from "@/lib/format";
import type { WeightLog } from "@/lib/types";

export type Range = "7" | "30" | "90" | "180" | "365";

interface Point {
  date: string;
  x: number;
  kg?: number;
  avg?: number;
  trend?: number;
}

/** Peso diario (puntos), media móvil de 7 días (lima) y tendencia lineal (discontinua). */
export function WeightChart({ weights, range, target }: { weights: WeightLog[]; range: Range; target: number }) {
  const { points, start, end, domain } = useMemo(() => {
    const end = todayKey();
    const start = addDays(end, -Number(range));
    const inRange = weights.filter((w) => w.date >= start && w.date <= end);
    const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));

    const pts: Point[] = inRange.map((w) => {
      const window = sorted.filter((o) => o.date <= w.date && diffDays(w.date, o.date) < 7);
      const avg = window.reduce((a, o) => a + o.kg, 0) / window.length;
      return { date: w.date, x: diffDays(w.date, start), kg: w.kg, avg: Math.round(avg * 100) / 100 };
    });

    // Regresión lineal sobre el rango visible.
    if (pts.length >= 2) {
      const n = pts.length;
      const sx = pts.reduce((a, p) => a + p.x, 0);
      const sy = pts.reduce((a, p) => a + p.kg!, 0);
      const sxy = pts.reduce((a, p) => a + p.x * p.kg!, 0);
      const sxx = pts.reduce((a, p) => a + p.x * p.x, 0);
      const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx || 1);
      const icpt = (sy - slope * sx) / n;
      pts.forEach((p) => (p.trend = Math.round((icpt + slope * p.x) * 100) / 100));
    }

    const vals = pts.map((p) => p.kg!).concat(target);
    const min = Math.floor(Math.min(...vals) - 0.5);
    const max = Math.ceil(Math.max(...vals) + 0.5);
    return { points: pts, start, end, domain: [min, max] as [number, number] };
  }, [weights, range, target]);

  if (points.length < 2)
    return <div className="grid h-[280px] place-items-center text-sm text-muted">Registra al menos dos pesos en este periodo para ver la gráfica.</div>;

  const total = Number(range);
  return (
    <div>
      <div className="h-[260px] md:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid vertical={false} stroke="rgb(255 255 255 / 0.05)" />
            <XAxis
              dataKey="x"
              type="number"
              domain={[0, total]}
              ticks={[0, Math.round(total / 2), total]}
              tickFormatter={(x: number) => formatShort(addDays(start, x))}
              tick={{ fill: "#5c5c64", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis domain={domain} tick={{ fill: "#5c5c64", fontSize: 11 }} axisLine={false} tickLine={false} tickCount={5} allowDecimals={false} />
            <ReferenceLine y={target} stroke="rgb(198 243 107 / 0.35)" strokeDasharray="2 6" label={{ value: `Meta ${target} kg`, position: "insideBottomRight", fill: "#8e8e96", fontSize: 11 }} />
            <Tooltip content={<Tip />} cursor={{ stroke: "rgb(255 255 255 / 0.12)" }} />
            <Scatter dataKey="kg" fill="rgb(244 244 245 / 0.35)" shape={<Dot />} isAnimationActive={false} />
            <Line dataKey="trend" stroke="rgb(244 244 245 / 0.45)" strokeWidth={1.25} strokeDasharray="5 5" dot={false} activeDot={false} isAnimationActive />
            <Line dataKey="avg" type="monotone" stroke="#C6F36B" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: "#C6F36B", stroke: "#0A0A0B", strokeWidth: 2 }} animationDuration={1100} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[12px] text-muted">
        <div className="flex flex-wrap gap-4">
          <Legend swatch={<span className="h-1.5 w-1.5 rounded-full bg-white/40" />} label="Peso diario" />
          <Legend swatch={<span className="h-0.5 w-4 rounded bg-lime" />} label="Promedio 7 días" />
          <Legend swatch={<span className="w-4 border-t border-dashed border-white/50" />} label="Tendencia" />
        </div>
        <span className="num">
          {formatMedium(points[0].date)} — {formatMedium(end)}
        </span>
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-2">
      {swatch}
      {label}
    </span>
  );
}

function Dot(props: { cx?: number; cy?: number }) {
  if (props.cx == null || props.cy == null) return null;
  return <circle cx={props.cx} cy={props.cy} r={2.5} fill="rgb(244 244 245 / 0.35)" />;
}

function Tip({ active, payload }: { active?: boolean; payload?: { payload: Point }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-xl border border-line-strong bg-surface-2 px-3 py-2 text-[12px]">
      <p className="text-muted">{formatMedium(p.date)}</p>
      {p.kg != null && <p className="num mt-1 text-[15px] font-semibold">{n1(p.kg)} kg</p>}
      {p.avg != null && <p className="num text-lime">Prom. 7d {n1(p.avg)} kg</p>}
    </div>
  );
}
