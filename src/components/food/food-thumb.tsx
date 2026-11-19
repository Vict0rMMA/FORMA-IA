/* eslint-disable @next/next/no-img-element */
import { Coffee, Cookie, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/format";
import type { MealType } from "@/lib/types";

const ICONS: Record<MealType, typeof Sun> = { breakfast: Coffee, lunch: Sun, dinner: Moon, snack: Cookie };

export function FoodThumb({ image, meal, size = 48, className }: { image: string | null; meal: MealType; size?: number; className?: string }) {
  const Icon = ICONS[meal];
  return (
    <div className={cn("relative shrink-0 overflow-hidden rounded-[14px] border border-line bg-surface-2", className)} style={{ width: size, height: size }}>
      {image ? (
        <img src={image} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full w-full place-items-center text-faint">
          <Icon size={size * 0.38} strokeWidth={1.6} />
        </div>
      )}
    </div>
  );
}
