const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const shortDateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

function toDate(iso: string): Date | null {
  const date = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = toDate(iso);
  return date ? dateFormatter.format(date) : iso;
}

export function formatShortDate(iso: string): string {
  const date = toDate(iso);
  return date ? shortDateFormatter.format(date) : iso;
}

/** 0.4286 -> "43 %" */
export function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)} %`;
}

export function formatDays(days: number | null): string {
  if (days === null) return "—";
  const value = days.toLocaleString("es-ES", { maximumFractionDigits: 1 });
  return `${value} ${days === 1 ? "día" : "días"}`;
}
