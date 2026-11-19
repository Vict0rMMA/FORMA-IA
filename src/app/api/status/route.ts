import { NextResponse } from "next/server";
import { activeProvider } from "@/lib/ai/provider";

/** Indica qué proveedor de IA está activo (sin exponer claves). */
export function GET() {
  return NextResponse.json({ provider: activeProvider() });
}
