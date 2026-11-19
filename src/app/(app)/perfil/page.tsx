"use client";

import { ChevronRight, Database, Dumbbell, LogOut, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Pill, Segmented, Stepper } from "@/components/ui/controls";
import { PageHeader, SectionTitle, Surface } from "@/components/ui/layout";
import { cn, n0, n1 } from "@/lib/format";
import { ACTIVITY_LABELS, GOAL_LABELS, bmi, bmr, computeTargets, tdee } from "@/lib/nutrition";
import { useStore } from "@/lib/store";
import { todayKey } from "@/lib/dates";
import type { ActivityLevel, Goal, Profile } from "@/lib/types";

export default function ProfilePage() {
  const store = useStore();
  const { data, updateProfile, logWeight } = store;
  const [draft, setDraft] = useState<Profile>(data.profile);
  const [provider, setProvider] = useState<string | null>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(data.profile);

  useEffect(() => setDraft(data.profile), [data.profile]);
  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((j) => setProvider(j.provider))
      .catch(() => setProvider(null));
  }, []);

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const preview = computeTargets(draft);

  const save = () => {
    if (draft.weightKg !== data.profile.weightKg) logWeight(todayKey(), draft.weightKg);
    updateProfile(draft);
    toast.success("Perfil actualizado", { description: `Nuevo objetivo: ${n0(preview.kcal)} kcal` });
  };

  return (
    <>
      <PageHeader title="Perfil" subtitle="Tus datos definen tus objetivos de calorías y macros." />

      {/* Tarjeta de perfil */}
      <Surface className="overflow-hidden">
        <div className="flex items-center gap-4 p-5 md:p-7">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-lime text-xl font-semibold text-lime-ink">{draft.name.charAt(0) || "?"}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[20px] font-semibold tracking-tight">{draft.name}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Pill tone="lime">{GOAL_LABELS[draft.goal].short}</Pill>
              <Pill>{ACTIVITY_LABELS[draft.activity].label}</Pill>
              <Pill>{draft.workoutsPerWeek} entrenos/sem</Pill>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-px border-t border-line bg-line md:grid-cols-4">
          <Metric label="IMC" value={n1(bmi(draft))} />
          <Metric label="Metabolismo basal" value={n0(bmr(draft))} unit="kcal" />
          <Metric label="Gasto diario" value={n0(tdee(draft))} unit="kcal" />
          <Metric label="Objetivo" value={n0(preview.kcal)} unit="kcal" accent />
        </div>
        <div className="grid grid-cols-3 gap-px border-t border-line bg-line">
          <Metric label="Proteína" value={n0(preview.protein)} unit="g" />
          <Metric label="Carbohidratos" value={n0(preview.carbs)} unit="g" />
          <Metric label="Grasas" value={n0(preview.fat)} unit="g" />
        </div>
      </Surface>

      {/* Datos */}
      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section className="space-y-5">
          <SectionTitle>Datos físicos</SectionTitle>
          <Field label="Nombre">
            <Input value={draft.name} onChange={(e) => set("name", e.target.value)} maxLength={40} />
          </Field>
          <Field label="Sexo">
            <Segmented
              value={draft.sex}
              onChange={(v) => set("sex", v)}
              options={[
                { value: "male", label: "Hombre" },
                { value: "female", label: "Mujer" },
              ]}
              className="flex w-full"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Edad">
              <Stepper value={draft.age} onChange={(v) => set("age", v)} min={14} max={99} suffix="años" />
            </Field>
            <Field label="Estatura">
              <Stepper value={draft.heightCm} onChange={(v) => set("heightCm", v)} min={120} max={230} suffix="cm" />
            </Field>
            <Field label="Peso actual">
              <Stepper value={draft.weightKg} onChange={(v) => set("weightKg", v)} step={0.1} min={30} max={300} suffix="kg" />
            </Field>
            <Field label="Peso objetivo">
              <Stepper value={draft.targetWeightKg} onChange={(v) => set("targetWeightKg", v)} step={0.5} min={30} max={300} suffix="kg" />
            </Field>
          </div>
        </section>

        <section className="space-y-5">
          <SectionTitle>Objetivo y actividad</SectionTitle>
          <Field label="Objetivo">
            <Segmented value={draft.goal} onChange={(v: Goal) => set("goal", v)} options={(Object.keys(GOAL_LABELS) as Goal[]).map((g) => ({ value: g, label: GOAL_LABELS[g].short }))} className="flex w-full" />
          </Field>
          <Field label="Actividad física">
            <div className="space-y-1.5">
              {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((a) => (
                <button
                  key={a}
                  onClick={() => set("activity", a)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-left transition-colors",
                    draft.activity === a ? "border-lime/40 bg-lime-soft" : "border-line hover:bg-surface",
                  )}
                >
                  <span className="text-sm font-medium">{ACTIVITY_LABELS[a].label}</span>
                  <span className="text-[12px] text-muted">{ACTIVITY_LABELS[a].hint}</span>
                </button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Entrenos por semana">
              <Stepper value={draft.workoutsPerWeek} onChange={(v) => set("workoutsPerWeek", v)} min={0} max={14} />
            </Field>
            <Field label="Meta de agua">
              <Stepper value={draft.waterGoalMl} onChange={(v) => set("waterGoalMl", v)} step={250} min={500} max={8000} suffix="ml" />
            </Field>
          </div>
          <Field label="Calorías personalizadas" hint="Déjalo en 0 para usar el cálculo automático (Mifflin-St Jeor).">
            <Stepper value={draft.calorieOverride ?? 0} onChange={(v) => set("calorieOverride", v > 0 ? v : null)} step={50} min={0} max={6000} suffix="kcal" />
          </Field>
        </section>
      </div>

      <div className={cn("sticky bottom-[84px] z-20 mt-8 flex justify-end transition-opacity md:bottom-6", dirty ? "opacity-100" : "pointer-events-none opacity-0")}>
        <div className="flex items-center gap-2 rounded-full border border-line-strong bg-surface-2/95 p-1.5 pl-4 backdrop-blur-xl">
          <span className="text-[13px] text-muted">Cambios sin guardar</span>
          <Button variant="ghost" size="sm" onClick={() => setDraft(data.profile)}>
            Descartar
          </Button>
          <Button variant="primary" size="sm" onClick={save}>
            Guardar
          </Button>
        </div>
      </div>

      {/* Accesos (útil en móvil) */}
      <section className="mt-10 md:hidden">
        <SectionTitle>Más</SectionTitle>
        <div className="divide-y divide-line rounded-[22px] border border-line bg-surface">
          <LinkRow href="/entrenamiento" icon={<Dumbbell size={16} />} label="Entrenamientos" />
          <LinkRow href="/coach" icon={<Sparkles size={16} />} label="AI Coach" />
        </div>
      </section>

      {/* Configuración */}
      <section id="ajustes" className="mt-12 scroll-mt-8">
        <SectionTitle>Configuración</SectionTitle>
        <div className="divide-y divide-line rounded-[22px] border border-line bg-surface">
          <Row
            icon={<Database size={16} />}
            title="Almacenamiento"
            text={store.mode === "cloud" ? `En la nube (Firebase) · ${store.userEmail ?? "sesión activa"}` : "Local en este navegador (IndexedDB). Configura Firebase para sincronizar entre dispositivos."}
          />
          <Row
            icon={<Sparkles size={16} />}
            title="Inteligencia artificial"
            text={
              provider === "anthropic"
                ? "Claude (Anthropic) activo"
                : provider === "gemini"
                  ? "Gemini (Google) activo"
                  : provider === "demo"
                    ? "Modo demo: añade ANTHROPIC_API_KEY o GEMINI_API_KEY en .env.local"
                    : "Comprobando…"
            }
          />
          {data.isDemo && (
            <Row
              icon={<Trash2 size={16} />}
              title="Empezar con mis datos"
              text="Borra comidas, pesos y entrenamientos de demostración. Tu perfil se mantiene."
              action={
                <Button
                  size="sm"
                  variant="primary"
                  onClick={async () => {
                    if (!confirm("¿Borrar los datos de demostración?")) return;
                    await store.clearDemo();
                    toast.success("Listo. Empieza a registrar tus datos.");
                  }}
                >
                  Empezar
                </Button>
              }
            />
          )}
          {!data.isDemo && store.mode === "local" && (
            <Row
              icon={<RefreshCw size={16} />}
              title="Cargar datos de demostración"
              text="Reemplaza tus registros locales por datos de ejemplo."
              action={
                <Button size="sm" onClick={() => confirm("Esto reemplaza tus registros locales. ¿Continuar?") && store.loadDemo()}>
                  Cargar
                </Button>
              }
            />
          )}
          {!data.isDemo && (
            <Row
              icon={<Trash2 size={16} />}
              title="Borrar registros"
              text="Elimina todas las comidas, pesos, entrenamientos y fotos."
              action={
                <Button size="sm" variant="danger" onClick={async () => confirm("Esta acción no se puede deshacer. ¿Borrar todo?") && (await store.clearDemo(), toast.success("Registros borrados"))}>
                  Borrar
                </Button>
              }
            />
          )}
          {store.mode === "cloud" && (
            <Row
              icon={<LogOut size={16} />}
              title="Cerrar sesión"
              action={
                <Button size="sm" onClick={() => store.signOut()}>
                  Salir
                </Button>
              }
            />
          )}
        </div>
      </section>
    </>
  );
}

function Metric({ label, value, unit, accent }: { label: string; value: string; unit?: string; accent?: boolean }) {
  return (
    <div className="bg-surface px-5 py-4">
      <p className="text-[11px] text-muted">{label}</p>
      <p className={cn("num mt-1 text-[20px] font-semibold", accent && "text-lime")}>
        {value}
        {unit && <span className="ml-1 text-[12px] font-normal text-faint">{unit}</span>}
      </p>
    </div>
  );
}

function Row({ icon, title, text, action }: { icon: React.ReactNode; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <span className="text-muted">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        {text && <p className="mt-0.5 text-[12.5px] text-muted">{text}</p>}
      </div>
      {action}
    </div>
  );
}

function LinkRow({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-4 px-5 py-4">
      <span className="text-muted">{icon}</span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronRight size={16} className="text-faint" />
    </Link>
  );
}
