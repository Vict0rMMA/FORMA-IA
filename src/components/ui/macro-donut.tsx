"use client";

import { motion } from "framer-motion";
import type { Macros } from "@/lib/types";

/** Donut pequeño con el reparto calórico de macros (P·4, C·4, G·9). */
export function MacroDonut({ m, size = 72, stroke = 9 }: { m: Macros; size?: number; stroke?: number }) {
  const parts = [
    { v: m.protein * 4, c: "var(--color-lime)" },
    { v: m.carbs * 4, c: "var(--color-carbs)" },
    { v: m.fat * 9, c: "var(--color-fat)" },
  ];
  const total = parts.reduce((a, p) => a + p.v, 0) || 1;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gap = total > 0 ? 3 : 0;
  let offset = 0;
  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(255 255 255 / 0.06)" strokeWidth={stroke} />
      {parts.map((p, i) => {
        const len = Math.max(0, (p.v / total) * c - gap);
        const el = (
          <motion.circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={p.c}
            strokeWidth={stroke}
            strokeDashoffset={-offset}
            initial={{ strokeDasharray: `0 ${c}` }}
            animate={{ strokeDasharray: `${len} ${c}` }}
            transition={{ duration: 0.8, delay: 0.1 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
          />
        );
        offset += (p.v / total) * c;
        return el;
      })}
    </svg>
  );
}
