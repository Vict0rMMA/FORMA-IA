"use client";

import { motion } from "framer-motion";
import { AnimatedNumber, Ring } from "@/components/ui/progress";
import { n0 } from "@/lib/format";
import { useMediaQuery } from "@/lib/hooks";

/** Elemento protagonista del dashboard: anillo calórico con resumen. */
export function CalorieHero({ consumed, target }: { consumed: number; target: number }) {
  const big = useMediaQuery("(min-width: 768px)");
  const remaining = target - consumed;
  const over = remaining < 0;

  return (
    <div className="flex flex-col items-center">
      <Ring value={consumed} max={target} size={big ? 288 : 248} stroke={big ? 14 : 12} ticks>
        <div className="text-center">
          <AnimatedNumber value={consumed} className="block text-[52px] font-semibold leading-none md:text-[60px]" />
          <p className="label-xs mt-3">Calorías consumidas</p>
          <p className="mt-3 text-[13px] text-muted">
            Objetivo <span className="num text-fg">{n0(target)}</span> kcal
          </p>
        </div>
      </Ring>

      <motion.div
        className="mt-8 grid w-full max-w-sm grid-cols-3 divide-x divide-line"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
      >
        <Stat label="Consumidas" value={consumed} />
        <Stat label={over ? "Exceso" : "Restantes"} value={Math.abs(remaining)} accent={!over} />
        <Stat label="Objetivo" value={target} />
      </motion.div>
    </div>
  );
}

function Stat({ label, value, accent, prefix }: { label: string; value: number; accent?: boolean; prefix?: string }) {
  return (
    <div className="px-2 text-center">
      <p className={`num text-[22px] font-semibold ${accent ? "text-lime" : ""}`}>
        {prefix && value > 0 ? prefix : ""}
        {n0(value)}
      </p>
      <p className="mt-1 text-[11px] text-muted">{label}</p>
    </div>
  );
}
