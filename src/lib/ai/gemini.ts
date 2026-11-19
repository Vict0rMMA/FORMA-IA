import "server-only";

/** Modelos en orden de preferencia. 503/404/429 → se intenta el siguiente. */
const MODELS = (process.env.GEMINI_MODEL || "gemini-3.5-flash-lite,gemini-flash-lite-latest,gemini-3.5-flash")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

export interface GeminiTurn {
  role: "user" | "assistant";
  text: string;
  image?: { mediaType: string; data: string };
}

/** Quita `additionalProperties`, que Gemini no admite en responseJsonSchema. */
function toGeminiSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(toGeminiSchema);
  if (schema && typeof schema === "object") {
    return Object.fromEntries(
      Object.entries(schema as Record<string, unknown>)
        .filter(([k]) => k !== "additionalProperties")
        .map(([k, v]) => [k, toGeminiSchema(v)]),
    );
  }
  return schema;
}

export async function geminiJSON(opts: { system: string; turns: GeminiTurn[]; schema?: object }): Promise<unknown> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY no configurada");

  const body = {
    systemInstruction: { parts: [{ text: opts.system + "\n\nResponde SOLO con un objeto JSON válido." }] },
    contents: opts.turns.map((t) => ({
      role: t.role === "assistant" ? "model" : "user",
      parts: [...(t.image ? [{ inline_data: { mime_type: t.image.mediaType, data: t.image.data } }] : []), { text: t.text }],
    })),
    generationConfig: {
      responseMimeType: "application/json",
      ...(opts.schema ? { responseJsonSchema: toGeminiSchema(opts.schema) } : {}),
      maxOutputTokens: 16384,
      temperature: 0.4,
    },
  };

  let lastError = "Sin respuesta";
  for (const model of MODELS) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify(body),
    });
    if ([404, 429, 500, 503, 504].includes(res.status)) {
      lastError = `${model}: HTTP ${res.status}`;
      continue;
    }
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
    const json = await res.json();
    const cand = json.candidates?.[0];
    if (cand?.finishReason === "MAX_TOKENS") {
      lastError = `${model}: respuesta truncada`;
      continue;
    }
    const text: string = (cand?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
    const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
    return JSON.parse(cleaned);
  }
  throw new Error(lastError);
}
