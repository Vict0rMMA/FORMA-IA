import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic());

export interface ClaudeTurn {
  role: "user" | "assistant";
  text: string;
  image?: { mediaType: "image/jpeg" | "image/png" | "image/webp"; data: string };
}

/**
 * Llamada única a Claude con salida estructurada (JSON Schema).
 * Usa fallbacks del lado del servidor por si el clasificador de seguridad rechaza la petición.
 */
export async function claudeJSON(opts: {
  system: string;
  turns: ClaudeTurn[];
  schema: Record<string, unknown>;
  effort: "low" | "medium" | "high";
}): Promise<unknown> {
  const messages: Anthropic.Beta.BetaMessageParam[] = opts.turns.map((t) => {
    if (t.role === "assistant") return { role: "assistant", content: t.text };
    const content: Anthropic.Beta.BetaContentBlockParam[] = [];
    if (t.image) content.push({ type: "image", source: { type: "base64", media_type: t.image.mediaType, data: t.image.data } });
    content.push({ type: "text", text: t.text });
    return { role: "user", content };
  });

  const response = await getClient().beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: opts.system,
    output_config: { effort: opts.effort, format: { type: "json_schema", schema: opts.schema } },
    messages,
  });

  if (response.stop_reason === "refusal") throw new Error("La IA no pudo procesar esta solicitud.");
  if (response.stop_reason === "max_tokens") throw new Error("Respuesta incompleta de la IA.");
  const text = response.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  return JSON.parse(text);
}
