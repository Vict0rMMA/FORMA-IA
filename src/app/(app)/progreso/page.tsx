"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ProgressPhotos } from "@/components/progress/photos";
import { WeightChart, type Range } from "@/components/progress/weight-chart";
import { Segmented } from "@/components/ui/controls";
import { PageHeader, Surface } from "@/components/ui/layout";
import { Bar } from "@/components/ui/progress";
import { formatMedium, todayKey } from "@/lib/dates";
import { n1 } from "@/lib/format";
import { useStore } from "@/lib/store";

const RANGES: { value: Range; label: string }[] = [
  { value: "7", label: "7D" },
  { value: "30", label: "30D" },
  { value: "90", label: "3M" },
  { value: "180", label: "6M" },
  { value: "365", label: "1A" },
];

export default function ProgressPage() {
  const { data, logWeight, deleteWeight } = useStore();
  const [range, setRange] = useState<Range>("90");
  const [kg, setKg] = useState("");
  const [date, setDate] = useState(todayKey());
  const [showLog, setShowLog] = useState(false);

  const weights = [...data.weights].sort((a, b) => a.date.localeCompare(b.date));
  const current = weights.at(-1)?.kg ?? data.profile.weightKg;
  const start = weights[0]?.kg ?? current;
  const target = data.profile.targetWeightKg;
  const change = current - start;
  const journey = Math.abs(start - target) || 1;
  const done = Math.min(1, Math.max(0, (start - current) / (start - target || 1)));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseFloat(kg.replace(",", "."));
    if (!(v > 25 && v < 400)) return toast.error("Introduce un peso válido");
    logWeight(date, Math.round(v * 10) / 10);
    toast.success(`${n1(v)} kg registrados`);
    setKg("");
  };

  return (
    <>
      <PageHeader title="Progreso" subtitle="Tu evolución, sin ruido diario." />

      <section className="grid grid-cols-3 gap-px overflow-hidden rounded-[22px] border border-line bg-line">
        <Stat label="Peso actual" value={`${n1(current)}`} unit="kg" />
        <Stat label="Peso objetivo" value={`${n1(target)}`} unit="kg" />
        <Stat label="Progreso" value={`${change > 0 ? "+" : change < 0 ? "−" : ""}${n1(Math.abs(change))}`} unit="kg" accent={(data.profile.goal === "gain" ? change > 0 : change < 0)} />
      </section>

      <div className="mt-5">
        <div className="mb-2 flex justify-between text-[12px] text-muted">
          <span>Inicio {n1(start)} kg</span>
          <span className="num">{Math.round(done * 100)}% del camino</span>
          <span>Meta {n1(target)} kg</span>
        </div>
        <Bar value={done * journey} max={journey} />
      </div>

      <Surface className="mt-8 p-5 md:p-7">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="label-xs">Peso</h2>
          <Segmented value={range} onChange={setRange} options={RANGES} size="sm" />
        </div>
        <WeightChart weights={weights} range={range} target={target} />

        <form onSubmit={submit} className="mt-7 flex flex-wrap items-center gap-2 border-t border-line pt-6">
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={kg}
            onChange={(e) => setKg(e.target.value)}
            placeholder={`${n1(current)}`}
            className="num h-11 w-28 rounded-full border border-line bg-surface-2 px-4 outline-none focus:border-lime/40"
            aria-label="Peso en kg"
          />
          <input type="date" value={date} max={todayKey()} onChange={(e) => setDate(e.target.value)} className="h-11 rounded-full border border-line bg-surface-2 px-4 text-muted outline-none" aria-label="Fecha" />
          <button type="submit" className="inline-flex h-11 items-center gap-2 rounded-full bg-lime px-5 text-sm font-semibold text-lime-ink active:scale-[0.97]">
            <Plus size={16} /> Registrar peso
          </button>
          <button type="button" onClick={() => setShowLog((v) => !v)} className="ml-auto text-[13px] text-muted hover:text-fg">
            {showLog ? "Ocultar historial" : "Ver historial"}
          </button>
        </form>

        <AnimatePresence initial={false}>
          {showLog && (
            <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-4 max-h-72 overflow-y-auto">
              {[...weights].reverse().map((w) => (
                <li key={w.id} className="group flex items-center justify-between border-b border-line py-2.5 text-sm">
                  <span className="text-muted">{formatMedium(w.date)}</span>
                  <span className="flex items-center gap-2">
                    <span className="num font-medium">{n1(w.kg)} kg</span>
                    <button onClick={() => deleteWeight(w.id)} className="hover-reveal grid h-7 w-7 place-items-center rounded-full text-faint hover:text-danger" aria-label="Eliminar registro">
                      <Trash2 size={13} />
                    </button>
                  </span>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </Surface>

      <section className="mt-12">
        <ProgressPhotos />
      </section>
    </>
  );
}

function Stat({ label, value, unit, accent }: { label: string; value: string; unit: string; accent?: boolean }) {
  return (
    <div className="bg-bg p-4 md:p-6">
      <p className="label-xs">{label}</p>
      <p className={`num mt-3 text-[26px] font-semibold leading-none md:text-[34px] ${accent ? "text-lime" : ""}`}>
        {value}
        <span className="ml-1 text-sm font-normal text-faint">{unit}</span>
      </p>
    </div>
  );
}
