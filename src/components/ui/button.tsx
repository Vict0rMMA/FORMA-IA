"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/format";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary: "bg-lime text-lime-ink hover:bg-[#d2f784] font-semibold",
  secondary: "bg-surface-2 text-fg border border-line-strong hover:bg-surface-3",
  ghost: "text-muted hover:text-fg hover:bg-white/[0.04]",
  danger: "text-danger hover:bg-danger/10",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-full",
  md: "h-10 px-4 text-sm gap-2 rounded-full",
  lg: "h-12 px-6 text-[15px] gap-2 rounded-full",
  icon: "h-9 w-9 rounded-full",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", className, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap transition-[background-color,color,transform,opacity] duration-150 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
});
