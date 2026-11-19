/** Fechas como claves locales YYYY-MM-DD (sin desfases por zona horaria). */
export function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export const todayKey = () => toKey(new Date());

export function addDays(key: string, n: number): string {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

export function diffDays(a: string, b: string): number {
  return Math.round((fromKey(a).getTime() - fromKey(b).getTime()) / 86_400_000);
}

/** Lunes de la semana de la fecha. */
export function startOfWeek(key: string): string {
  const d = fromKey(key);
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow);
  return toKey(d);
}

export function weekDays(key: string): string[] {
  const start = startOfWeek(key);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("es-CO", opts);

export const formatLong = (key: string) => {
  const s = fmt({ weekday: "long", day: "numeric", month: "long" }).format(fromKey(key));
  return s.charAt(0).toUpperCase() + s.slice(1);
};
export const formatShort = (key: string) => fmt({ day: "numeric", month: "short" }).format(fromKey(key)).replace(".", "");
export const formatMedium = (key: string) => fmt({ day: "numeric", month: "short", year: "numeric" }).format(fromKey(key)).replace(".", "");
export const weekdayLetter = (key: string) => fmt({ weekday: "narrow" }).format(fromKey(key)).toUpperCase();
export const weekdayShort = (key: string) => fmt({ weekday: "short" }).format(fromKey(key)).replace(".", "");

export function greeting(h = new Date().getHours()): string {
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function relativeDay(key: string): string {
  const d = diffDays(key, todayKey());
  if (d === 0) return "Hoy";
  if (d === -1) return "Ayer";
  if (d === 1) return "Mañana";
  return formatLong(key);
}
