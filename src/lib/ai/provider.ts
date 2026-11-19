import "server-only";

export type Provider = "anthropic" | "gemini" | "demo";

/** Elige proveedor: AI_PROVIDER explícito, o el primero con clave configurada, o demo. */
export function activeProvider(): Provider {
  const forced = process.env.AI_PROVIDER as Provider | undefined;
  if (forced === "anthropic" && process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (forced === "gemini" && process.env.GEMINI_API_KEY) return "gemini";
  if (forced === "demo") return "demo";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return "demo";
}

/** Límite simple en memoria por IP (suficiente para uso personal; usa Upstash/Redis si escalas). */
const hits = new Map<string, number[]>();
export function rateLimited(ip: string, max = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(ip, list);
  return list.length > max;
}

export function parseDataUrl(dataUrl: string): { mediaType: "image/jpeg" | "image/png" | "image/webp"; data: string } | null {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) return null;
  return { mediaType: m[1] as "image/jpeg" | "image/png" | "image/webp", data: m[2] };
}
