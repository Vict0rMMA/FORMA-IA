"use client";

import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/format";

/** Control segmentado con indicador animado. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode }[];
  className?: string;
  size?: "sm" | "md";
}) {
  const id = useId();
  return (
    <div className={cn("inline-flex rounded-full border border-line bg-surface p-1", className)} role="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative flex-1 whitespace-nowrap rounded-full font-medium transition-colors",
              size === "sm" ? "h-7 px-3 text-xs" : "h-8 px-3.5 text-[13px]",
              active ? "text-fg" : "text-muted hover:text-fg",
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-full bg-surface-3"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Número con botones − / + grandes (pensado para el gimnasio). */
export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 9999,
  suffix,
  className,
  compact,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  className?: string;
  compact?: boolean;
}) {
  const set = (v: number) => onChange(Math.min(max, Math.max(min, Math.round(v * 100) / 100)));
  return (
    <div className={cn("flex items-center rounded-full border border-line bg-surface-2", compact ? "h-8" : "h-10", className)}>
      <button type="button" onClick={() => set(value - step)} className={cn("grid shrink-0 place-items-center text-muted hover:text-fg", compact ? "w-7" : "w-9")} aria-label="Restar">
        <Minus size={compact ? 13 : 15} />
      </button>
      <div className="flex min-w-0 flex-1 items-baseline justify-center">
        <input
          type="number"
          inputMode="decimal"
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => set(parseFloat(e.target.value) || 0)}
          onFocus={(e) => e.target.select()}
          className="num w-full min-w-0 bg-transparent text-center font-medium outline-none"
        />
        {suffix && <span className="-ml-1 pr-1 text-xs text-faint">{suffix}</span>}
      </div>
      <button type="button" onClick={() => set(value + step)} className={cn("grid shrink-0 place-items-center text-muted hover:text-fg", compact ? "w-7" : "w-9")} aria-label="Sumar">
        <Plus size={compact ? 13 : 15} />
      </button>
    </div>
  );
}

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block space-y-2", className)}>
      <span className="label-xs">{label}</span>
      {children}
      {hint && <span className="block text-xs text-faint">{hint}</span>}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-line bg-surface-2 px-3.5 text-fg outline-none transition-colors placeholder:text-faint focus:border-lime/40",
        className,
      )}
      {...props}
    />
  );
}

export function Pill({ children, tone = "default", className }: { children: ReactNode; tone?: "default" | "lime"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        tone === "lime" ? "bg-lime-soft text-lime" : "bg-white/[0.06] text-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}
