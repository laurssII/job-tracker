import { LOCALES, type Lang } from "../i18n/lang";
import { getDictionary } from "../i18n/dictionaries";

const dateFormatters = new Map<Lang, Intl.DateTimeFormat>();
const shortDateFormatters = new Map<Lang, Intl.DateTimeFormat>();

function dateFormatter(lang: Lang): Intl.DateTimeFormat {
  let formatter = dateFormatters.get(lang);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(LOCALES[lang], { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
    dateFormatters.set(lang, formatter);
  }
  return formatter;
}

function shortDateFormatter(lang: Lang): Intl.DateTimeFormat {
  let formatter = shortDateFormatters.get(lang);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(LOCALES[lang], { day: "numeric", month: "short", timeZone: "UTC" });
    shortDateFormatters.set(lang, formatter);
  }
  return formatter;
}

function toDate(iso: string): Date | null {
  const date = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(iso: string | null | undefined, lang: Lang): string {
  if (!iso) return "—";
  const date = toDate(iso);
  return date ? dateFormatter(lang).format(date) : iso;
}

export function formatShortDate(iso: string, lang: Lang): string {
  const date = toDate(iso);
  return date ? shortDateFormatter(lang).format(date) : iso;
}

/** 0.4286 -> "43 %" (es) / "43%" (en) */
export function formatPercent(rate: number, lang: Lang): string {
  return getDictionary(lang).units.percent(Math.round(rate * 100));
}

export function formatDays(days: number | null, lang: Lang): string {
  if (days === null) return "—";
  const units = getDictionary(lang).units;
  const value = days.toLocaleString(LOCALES[lang], { maximumFractionDigits: 1 });
  return `${value} ${days === 1 ? units.day : units.days}`;
}
