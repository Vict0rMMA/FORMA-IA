"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { cn, n0 } from "@/lib/format";

/** Número que se anima hasta su valor (formato es-CO). */
export function AnimatedNumber({ value, format = n0, className }: { value: number; format?: (n: number) => string; className?: string }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(reduce ? value : 0);
  const [text, setText] = useState(format(reduce ? value : 0));
  useEffect(() => {
    const controls = animate(mv, value, { duration: reduce ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] });
    const unsub = mv.on("change", (v) => setText(format(v)));
    return () => {
      controls.stop();
      unsub();
    };
  }, [value, mv, format, reduce]);
  return <span className={cn("num", className)}>{text}</span>;
}

/** Barra fina animada. */
export function Bar({ value, max, color = "var(--color-lime)", className, delay = 0 }: { value: number; max: number; color?: string; className?: string; delay?: number }) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]", className)}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: color, transformOrigin: "left" }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: pct }}
        transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

/** Anillo de progreso SVG. Si se pasa del objetivo, el exceso se dibuja en blanco por encima. */
export function Ring({
  value,
  max,
  size = 240,
  stroke = 14,
  color = "var(--color-lime)",
  track = "rgb(255 255 255 / 0.06)",
  ticks = false,
  children,
}: {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  ticks?: boolean;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2 - (ticks ? 10 : 0);
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? value / max : 0;
  const main = Math.min(1, pct);
  const over = Math.min(1, Math.max(0, pct - 1));
  const progress = useMotionValue(0);
  const dash = useTransform(progress, (p) => c * (1 - p));
  useEffect(() => {
    const ctl = animate(progress, main, { duration: 0.7, ease: [0.22, 1, 0.36, 1] });
    return () => ctl.stop();
  }, [main, progress]);

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        {ticks &&
          Array.from({ length: 72 }, (_, i) => {
            const a = (i / 72) * Math.PI * 2;
            const r1 = size / 2 - 2;
            const r2 = size / 2 - (i % 6 === 0 ? 8 : 5);
            const lit = i / 72 < main;
            return (
              <line
                key={i}
                x1={size / 2 + r1 * Math.cos(a)}
                y1={size / 2 + r1 * Math.sin(a)}
                x2={size / 2 + r2 * Math.cos(a)}
                y2={size / 2 + r2 * Math.sin(a)}
                stroke={lit ? "rgb(198 243 107 / 0.55)" : "rgb(255 255 255 / 0.08)"}
                strokeWidth={1}
                style={{ transition: `stroke 400ms ${i * 8}ms` }}
              />
            );
          })}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          style={{ strokeDashoffset: dash }}
        />
        {over > 0 && (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#f4f4f5"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c * (1 - over) }}
            transition={{ duration: 0.4, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}
