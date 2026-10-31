/**
 * Todas las fechas de la app son cadenas "YYYY-MM-DD" (sin hora ni zona horaria),
 * así no hay desfases al mostrarlas ni al compararlas.
 */

function parse(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Fecha de hoy en la zona horaria local, como YYYY-MM-DD. */
export function todayISO(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Días completos entre dos fechas (positivo si `to` es posterior a `from`). */
export function daysBetween(from: string, to: string): number {
  return Math.round((parse(to) - parse(from)) / 86_400_000);
}

export function addDays(iso: string, days: number): string {
  const date = new Date(parse(iso) + days * 86_400_000);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Lunes de la semana a la que pertenece la fecha. */
export function startOfWeek(iso: string): string {
  const dayOfWeek = new Date(parse(iso)).getUTCDay(); // 0 = domingo
  return addDays(iso, -((dayOfWeek + 6) % 7));
}
