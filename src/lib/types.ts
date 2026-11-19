export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Goal = "lose" | "maintain" | "gain";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type Pose = "front" | "side" | "back";
export type MuscleGroup =
  | "pecho"
  | "espalda"
  | "piernas"
  | "hombros"
  | "brazos"
  | "core"
  | "gluteos"
  | "cardio";

export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Profile {
  name: string;
  age: number;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  sex: Sex;
  activity: ActivityLevel;
  goal: Goal;
  workoutsPerWeek: number;
  waterGoalMl: number;
  stepsGoal: number;
  /** Si existe, reemplaza el objetivo calórico calculado. */
  calorieOverride: number | null;
}

/** Un alimento dentro de una comida. Los valores nutricionales van por 100 g para poder reescalar la porción. */
export interface FoodItem {
  id: string;
  name: string;
  grams: number;
  per100: Macros;
}

export interface FoodEntry {
  id: string;
  date: string; // YYYY-MM-DD
  meal: MealType;
  title: string;
  items: FoodItem[];
  image: string | null;
  source: "ai" | "manual" | "demo";
  createdAt: string;
}

export interface WeightLog {
  id: string;
  date: string;
  kg: number;
}

export interface SetEntry {
  id: string;
  reps: number;
  weight: number;
  done: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  muscle: MuscleGroup;
  restSec: number;
  sets: SetEntry[];
}

export interface Workout {
  id: string;
  date: string;
  name: string;
  startedAt: string | null;
  durationMin: number;
  kcal: number;
  exercises: Exercise[];
  finished: boolean;
  notes: string;
}

export interface DailyLog {
  date: string;
  waterMl: number;
  steps: number;
}

export interface ProgressPhoto {
  id: string;
  date: string;
  pose: Pose;
  image: string;
}

export interface AppData {
  profile: Profile;
  foods: FoodEntry[];
  weights: WeightLog[];
  workouts: Workout[];
  daily: Record<string, DailyLog>;
  photos: ProgressPhoto[];
  isDemo: boolean;
}

/* ---------- IA ---------- */

export interface AnalyzedItem {
  name: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface AnalyzeResponse {
  title: string;
  items: AnalyzedItem[];
  confidence: "alta" | "media" | "baja";
  notes: string;
  /** "demo" cuando no hay API key configurada. */
  provider: "anthropic" | "gemini" | "demo";
}

export interface CoachCard {
  title: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  note?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  cards?: CoachCard[];
  suggestions?: string[];
  provider?: AnalyzeResponse["provider"];
  createdAt: string;
}

export interface CoachContext {
  today: string;
  profile: Profile;
  targets: Macros;
  consumedToday: Macros;
  mealsToday: { meal: MealType; title: string; kcal: number; protein: number }[];
  waterMl: number;
  weights: { date: string; kg: number }[];
  workoutsThisWeek: { date: string; name: string; durationMin: number }[];
}
