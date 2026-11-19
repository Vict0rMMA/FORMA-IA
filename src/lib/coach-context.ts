import { addDays, startOfWeek, todayKey } from "./dates";
import { dayMacros, entryMacros } from "./nutrition";
import type { AppData, CoachContext, Macros } from "./types";

const r = (m: Macros): Macros => ({ kcal: Math.round(m.kcal), protein: Math.round(m.protein), carbs: Math.round(m.carbs), fat: Math.round(m.fat) });

/** Resumen compacto de los datos del usuario que se envía al AI Coach. */
export function buildCoachContext(data: AppData, targets: Macros): CoachContext {
  const today = todayKey();
  const since = addDays(today, -90);
  const weights = data.weights.filter((w) => w.date >= since).sort((a, b) => a.date.localeCompare(b.date));
  // Muestreo para no enviar 90 puntos: ~1 por semana + el último.
  const sampled = weights.filter((_, i) => i % 7 === 0 || i === weights.length - 1).map((w) => ({ date: w.date, kg: w.kg }));
  const week = startOfWeek(today);
  return {
    today,
    profile: data.profile,
    targets,
    consumedToday: r(dayMacros(data.foods, today)),
    mealsToday: data.foods
      .filter((f) => f.date === today)
      .map((f) => {
        const m = entryMacros(f);
        return { meal: f.meal, title: f.title, kcal: Math.round(m.kcal), protein: Math.round(m.protein) };
      }),
    waterMl: data.daily[today]?.waterMl ?? 0,
    weights: sampled,
    workoutsThisWeek: data.workouts.filter((w) => w.finished && w.date >= week).map((w) => ({ date: w.date, name: w.name, durationMin: w.durationMin })),
  };
}
