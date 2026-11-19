import type { ReactNode } from "react";
import { cn } from "@/lib/format";

export function PageHeader({ eyebrow, title, subtitle, actions }: { eyebrow?: ReactNode; title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-10">
      <div className="min-w-0">
        {eyebrow && <p className="label-xs mb-3">{eyebrow}</p>}
        <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.03em] md:text-[34px]">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[15px] text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Superficie base: un solo nivel de elevación, borde sutil, sin sombras. */
export function Surface({ children, className, as: As = "section" }: { children: ReactNode; className?: string; as?: "section" | "div" | "article" }) {
  return <As className={cn("rounded-[22px] border border-line bg-surface", className)}>{children}</As>;
}

export function SectionTitle({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-4 flex items-center justify-between gap-3", className)}>
      <h2 className="label-xs">{children}</h2>
      {action}
    </div>
  );
}

export function Empty({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl border border-line bg-surface-2 text-muted">{icon}</div>
      <p className="font-medium">{title}</p>
      {text && <p className="mt-1 max-w-xs text-sm text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
