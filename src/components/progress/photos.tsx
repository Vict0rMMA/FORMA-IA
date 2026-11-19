/* eslint-disable @next/next/no-img-element */
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Columns2, ImagePlus, Plus, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/controls";
import { Empty } from "@/components/ui/layout";
import { Sheet } from "@/components/ui/sheet";
import { formatMedium, todayKey } from "@/lib/dates";
import { compressImage } from "@/lib/image";
import { useStore } from "@/lib/store";
import type { Pose, ProgressPhoto } from "@/lib/types";

export const POSES: { value: Pose; label: string }[] = [
  { value: "front", label: "Frontal" },
  { value: "side", label: "Lateral" },
  { value: "back", label: "Posterior" },
];

export function ProgressPhotos() {
  const { data, addPhoto, deletePhoto } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [target, setTarget] = useState<{ date: string; pose: Pose }>({ date: todayKey(), pose: "front" });
  const [compare, setCompare] = useState(false);

  const groups = useMemo(() => {
    const m = new Map<string, ProgressPhoto[]>();
    [...data.photos].sort((a, b) => b.date.localeCompare(a.date)).forEach((p) => m.set(p.date, [...(m.get(p.date) ?? []), p]));
    return [...m.entries()];
  }, [data.photos]);

  const upload = (date: string, pose: Pose) => {
    setTarget({ date, pose });
    fileRef.current?.click();
  };

  const onFile = async (f?: File) => {
    if (!f) return;
    try {
      const image = await compressImage(f, 900, 0.8);
      data.photos.filter((p) => p.date === target.date && p.pose === target.pose).forEach((p) => deletePhoto(p.id));
      addPhoto({ date: target.date, pose: target.pose, image });
      toast.success("Foto guardada");
    } catch {
      toast.error("No se pudo procesar la foto");
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="label-xs">Fotografías de progreso</h2>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setCompare(true)} disabled={groups.length < 2}>
            <Columns2 size={14} /> Comparar
          </Button>
          <Button size="sm" variant="primary" onClick={() => upload(todayKey(), "front")}>
            <ImagePlus size={14} /> Subir
          </Button>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => (onFile(e.target.files?.[0]), (e.target.value = ""))} />

      {!groups.some(([d]) => d === todayKey()) && (
        <DateRow date={todayKey()} photos={[]} onAdd={upload} onDelete={deletePhoto} label="Hoy" />
      )}
      {groups.map(([date, photos]) => (
        <DateRow key={date} date={date} photos={photos} onAdd={upload} onDelete={deletePhoto} />
      ))}
      {!groups.length && <Empty icon={<ImagePlus size={18} />} title="Aún no hay fotos" text="Sube frontal, lateral y posterior cada 2–4 semanas con la misma luz y postura." />}

      <CompareSheet open={compare} onClose={() => setCompare(false)} photos={data.photos} />
    </div>
  );
}

function DateRow({ date, photos, onAdd, onDelete, label }: { date: string; photos: ProgressPhoto[]; onAdd: (d: string, p: Pose) => void; onDelete: (id: string) => void; label?: string }) {
  return (
    <div className="mb-7">
      <p className="num mb-3 text-[13px] text-muted">{label ? `${label} · ${formatMedium(date)}` : formatMedium(date)}</p>
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {POSES.map(({ value, label }) => {
          const p = photos.find((x) => x.pose === value);
          return (
            <div key={value} className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-line bg-surface">
              {p ? (
                <>
                  <img src={p.image} alt={label} className="h-full w-full object-cover" />
                  <button
                    onClick={() => onDelete(p.id)}
                    className="hover-reveal absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition-opacity hover:text-danger"
                    aria-label="Eliminar foto"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              ) : (
                <button onClick={() => onAdd(date, value)} className="grid h-full w-full place-items-center text-faint transition-colors hover:bg-surface-2 hover:text-muted">
                  <Plus size={20} />
                </button>
              )}
              <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-black/55 px-2 py-0.5 text-[10.5px] text-white/85 backdrop-blur">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompareSheet({ open, onClose, photos }: { open: boolean; onClose: () => void; photos: ProgressPhoto[] }) {
  const [pose, setPose] = useState<Pose>("front");
  const dates = useMemo(() => [...new Set(photos.filter((p) => p.pose === pose).map((p) => p.date))].sort(), [photos, pose]);
  const [a, setA] = useState<string | null>(null);
  const [b, setB] = useState<string | null>(null);
  const before = a && dates.includes(a) ? a : dates[0];
  const after = b && dates.includes(b) ? b : dates[dates.length - 1];
  const imgA = photos.find((p) => p.pose === pose && p.date === before)?.image;
  const imgB = photos.find((p) => p.pose === pose && p.date === after)?.image;

  return (
    <Sheet open={open} onClose={onClose} title="Comparar progreso" className="md:max-w-2xl">
      <div className="space-y-4">
        <Segmented value={pose} onChange={setPose} options={POSES} className="flex w-full" size="sm" />
        {dates.length < 2 ? (
          <p className="py-10 text-center text-sm text-muted">Necesitas fotos {POSES.find((p) => p.value === pose)?.label.toLowerCase()}es de al menos dos fechas.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <DateSelect value={before} dates={dates} onChange={setA} label="Antes" />
              <DateSelect value={after} dates={dates} onChange={setB} label="Después" />
            </div>
            <AnimatePresence mode="wait">
              {imgA && imgB && (
                <motion.div key={`${before}-${after}-${pose}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Slider before={imgA} after={imgB} />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </Sheet>
  );
}

function DateSelect({ value, dates, onChange, label }: { value: string; dates: string[]; onChange: (d: string) => void; label: string }) {
  return (
    <label className="block">
      <span className="label-xs">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 h-10 w-full rounded-xl border border-line bg-surface-2 px-3 outline-none">
        {dates.map((d) => (
          <option key={d} value={d}>
            {formatMedium(d)}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Comparador antes/después con divisor arrastrable. */
function Slider({ before, after }: { before: string; after: string }) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const move = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (r) setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  };
  return (
    <div
      ref={ref}
      className="relative aspect-[3/4] touch-none select-none overflow-hidden rounded-2xl bg-black md:aspect-[4/5]"
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        move(e.clientX);
      }}
      onPointerMove={(e) => e.buttons && move(e.clientX)}
    >
      <img src={after} alt="Después" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      <img src={before} alt="Antes" className="absolute inset-0 h-full w-full object-cover" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} draggable={false} />
      <div className="absolute inset-y-0 w-px bg-white/80" style={{ left: `${pos}%` }}>
        <div className="absolute top-1/2 left-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-black">
          <Columns2 size={15} />
        </div>
      </div>
      <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] text-white backdrop-blur">Antes</span>
      <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] text-white backdrop-blur">Después</span>
    </div>
  );
}
