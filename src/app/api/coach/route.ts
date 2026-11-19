import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { claudeJSON } from "@/lib/ai/anthropic";
import { demoCoach } from "@/lib/ai/demo";
import { geminiJSON } from "@/lib/ai/gemini";
import { coachSystem } from "@/lib/ai/prompts";
import { activeProvider, rateLimited } from "@/lib/ai/provider";
import { COACH_JSON_SCHEMA, CoachSchema } from "@/lib/ai/schemas";
import { requireUser } from "@/lib/firebase/server";
import type { CoachContext } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(4000) }))
    .min(1)
    .max(30),
  // El contexto lo construye el cliente desde sus propios datos; se valida por tamaño.
  context: z.record(z.string(), z.unknown()),
});

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (!auth.ok) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  if (rateLimited(`coach:${auth.userId ?? ip}`, 20)) return NextResponse.json({ error: "Demasiadas solicitudes, espera un momento." }, { status: 429 });

  const raw = await req.text();
  if (raw.length > 60_000) return NextResponse.json({ error: "Solicitud demasiado grande" }, { status: 413 });
  let json: unknown = null;
  try {
    json = JSON.parse(raw);
  } catch {
    /* cuerpo inválido */
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });

  const ctx = parsed.data.context as unknown as CoachContext;
  // Solo las últimas 12 intervenciones, empezando por un mensaje del usuario.
  let turns = parsed.data.messages.slice(-12);
  while (turns.length && turns[0].role !== "user") turns = turns.slice(1);
  const question = turns[turns.length - 1]?.text ?? "";

  const provider = activeProvider();
  try {
    let result: unknown;
    if (provider === "demo") result = demoCoach(question, ctx);
    else if (provider === "anthropic") result = await claudeJSON({ system: coachSystem(ctx), turns, schema: COACH_JSON_SCHEMA, effort: "low" });
    else result = await geminiJSON({ system: coachSystem(ctx), turns, schema: COACH_JSON_SCHEMA });
    return NextResponse.json({ ...CoachSchema.parse(result), provider });
  } catch (e) {
    console.error("[coach]", e);
    return NextResponse.json({ error: "El coach no está disponible ahora mismo." }, { status: 502 });
  }
}
