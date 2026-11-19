"use client";

import { FlaskConical } from "lucide-react";
import Link from "next/link";
import { useStore } from "@/lib/store";

/** Aviso discreto: los datos que se ven son de demostración. */
export function DemoBanner() {
  const { data } = useStore();
  if (!data.isDemo) return null;
  return (
    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-2.5 text-[13px] md:mb-8">
      <FlaskConical size={15} className="shrink-0 text-lime" />
      <p className="min-w-0 flex-1 text-muted">
        <span className="text-fg">Datos de demostración.</span> Explora la app libremente; cuando quieras, empieza con tus datos reales.
      </p>
      <Link href="/perfil#ajustes" className="shrink-0 font-medium text-lime hover:underline">
        Empezar
      </Link>
    </div>
  );
}
