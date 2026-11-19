import { addDays, startOfWeek, todayKey } from "./dates";
import { FOOD_DB } from "./food-db";
import { uid } from "./format";
import type { AppData, DailyLog, FoodEntry, FoodItem, MealType, Profile, WeightLog, Workout } from "./types";
import { TEMPLATES, buildExercise } from "./workouts";
import { workoutKcal } from "./nutrition";

export const DEFAULT_PROFILE: Profile = {
  name: "Víctor",
  age: 21,
  heightCm: 184,
  weightKg: 87,
  targetWeightKg: 80,
  sex: "male",
  activity: "moderate",
  goal: "lose",
  workoutsPerWeek: 4,
  waterGoalMl: 2500,
  stepsGoal: 8000,
  calorieOverride: null,
};

export function emptyData(profile: Profile = DEFAULT_PROFILE): AppData {
  return { profile, foods: [], weights: [], workouts: [], daily: {}, photos: [], isDemo: false };
}

/** Generador pseudoaleatorio con semilla para que la demo sea estable. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const item = (name: string, grams: number): FoodItem => {
  const ref = FOOD_DB.find((f) => f.name === name);
  if (!ref) throw new Error(`Alimento demo desconocido: ${name}`);
  return { id: uid(), name: ref.name, grams, per100: ref.per100 };
};

const MEALS: Record<MealType, { title: string; items: [string, number][] }[]> = {
  breakfast: [
    { title: "Huevos, arepa y café", items: [["Huevo", 100], ["Arepa de maíz", 80], ["Café con leche", 240]] },
    { title: "Avena con banano y whey", items: [["Avena en hojuelas", 50], ["Banano", 120], ["Proteína whey", 30]] },
    { title: "Yogur griego con granola y fresas", items: [["Yogur griego natural", 200], ["Granola", 40], ["Fresas", 100]] },
  ],
  lunch: [
    { title: "Pollo, arroz y ensalada", items: [["Pollo a la plancha", 180], ["Arroz blanco", 150], ["Aguacate", 50], ["Ensalada verde", 100]] },
    { title: "Carne, frijoles y maduro", items: [["Carne de res magra", 150], ["Frijoles", 150], ["Arroz blanco", 120], ["Plátano maduro", 80]] },
    { title: "Salmón con quinoa y brócoli", items: [["Salmón", 150], ["Quinoa", 150], ["Brócoli", 120]] },
  ],
  dinner: [
    { title: "Tilapia con papa y ensalada", items: [["Tilapia", 180], ["Papa cocida", 200], ["Ensalada verde", 120]] },
    { title: "Wrap de pollo", items: [["Tortilla de trigo", 60], ["Pollo a la plancha", 140], ["Aguacate", 40], ["Tomate", 60]] },
    { title: "Pasta con carne molida", items: [["Pasta cocida", 200], ["Carne molida", 120], ["Tomate", 80]] },
  ],
  snack: [
    { title: "Batido de proteína", items: [["Proteína whey", 30], ["Leche entera", 250]] },
    { title: "Manzana y mantequilla de maní", items: [["Manzana", 180], ["Mantequilla de maní", 20]] },
    { title: "Yogur griego y fresas", items: [["Yogur griego 0%", 170], ["Fresas", 120]] },
  ],
};

export function createDemoData(): AppData {
  const r = rng(42);
  const today = todayKey();
  const foods: FoodEntry[] = [];

  const addMeal = (date: string, meal: MealType, idx: number, hour: number) => {
    const m = MEALS[meal][idx % MEALS[meal].length];
    foods.push({
      id: uid(),
      date,
      meal,
      title: m.title,
      items: m.items.map(([n, g]) => item(n, g)),
      image: null,
      source: "demo",
      createdAt: `${date}T${String(hour).padStart(2, "0")}:00:00`,
    });
  };

  for (let d = 13; d >= 1; d--) {
    const date = addDays(today, -d);
    addMeal(date, "breakfast", d, 8);
    addMeal(date, "lunch", d + 1, 13);
    addMeal(date, "dinner", d + 2, 20);
    if (d % 2 === 0) addMeal(date, "snack", d, 17);
  }
  addMeal(today, "breakfast", 0, 8);
  addMeal(today, "lunch", 0, 13);
  addMeal(today, "snack", 2, 16);

  // Peso: ~120 días bajando de 89,8 a ~87 kg con ruido diario.
  const weights: WeightLog[] = [];
  const days = 120;
  for (let i = days; i >= 0; i--) {
    if (i > 7 && r() < 0.25) continue; // días sin pesarse
    const t = (days - i) / days;
    const trend = 89.8 - 2.8 * (1 - Math.pow(1 - t, 1.4));
    const kg = Math.round((trend + (r() - 0.5) * 0.9) * 10) / 10;
    weights.push({ id: uid(), date: addDays(today, -i), kg });
  }
  weights[weights.length - 1].kg = 87.0;

  // Entrenamientos: 4 por semana durante 5 semanas con progresión de cargas.
  const workouts: Workout[] = [];
  const plan = [0, 1, 3, 4]; // lun, mar, jue, vie
  const thisMonday = startOfWeek(today);
  for (let w = 5; w >= 0; w--) {
    const monday = addDays(thisMonday, -7 * w);
    plan.forEach((dow, k) => {
      const date = addDays(monday, dow);
      if (date > today) return;
      const tpl = TEMPLATES[k % TEMPLATES.length];
      const progress = (5 - w) * 1.25;
      const minutes = Math.round(52 + r() * 22);
      workouts.push({
        id: uid(),
        date,
        name: tpl.name,
        startedAt: `${date}T18:00:00`,
        durationMin: minutes,
        kcal: workoutKcal(87, minutes),
        exercises: tpl.exercises.map(([n, wt, reps]) => buildExercise(n, wt > 0 ? Math.round((wt + progress) * 2) / 2 : 0, reps, 3 + (r() < 0.4 ? 1 : 0), true)),
        finished: true,
        notes: "",
      });
    });
  }

  const daily: Record<string, DailyLog> = {};
  for (let d = 13; d >= 0; d--) {
    const date = addDays(today, -d);
    daily[date] = {
      date,
      waterMl: d === 0 ? 1500 : Math.round((1750 + r() * 1100) / 250) * 250,
      steps: d === 0 ? 6420 : Math.round(5200 + r() * 6000),
    };
  }

  return { profile: { ...DEFAULT_PROFILE }, foods, weights, workouts, daily, photos: [], isDemo: true };
}
