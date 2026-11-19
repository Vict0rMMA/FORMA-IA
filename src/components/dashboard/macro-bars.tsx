"use client";

import { Bar } from "@/components/ui/progress";
import { n0 } from "@/lib/format";
import type { Macros } from "@/lib/types";

export const MACRO_META = [
  { key: "protein", label: "Proteína", color: "var(--color-lime)" },
  { key: "carbs", label: "Carbohidratos", color: "var(--color-carbs)" },
  { key: "fat", label: "Grasas", color: "var(--color-fat)" },
] as const;

export function MacroBars({ consumed, targets }: { consumed: Macros; targets: Macros }) {
  return (
    <div className="space-y-6">
      {MACRO_META.map((m, i) => {
        const value = consumed[m.key];
        const target = targets[m.key];
        const left = target - value;
        return (
          <div key={m.key}>
            <div className="mb-2.5 flex items-baseline justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.color }} />
                <span className="label-xs">{m.label}</span>
              </div>
              <p className="num text-[15px]">
                <span className="font-semibold">{n0(value)}</span>
                <span className="text-faint"> / {n0(target)} g</span>
              </p>
            </div>
            <Bar value={value} max={target} color={m.color} delay={0.15 + i * 0.08} />
            <p className="mt-2 text-[12px] text-faint">{left >= 0 ? `${n0(left)} g restantes` : `${n0(-left)} g por encima`}</p>
          </div>
        );
      })}
    </div>
  );
}
