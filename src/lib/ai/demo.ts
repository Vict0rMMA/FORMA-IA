/**
 * Respuestas de DEMOSTRACIÓN usadas cuando no hay API key configurada.
 * El análisis de texto sí es real (usa la base local de alimentos); el de fotos devuelve un plato de ejemplo.
 */
import { FOOD_DB, matchFoodsInText, normalize, type FoodRef } from "../food-db";
import { n0, n1 } from "../format";
import { formatMedium } from "../dates";
import type { AnalyzedItem, CoachCard, CoachContext, Macros } from "../types";

const forGrams = (ref: FoodRef, grams: number): AnalyzedItem => ({
  name: ref.name,
  grams: Math.round(grams),
  kcal: Math.round((ref.per100.kcal * grams) / 100),
  protein: Math.round(((ref.per100.protein * grams) / 100) * 10) / 10,
  carbs: Math.round(((ref.per100.carbs * grams) / 100) * 10) / 10,
  fat: Math.round(((ref.per100.fat * grams) / 100) * 10) / 10,
});

const byName = (n: string) => FOOD_DB.find((f) => f.name === n)!;

export function demoAnalyzeImage() {
  const items = [
    forGrams(byName("Pollo a la plancha"), 180),
    forGrams(byName("Arroz blanco"), 150),
    forGrams(byName("Aguacate"), 50),
    forGrams(byName("Ensalada verde"), 100),
  ];
  return {
    title: "Pollo, arroz y ensalada",
    items,
    confidence: "media" as const,
    notes: "Resultado de demostración: configura una API key para analizar tus fotos de verdad.",
  };
}

const WORD_NUMBERS: Record<string, number> = { un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, medio: 0.5, media: 0.5 };

export function demoAnalyzeText(text: string) {
  const matches = matchFoodsInText(text);
  const lower = normalize(text);
  const items = matches.map(({ food, index }) => {
    // Cantidad inmediatamente antes del alimento: "200 g de", "2", "dos".
    const before = lower.slice(Math.max(0, index - 20), index);
    const grams = /(\d+(?:[.,]\d+)?)\s*(?:g|gr|gramos)\s+(?:de\s+)?$/.exec(before);
    if (grams && parseFloat(grams[1]) > 0) return forGrams(food, parseFloat(grams[1].replace(",", ".")));
    const count = /(?:^|\s)(\d+(?:[.,]\d+)?|un|una|uno|dos|tres|cuatro|cinco|medio|media)\s+(?:de\s+)?$/.exec(before);
    if (count) {
      const c = WORD_NUMBERS[count[1]] ?? parseFloat(count[1].replace(",", "."));
      if (c > 0 && c < 20) return forGrams(food, (food.unit ?? food.portion) * c);
    }
    return forGrams(food, food.portion);
  });
  return {
    title: items.length ? items.slice(0, 3).map((i) => i.name.split(" ")[0]).join(", ") : "Comida",
    items,
    confidence: items.length ? ("media" as const) : ("baja" as const),
    notes: items.length
      ? "Modo demo: estimación con la base local de alimentos."
      : "Modo demo: no reconocí alimentos en el texto. Prueba con nombres simples (ej. «200 g de pollo y arroz»).",
  };
}

/* ------------------------------ Coach demo ------------------------------ */

interface Idea {
  title: string;
  note: string;
  m: Macros;
  tags: ("cena" | "desayuno" | "snack" | "almuerzo")[];
}

const IDEAS: Idea[] = [
  { title: "Salmón con quinoa y brócoli", note: "150 g salmón · 120 g quinoa · 120 g brócoli", m: { kcal: 498, protein: 38, carbs: 34, fat: 21 }, tags: ["cena", "almuerzo"] },
  { title: "Pollo con batata y ensalada", note: "170 g pollo · 180 g batata · ensalada", m: { kcal: 460, protein: 55, carbs: 40, fat: 7 }, tags: ["cena", "almuerzo"] },
  { title: "Tilapia con papa y ensalada", note: "180 g tilapia · 180 g papa · ensalada", m: { kcal: 410, protein: 50, carbs: 40, fat: 5.5 }, tags: ["cena"] },
  { title: "Wrap de pollo y aguacate", note: "1 tortilla · 140 g pollo · 40 g aguacate", m: { kcal: 480, protein: 47, carbs: 36, fat: 16 }, tags: ["cena", "almuerzo"] },
  { title: "Omelette de claras y huevo", note: "2 huevos · 150 g claras · 1 arepa", m: { kcal: 430, protein: 43, carbs: 36, fat: 11 }, tags: ["desayuno", "cena"] },
  { title: "Yogur griego con fresas", note: "200 g yogur 0% · 120 g fresas · 15 g almendras", m: { kcal: 250, protein: 22, carbs: 19, fat: 8 }, tags: ["snack", "desayuno"] },
  { title: "Batido de proteína y banano", note: "1 scoop whey · 1 banano · agua", m: { kcal: 227, protein: 25, carbs: 30, fat: 2 }, tags: ["snack"] },
  { title: "Atún con arroz y aguacate", note: "1 lata atún · 150 g arroz · 50 g aguacate", m: { kcal: 470, protein: 32, carbs: 46, fat: 9 }, tags: ["almuerzo", "cena"] },
];

const card = (i: Idea): CoachCard => ({ title: i.title, note: i.note, ...i.m });

function pickIdeas(remaining: Macros, tag?: Idea["tags"][number], n = 2): Idea[] {
  const budget = Math.max(remaining.kcal, 250);
  const needsProtein = remaining.protein > 25;
  return [...IDEAS]
    .filter((i) => !tag || i.tags.includes(tag))
    .sort((a, b) => {
      const score = (i: Idea) => Math.abs(i.m.kcal - Math.min(budget, 550)) - (needsProtein ? i.m.protein * 4 : 0);
      return score(a) - score(b);
    })
    .slice(0, n);
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function demoCoach(question: string, ctx: CoachContext): { reply: string; cards: CoachCard[]; suggestions: string[] } {
  const q = norm(question);
  const t = ctx.targets;
  const c = ctx.consumedToday;
  const rem: Macros = { kcal: t.kcal - c.kcal, protein: t.protein - c.protein, carbs: t.carbs - c.carbs, fat: t.fat - c.fat };
  const weights = ctx.weights;
  const lost = weights.length > 1 ? weights[0].kg - weights[weights.length - 1].kg : 0;

  const kcalMatch = /(\d{3,4})\s*(?:kcal|calorias|cal)/.exec(q);
  if (kcalMatch) {
    const target = parseInt(kcalMatch[1], 10);
    const best = [...IDEAS].sort((a, b) => Math.abs(a.m.kcal - target) - Math.abs(b.m.kcal - target)).slice(0, 2);
    return {
      reply: `Aquí tienes opciones cercanas a **${n0(target)} kcal**, priorizando proteína:`,
      cards: best.map(card),
      suggestions: ["¿Cuántas calorías me quedan?", "¿Qué alimentos tienen más proteína?"],
    };
  }

  if (/(proteina).*(alimento|comida|tiene|mas)|mas proteina/.test(q) && !/voy/.test(q)) {
    const top = [...FOOD_DB]
      .filter((f) => f.per100.kcal > 40)
      .sort((a, b) => b.per100.protein / b.per100.kcal - a.per100.protein / a.per100.kcal)
      .slice(0, 6);
    return {
      reply:
        "Los más eficientes (más proteína por caloría):\n" +
        top.map((f) => `- **${f.name}** — ${n0(f.per100.protein)} g por 100 g (${n0(f.per100.kcal)} kcal)`).join("\n"),
      cards: [],
      suggestions: ["¿Cómo voy con mis proteínas?", "Dame una comida de 500 calorías"],
    };
  }

  if (/quedan|restan|me falta|cuantas calorias/.test(q)) {
    return {
      reply:
        rem.kcal >= 0
          ? `Te quedan **${n0(rem.kcal)} kcal** de ${n0(t.kcal)}.\n- Proteína: ${n0(Math.max(0, rem.protein))} g por cubrir\n- Carbohidratos: ${n0(Math.max(0, rem.carbs))} g\n- Grasas: ${n0(Math.max(0, rem.fat))} g`
          : `Hoy vas **${n0(-rem.kcal)} kcal por encima** de tu objetivo (${n0(t.kcal)}). No pasa nada: mañana vuelve a tu plan normal, sin compensar de golpe.`,
      cards: [],
      suggestions: ["¿Qué puedo cenar?", "¿Cómo voy con mis proteínas?"],
    };
  }

  if (/proteina/.test(q)) {
    const pct = Math.round((c.protein / t.protein) * 100);
    return {
      reply: `Llevas **${n0(c.protein)} g de ${n0(t.protein)} g** de proteína (${pct}%).\n${
        rem.protein > 0
          ? `- Te faltan ${n0(rem.protein)} g: una porción de 150–180 g de pollo o pescado lo resuelve.`
          : "- Objetivo cumplido. Buen trabajo."
      }`,
      cards: rem.protein > 20 ? pickIdeas(rem, undefined, 1).map(card) : [],
      suggestions: ["¿Qué puedo cenar?", "¿Qué alimentos tienen más proteína?"],
    };
  }

  if (/cenar|cena/.test(q) || /que puedo comer|que como/.test(q)) {
    const tag = /cen/.test(q) ? ("cena" as const) : undefined;
    const ideas = pickIdeas(rem, tag);
    return {
      reply:
        rem.kcal > 150
          ? `Con **${n0(rem.kcal)} kcal** y ${n0(Math.max(0, rem.protein))} g de proteína disponibles, te encajan:`
          : "Ya casi cierras el día. Si tienes hambre, elige algo ligero y alto en proteína:",
      cards: (rem.kcal > 150 ? ideas : pickIdeas(rem, "snack", 1)).map(card),
      suggestions: ["Analiza mi alimentación de hoy", "Dame una comida de 500 calorías"],
    };
  }

  if (/peso|perdido|bajado|adelgac/.test(q)) {
    const first = weights[0];
    const last = weights[weights.length - 1];
    return {
      reply: first
        ? `Desde el ${formatMedium(first.date)} has pasado de **${n1(first.kg)} kg a ${n1(last.kg)} kg** (${lost >= 0 ? "−" : "+"}${n1(Math.abs(lost))} kg).\n- Te faltan ${n1(last.kg - ctx.profile.targetWeightKg)} kg para tu objetivo de ${ctx.profile.targetWeightKg} kg.\n- A un ritmo de 0,5 kg/semana serían unas ${Math.max(1, Math.ceil((last.kg - ctx.profile.targetWeightKg) / 0.5))} semanas.`
        : "Aún no tienes registros de peso. Regístralo en Progreso para ver tu evolución.",
      cards: [],
      suggestions: ["¿Cuántas calorías me quedan?", "Analiza mi alimentación de hoy"],
    };
  }

  if (/analiza|como voy|resumen|hoy/.test(q)) {
    const pct = (a: number, b: number) => Math.round((a / Math.max(1, b)) * 100);
    const lines = [
      `- Calorías: ${n0(c.kcal)} / ${n0(t.kcal)} (${pct(c.kcal, t.kcal)}%)`,
      `- Proteína: ${n0(c.protein)} / ${n0(t.protein)} g (${pct(c.protein, t.protein)}%)`,
      `- Carbohidratos: ${n0(c.carbs)} / ${n0(t.carbs)} g`,
      `- Grasas: ${n0(c.fat)} / ${n0(t.fat)} g`,
      `- Agua: ${n0(ctx.waterMl)} ml`,
    ];
    const tip =
      c.protein / t.protein < c.kcal / t.kcal - 0.1
        ? "**Clave:** la proteína va rezagada frente a las calorías. Prioriza una fuente magra en la próxima comida."
        : "**Bien equilibrado.** Mantén la proteína alta en lo que queda del día.";
    return { reply: `${ctx.mealsToday.length} comidas registradas hoy.\n${lines.join("\n")}\n\n${tip}`, cards: [], suggestions: ["¿Qué puedo cenar?", "¿Cuántas calorías me quedan?"] };
  }

  return {
    reply:
      "Estoy en **modo demo** (sin API key), así que entiendo preguntas concretas sobre tus datos. Prueba con alguna de estas o configura una clave para conversar libremente.",
    cards: [],
    suggestions: ["¿Cuántas calorías me quedan?", "¿Qué puedo cenar?", "¿Cuánto peso he perdido?"],
  };
}
