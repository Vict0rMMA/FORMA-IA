import { uid } from "./format";
import type { Exercise, MuscleGroup, Workout } from "./types";

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  pecho: "Pecho",
  espalda: "Espalda",
  piernas: "Piernas",
  hombros: "Hombros",
  brazos: "Brazos",
  core: "Core",
  gluteos: "Glúteos",
  cardio: "Cardio",
};

export const EXERCISE_LIBRARY: { name: string; muscle: MuscleGroup }[] = [
  { name: "Press de banca", muscle: "pecho" },
  { name: "Press inclinado con mancuernas", muscle: "pecho" },
  { name: "Aperturas en polea", muscle: "pecho" },
  { name: "Fondos", muscle: "pecho" },
  { name: "Dominadas", muscle: "espalda" },
  { name: "Remo con barra", muscle: "espalda" },
  { name: "Jalón al pecho", muscle: "espalda" },
  { name: "Remo en polea baja", muscle: "espalda" },
  { name: "Peso muerto", muscle: "espalda" },
  { name: "Sentadilla", muscle: "piernas" },
  { name: "Prensa", muscle: "piernas" },
  { name: "Peso muerto rumano", muscle: "piernas" },
  { name: "Extensión de cuádriceps", muscle: "piernas" },
  { name: "Curl femoral", muscle: "piernas" },
  { name: "Hip thrust", muscle: "gluteos" },
  { name: "Zancadas", muscle: "gluteos" },
  { name: "Press militar", muscle: "hombros" },
  { name: "Elevaciones laterales", muscle: "hombros" },
  { name: "Face pull", muscle: "hombros" },
  { name: "Curl con barra", muscle: "brazos" },
  { name: "Curl martillo", muscle: "brazos" },
  { name: "Extensión de tríceps en polea", muscle: "brazos" },
  { name: "Plancha", muscle: "core" },
  { name: "Crunch en polea", muscle: "core" },
  { name: "Cinta / caminadora", muscle: "cardio" },
  { name: "Bicicleta", muscle: "cardio" },
];

type TemplateDef = { name: string; exercises: [string, number, number][] }; // [nombre, peso, reps]

export const TEMPLATES: TemplateDef[] = [
  {
    name: "Push",
    exercises: [
      ["Press de banca", 70, 8],
      ["Press inclinado con mancuernas", 26, 10],
      ["Press militar", 40, 8],
      ["Elevaciones laterales", 10, 14],
      ["Extensión de tríceps en polea", 25, 12],
    ],
  },
  {
    name: "Pull",
    exercises: [
      ["Dominadas", 0, 8],
      ["Remo con barra", 60, 8],
      ["Jalón al pecho", 55, 10],
      ["Face pull", 20, 15],
      ["Curl con barra", 30, 10],
    ],
  },
  {
    name: "Piernas",
    exercises: [
      ["Sentadilla", 90, 6],
      ["Peso muerto rumano", 80, 8],
      ["Prensa", 160, 10],
      ["Curl femoral", 40, 12],
      ["Hip thrust", 100, 10],
    ],
  },
  {
    name: "Full body",
    exercises: [
      ["Sentadilla", 80, 8],
      ["Press de banca", 65, 8],
      ["Remo con barra", 55, 10],
      ["Press militar", 35, 10],
      ["Plancha", 0, 60],
    ],
  },
];

export const muscleOf = (name: string): MuscleGroup =>
  EXERCISE_LIBRARY.find((e) => e.name.toLowerCase() === name.toLowerCase())?.muscle ?? "core";

export function buildExercise(name: string, weight: number, reps: number, sets = 3, done = false): Exercise {
  return {
    id: uid(),
    name,
    muscle: muscleOf(name),
    restSec: 90,
    sets: Array.from({ length: sets }, () => ({ id: uid(), reps, weight, done })),
  };
}

/** Crea un entrenamiento a partir de una plantilla, reutilizando las cargas de la última sesión con el mismo nombre. */
export function workoutFromTemplate(name: string, date: string, history: Workout[]): Workout {
  const last = [...history].filter((w) => w.name === name && w.finished).sort((a, b) => b.date.localeCompare(a.date))[0];
  const tpl = TEMPLATES.find((t) => t.name === name);
  const exercises: Exercise[] = last
    ? last.exercises.map((e) => ({
        ...e,
        id: uid(),
        sets: e.sets.map((s) => ({ ...s, id: uid(), done: false })),
      }))
    : (tpl?.exercises ?? []).map(([n, w, r]) => buildExercise(n, w, r));
  return {
    id: uid(),
    date,
    name,
    startedAt: new Date().toISOString(),
    durationMin: 0,
    kcal: 0,
    exercises,
    finished: false,
    notes: "",
  };
}

export const workoutVolume = (w: Workout) =>
  w.exercises.reduce((acc, e) => acc + e.sets.filter((s) => s.done).reduce((a, s) => a + s.reps * s.weight, 0), 0);

export const workoutSets = (w: Workout) => w.exercises.reduce((acc, e) => acc + e.sets.filter((s) => s.done).length, 0);

export const workoutMuscles = (w: Workout) => Array.from(new Set(w.exercises.map((e) => e.muscle)));

/** Estimación de 1RM (Epley). */
export const e1rm = (weight: number, reps: number) => (reps <= 1 ? weight : weight * (1 + reps / 30));
