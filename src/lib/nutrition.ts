import type { ActivityLevel, FoodEntry, FoodItem, Goal, Macros, MealType, Profile } from "./types";

export const ACTIVITY_LABELS: Record<ActivityLevel, { label: string; hint: string; factor: number }> = {
  sedentary: { label: "Sedentario", hint: "Trabajo de escritorio, poco movimiento", factor: 1.2 },
  light: { label: "Ligero", hint: "1–3 entrenos por semana", factor: 1.375 },
  moderate: { label: "Moderado", hint: "3–5 entrenos por semana", factor: 1.55 },
  active: { label: "Activo", hint: "6–7 entrenos por semana", factor: 1.725 },
  very_active: { label: "Muy activo", hint: "Trabajo físico o doble sesión", factor: 1.9 },
};

export const GOAL_LABELS: Record<Goal, { label: string; short: string }> = {
  lose: { label: "Perder grasa", short: "Definición" },
  maintain: { label: "Mantener peso", short: "Mantenimiento" },
  gain: { label: "Ganar músculo", short: "Volumen" },
};

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Desayuno",
  lunch: "Almuerzo",
  dinner: "Cena",
  snack: "Snacks",
};

export const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export const ZERO: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

/** Mifflin-St Jeor. */
export function bmr(p: Profile): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return base + (p.sex === "male" ? 5 : -161);
}

export function tdee(p: Profile): number {
  return bmr(p) * ACTIVITY_LABELS[p.activity].factor;
}

export function bmi(p: Profile): number {
  const m = p.heightCm / 100;
  return p.weightKg / (m * m);
}

const round10 = (n: number) => Math.round(n / 10) * 10;

/** Objetivo diario de calorías y macros según el perfil. */
export function computeTargets(p: Profile): Macros {
  const maintenance = tdee(p);
  const factor = p.goal === "lose" ? 0.8 : p.goal === "gain" ? 1.1 : 1;
  const kcal = p.calorieOverride && p.calorieOverride > 800 ? p.calorieOverride : round10(Math.max(maintenance * factor, bmr(p) * 1.05));

  const proteinPerKg = p.goal === "lose" ? 2 : 1.8;
  const protein = Math.round(p.weightKg * proteinPerKg);
  const fat = Math.round((kcal * (p.goal === "gain" ? 0.25 : 0.27)) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { kcal, protein, carbs, fat };
}

export function itemMacros(item: FoodItem): Macros {
  const f = item.grams / 100;
  return {
    kcal: item.per100.kcal * f,
    protein: item.per100.protein * f,
    carbs: item.per100.carbs * f,
    fat: item.per100.fat * f,
  };
}

export function addMacros(a: Macros, b: Macros): Macros {
  return { kcal: a.kcal + b.kcal, protein: a.protein + b.protein, carbs: a.carbs + b.carbs, fat: a.fat + b.fat };
}

export function itemsMacros(items: FoodItem[]): Macros {
  return items.map(itemMacros).reduce(addMacros, ZERO);
}

export function entryMacros(e: FoodEntry): Macros {
  return itemsMacros(e.items);
}

export function dayMacros(foods: FoodEntry[], date: string): Macros {
  return foods.filter((f) => f.date === date).map(entryMacros).reduce(addMacros, ZERO);
}

/** Convierte valores absolutos de una porción a valores por 100 g. */
export function toPer100(grams: number, m: Macros): Macros {
  const g = grams > 0 ? grams : 100;
  const k = 100 / g;
  return { kcal: m.kcal * k, protein: m.protein * k, carbs: m.carbs * k, fat: m.fat * k };
}

/** Comida sugerida según la hora local. */
export function mealForHour(h = new Date().getHours()): MealType {
  if (h < 11) return "breakfast";
  if (h < 16) return "lunch";
  if (h < 18) return "snack";
  return "dinner";
}

/** Gasto estimado de un entrenamiento de fuerza (MET ≈ 5). */
export function workoutKcal(weightKg: number, minutes: number): number {
  return Math.round(5 * weightKg * (minutes / 60));
}

export function stepsKcal(steps: number, weightKg: number): number {
  return Math.round(steps * 0.0005 * weightKg);
}
