import type { Lang } from "../i18n/lang";
import { applicationsToCsv, csvFileName } from "./csv";
import { todayISO } from "./dates";
import type { Application } from "./types";

/** Descarga las solicitudes como CSV desde el navegador (en la demo no hay servidor que lo genere). */
export function downloadCsv(applications: Application[], lang: Lang): void {
  const blob = new Blob([applicationsToCsv(applications, lang)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = csvFileName(lang, todayISO());
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
