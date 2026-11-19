import "server-only";
import type { NextRequest } from "next/server";
import { firebaseConfig, firebaseEnabled } from "./config";

/**
 * En modo Firebase exige un token de sesión válido; en modo local siempre permite.
 * El token se valida con la API de Identity Toolkit, así que no hace falta una cuenta de servicio.
 */
export async function requireUser(req: NextRequest): Promise<{ ok: true; userId: string | null } | { ok: false }> {
  if (!firebaseEnabled) return { ok: true, userId: null };
  const token = req.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return { ok: false };
  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token }),
      cache: "no-store",
    });
    if (!res.ok) return { ok: false };
    const json = (await res.json()) as { users?: { localId: string }[] };
    const userId = json.users?.[0]?.localId;
    return userId ? { ok: true, userId } : { ok: false };
  } catch {
    return { ok: false };
  }
}
