import { z } from "zod";

/** Acepta 120, "120" o "120 g": algunos modelos devuelven los números como texto. */
const num = (max = 100_000) =>
  z.preprocess(
    (v) => (typeof v === "string" ? Number.parseFloat(v.replace(",", ".")) : v),
    z.number().finite().min(0).max(max),
  );

export const AnalyzeSchema = z.object({
  title: z.string().min(1).max(120),
  items: z
    .array(
      z.object({
        name: z.string().min(1).max(80),
        grams: num(3000),
        kcal: num(6000),
        protein: num(500),
        carbs: num(800),
        fat: num(400),
      }),
    )
    .max(20),
  confidence: z.enum(["alta", "media", "baja"]),
  notes: z.string().max(500),
});

export const CoachSchema = z.object({
  reply: z.string().min(1).max(4000),
  cards: z
    .array(
      z.object({
        title: z.string().max(80),
        kcal: num(),
        protein: num(),
        carbs: num(),
        fat: num(),
        note: z.string().max(200).optional(),
      }),
    )
    .max(4),
  suggestions: z.array(z.string().max(80)).max(4),
});

const macroProps = {
  kcal: { type: "number" },
  protein: { type: "number" },
  carbs: { type: "number" },
  fat: { type: "number" },
} as const;

/** JSON Schema para salidas estructuradas (Claude) — equivalente a los esquemas zod. */
export const ANALYZE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "items", "confidence", "notes"],
  properties: {
    title: { type: "string" },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "grams", "kcal", "protein", "carbs", "fat"],
        properties: { name: { type: "string" }, grams: { type: "number" }, ...macroProps },
      },
    },
    confidence: { type: "string", enum: ["alta", "media", "baja"] },
    notes: { type: "string" },
  },
} as const;

export const COACH_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["reply", "cards", "suggestions"],
  properties: {
    reply: { type: "string" },
    cards: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "kcal", "protein", "carbs", "fat", "note"],
        properties: { title: { type: "string" }, ...macroProps, note: { type: "string" } },
      },
    },
    suggestions: { type: "array", items: { type: "string" } },
  },
} as const;
