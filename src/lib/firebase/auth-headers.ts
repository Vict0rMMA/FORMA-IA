import { firebaseEnabled } from "./config";

/** Cabeceras para las rutas /api. Firebase solo se descarga si está activo. */
export async function authHeaders(): Promise<Record<string, string>> {
  if (!firebaseEnabled) return { "Content-Type": "application/json" };
  const { authHeadersImpl } = await import("./client");
  return authHeadersImpl();
}
