import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { claudeJSON } from "@/lib/ai/anthropic";
import { demoAnalyzeImage, demoAnalyzeText } from "@/lib/ai/demo";
import { geminiJSON } from "@/lib/ai/gemini";
import { ANALYZE_SYSTEM } from "@/lib/ai/prompts";
import { activeProvider, parseDataUrl, rateLimited } from "@/lib/ai/provider";
import { ANALYZE_JSON_SCHEMA, AnalyzeSchema } from "@/lib/ai/schemas";
import { requireUser } from "@/lib/firebase/server";
import type { AnalyzeResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z
  .object({
    image: z.string().max(4_000_000).optional(),
    text: z.string().max(1000).optional(),
  })
  .refine((b) => b.image || b.text?.trim(), "Envía una imagen o una descripción");

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (!auth.ok) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  if (rateLimited(`analyze:${auth.userId ?? ip}`, 15)) return NextResponse.json({ error: "Demasiadas solicitudes, espera un momento." }, { status: 429 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  const { image, text } = parsed.data;

  const img = image ? parseDataUrl(image) : null;
  if (image && !img) return NextResponse.json({ error: "Formato de imagen no soportado" }, { status: 400 });

  const provider = activeProvider();
  try {
    let raw: unknown;
    if (provider === "demo") {
      raw = img ? demoAnalyzeImage() : demoAnalyzeText(text ?? "");
    } else {
      const prompt = img
        ? `Analiza esta comida.${text?.trim() ? ` Contexto del usuario: "${text.trim()}"` : ""}`
        : `Analiza esta comida descrita por el usuario: "${text!.trim()}"`;
      const turns = [{ role: "user" as const, text: prompt, image: img ?? undefined }];
      raw =
        provider === "anthropic"
          ? await claudeJSON({ system: ANALYZE_SYSTEM, turns, schema: ANALYZE_JSON_SCHEMA, effort: "medium" })
          : await geminiJSON({ system: ANALYZE_SYSTEM, turns, schema: ANALYZE_JSON_SCHEMA });
    }
    const result = AnalyzeSchema.parse(raw);
    const body: AnalyzeResponse = { ...result, provider };
    return NextResponse.json(body);
  } catch (e) {
    console.error("[analyze]", e);
    return NextResponse.json({ error: "No pudimos analizar la comida. Intenta de nuevo." }, { status: 502 });
  }
}
