"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { Analyzing } from "@/components/scanner/analyzing";
import { Capture } from "@/components/scanner/capture";
import { Result, type ResultState } from "@/components/scanner/result";
import { PageHeader } from "@/components/ui/layout";
import { relativeDay, todayKey } from "@/lib/dates";
import { uid } from "@/lib/format";
import { compressImage, makeThumb } from "@/lib/image";
import { MEAL_LABELS, mealForHour, toPer100 } from "@/lib/nutrition";
import { useStore } from "@/lib/store";
import type { AnalyzeResponse, MealType } from "@/lib/types";
import { authHeaders } from "@/lib/firebase/auth-headers";

type Phase = "input" | "analyzing" | "result" | "saved";

export default function ScannerPage() {
  return (
    <Suspense>
      <Scanner />
    </Suspense>
  );
}

function Scanner() {
  const params = useSearchParams();
  const router = useRouter();
  const { saveFood } = useStore();
  const date = params.get("date") ?? todayKey();
  const initialMeal = (params.get("meal") as MealType) || mealForHour();

  const [phase, setPhase] = useState<Phase>("input");
  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [meta, setMeta] = useState<Pick<AnalyzeResponse, "confidence" | "notes" | "provider">>({ confidence: "media", notes: "", provider: "demo" });
  const [result, setResult] = useState<ResultState>({ title: "", items: [], meal: initialMeal, date });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const analyze = async (payload: { image?: string; text?: string }) => {
    setDone(false);
    setPhase("analyzing");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al analizar");
      const data = json as AnalyzeResponse;
      setMeta({ confidence: data.confidence, notes: data.notes, provider: data.provider });
      setResult({
        title: data.title,
        meal: initialMeal,
        date,
        items: data.items.map((i) => ({ id: uid(), name: i.name, grams: Math.max(1, Math.round(i.grams)), per100: toPer100(i.grams, i) })),
      });
      setEditing(data.items.length === 0);
      setDone(true);
      setTimeout(() => setPhase("result"), 450);
    } catch (e) {
      toast.error("No se pudo analizar", { description: e instanceof Error ? e.message : undefined });
      setPhase("input");
    }
  };

  const onImage = async (file: Blob) => {
    try {
      const dataUrl = await compressImage(file, 1024, 0.82);
      setImage(dataUrl);
      setText(null);
      analyze({ image: dataUrl });
    } catch {
      toast.error("No pudimos leer esa imagen");
    }
  };

  const onText = (t: string) => {
    setImage(null);
    setText(t);
    analyze({ text: t });
  };

  const save = async () => {
    setSaving(true);
    const thumb = image ? await makeThumb(image).catch(() => null) : null;
    saveFood({
      id: uid(),
      date: result.date,
      meal: result.meal,
      title: result.title.trim() || "Comida",
      items: result.items,
      image: thumb,
      source: "ai",
      createdAt: new Date().toISOString(),
    });
    setPhase("saved");
    setTimeout(() => router.push(`/diario?date=${result.date}`), 1100);
  };

  const reset = () => {
    setPhase("input");
    setImage(null);
    setText(null);
    setEditing(false);
    setSaving(false);
  };

  return (
    <>
      {phase === "input" && (
        <PageHeader
          eyebrow={`${relativeDay(date)} · ${MEAL_LABELS[initialMeal]}`}
          title="Analizar comida"
          subtitle="Foto o descripción: la IA identifica los alimentos y estima porciones y macros."
        />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className={phase === "analyzing" || phase === "saved" ? "pt-6 md:pt-12" : undefined}
        >
          {phase === "input" && <Capture onImage={onImage} onText={onText} />}
          {phase === "analyzing" && <Analyzing image={image} text={text} done={done} />}
          {phase === "result" && (
            <Result
              image={image}
              meta={meta}
              state={result}
              onChange={setResult}
              editing={editing}
              onToggleEdit={() => setEditing((v) => !v)}
              onSave={save}
              onRetry={reset}
              saving={saving}
            />
          )}
          {phase === "saved" && (
            <div className="flex flex-col items-center py-16 text-center">
              <motion.div
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 380, damping: 22 }}
                className="grid h-20 w-20 place-items-center rounded-full bg-lime text-lime-ink"
              >
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: "spring", stiffness: 500, damping: 20 }}>
                  <Check size={34} strokeWidth={3} />
                </motion.span>
              </motion.div>
              <p className="mt-6 text-xl font-semibold tracking-tight">Guardado en tu diario</p>
              <p className="mt-1 text-sm text-muted">
                {MEAL_LABELS[result.meal]} · {relativeDay(result.date)}
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
