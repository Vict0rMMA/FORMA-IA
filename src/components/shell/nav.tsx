"use client";

import { motion } from "framer-motion";
import { Dumbbell, Home, LayoutGrid, LineChart, NotebookPen, ScanLine, Settings, Sparkles, User, UtensilsCrossed, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/format";
import { useStore } from "@/lib/store";

const MAIN = [
  { href: "/", label: "Overview", icon: LayoutGrid },
  { href: "/diario", label: "Alimentación", icon: UtensilsCrossed },
  { href: "/progreso", label: "Progreso", icon: LineChart },
  { href: "/entrenamiento", label: "Entrenamientos", icon: Dumbbell },
  { href: "/coach", label: "AI Coach", icon: Sparkles },
];

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path.startsWith(href));

export function Sidebar() {
  const path = usePathname();
  const { data } = useStore();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col border-r border-line bg-bg px-4 py-6 md:flex">
      <Link href="/" className="px-2">
        <Logo />
      </Link>

      <Link
        href="/escaner"
        className="mt-8 flex h-10 items-center justify-center gap-2 rounded-full bg-lime text-sm font-semibold text-lime-ink transition-transform active:scale-[0.97]"
      >
        <Plus size={16} strokeWidth={2.5} /> Analizar comida
      </Link>

      <nav className="mt-6 space-y-0.5">
        {MAIN.map((item) => (
          <NavItem key={item.href} {...item} active={isActive(path, item.href)} />
        ))}
      </nav>

      <div className="mt-auto space-y-0.5">
        <NavItem href="/perfil" label="Perfil" icon={User} active={path === "/perfil"} />
        <NavItem href="/perfil#ajustes" label="Configuración" icon={Settings} active={false} />
        <div className="mt-4 flex items-center gap-3 border-t border-line px-2 pt-4">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-surface-3 text-[13px] font-semibold">{data.profile.name.charAt(0)}</div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[13px] font-medium">{data.profile.name}</p>
            <p className="text-[11px] text-faint">{data.isDemo ? "Modo demo" : "Plan personal"}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof Home; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn("relative flex h-9 items-center gap-3 rounded-xl px-3 text-[13.5px] transition-colors", active ? "text-fg" : "text-muted hover:text-fg")}
    >
      {active && <motion.span layoutId="side-active" className="absolute inset-0 rounded-xl bg-surface-2" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
      <Icon size={17} strokeWidth={active ? 2.1 : 1.8} className={cn("relative", active && "text-lime")} />
      <span className="relative">{label}</span>
    </Link>
  );
}

const MOBILE = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/diario", label: "Diario", icon: NotebookPen },
  { href: "/escaner", label: "Escáner", icon: ScanLine, center: true },
  { href: "/progreso", label: "Progreso", icon: LineChart },
  { href: "/perfil", label: "Perfil", icon: User },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/85 backdrop-blur-xl md:hidden">
      <ul className="mx-auto grid h-[62px] max-w-md grid-cols-5 items-center">
        {MOBILE.map(({ href, label, icon: Icon, center }) => {
          const active = isActive(path, href);
          if (center)
            return (
              <li key={href} className="grid place-items-center">
                <Link href={href} aria-label={label} className="-mt-5 grid h-[52px] w-[52px] place-items-center rounded-[18px] bg-lime text-lime-ink transition-transform active:scale-95">
                  <Icon size={22} strokeWidth={2.2} />
                </Link>
              </li>
            );
          return (
            <li key={href}>
              <Link href={href} className={cn("flex flex-col items-center gap-1 py-1 text-[10.5px] transition-colors", active ? "text-fg" : "text-faint")}>
                <Icon size={21} strokeWidth={active ? 2.1 : 1.7} className={active ? "text-lime" : undefined} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
