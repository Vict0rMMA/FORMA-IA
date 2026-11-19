/* eslint-disable @next/next/no-img-element */
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/format";

const STEPS = ["Identificando alimentos…", "Estimando porciones…", "Calculando información nutricional…", "Analizando ingredientes…"];

/**
 * Animación de análisis. Avanza por pasos mientras la petición sigue en curso
 * y, en cuanto llega el resultado (`done`), completa todo de inmediato.
 */
export function Analyzing({ image, text, done }: { image: string | null; text: string | null; done: boolean }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (done) {
      setStep(STEPS.length);
      return;
    }
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 1300);
    return () => clearInterval(t);
  }, [done]);

  return (
    <div className="mx-auto max-w-md">
      <div className="relative overflow-hidden rounded-[28px] border border-line bg-surface">
        {image ? (
          <img src={image} alt="Comida a analizar" className="aspect-[4/3] w-full object-cover" />
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center p-8">
            <p className="text-center text-xl font-medium leading-snug tracking-tight text-muted">“{text}”</p>
          </div>
        )}
        {!done && (
          <>
            <div className="absolute inset-0 bg-black/25" />
            <motion.div
              className="absolute inset-x-0 h-24"
              style={{ background: "linear-gradient(to bottom, transparent, rgb(198 243 107 / 0.18) 85%, rgb(198 243 107 / 0.9) 100%)" }}
              initial={{ top: "-25%" }}
              animate={{ top: ["-25%", "100%"] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
            />
          </>
        )}
      </div>

      <ul className="mt-8 space-y-3.5 px-1">
        {STEPS.map((label, i) => {
          const state = i < step ? "done" : i === step ? "active" : "idle";
          return (
            <motion.li
              key={label}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: state === "idle" ? 0.35 : 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3"
            >
              <span className={cn("grid h-5 w-5 place-items-center rounded-full", state === "done" ? "bg-lime text-lime-ink" : "bg-surface-3 text-muted")}>
                <AnimatePresence mode="wait" initial={false}>
                  {state === "done" ? (
                    <motion.span key="c" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <Check size={12} strokeWidth={3} />
                    </motion.span>
                  ) : state === "active" ? (
                    <Loader2 key="l" size={12} className="animate-spin" />
                  ) : null}
                </AnimatePresence>
              </span>
              <span className={cn("text-[15px]", state === "active" ? "text-fg" : "text-muted")}>{label}</span>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
