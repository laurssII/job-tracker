import { getDictionary } from "../i18n/dictionaries";
import type { Lang } from "../i18n/lang";
import type { Application } from "./types";

// Excel en configuración regional española usa ";" como separador de columnas.
const DELIMITER = ";";

/**
 * Escapa una celda CSV. Además de las comillas, neutraliza las "fórmulas":
 * una celda que empiece por = + - @ se interpretaría como fórmula al abrirla en Excel.
 */
export function escapeCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  if (text.includes('"') || text.includes(DELIMITER) || /[\r\n]/.test(text)) {
    text = `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/** CSV con BOM UTF-8 (para que Excel respete tildes) y saltos de línea CRLF. Cabeceras y etiquetas, en el idioma elegido. */
export function applicationsToCsv(apps: Application[], lang: Lang = "es"): string {
  const t = getDictionary(lang);
  const columns: ((app: Application) => string | number | null)[] = [
    (a) => a.company,
    (a) => a.role,
    (a) => t.workModes[a.workMode],
    (a) => a.location,
    (a) => a.contractType,
    (a) => a.salary,
    (a) => a.source,
    (a) => a.appliedAt,
    (a) => t.statuses[a.status],
    (a) => a.contactName,
    (a) => a.contactEmail,
    (a) => a.cvVersion,
    (a) => a.nextAction,
    (a) => a.nextActionDate,
    (a) => a.url,
    (a) => a.notes,
  ];
  const lines = [
    t.csv.headers.map((header) => escapeCell(header)).join(DELIMITER),
    ...apps.map((app) => columns.map((value) => escapeCell(value(app))).join(DELIMITER)),
  ];
  return `﻿${lines.join("\r\n")}\r\n`;
}

/** Nombre del fichero descargado: solicitudes-2026-11-03.csv / applications-2026-11-03.csv */
export function csvFileName(lang: Lang, today: string): string {
  return `${getDictionary(lang).csv.filePrefix}-${today}.csv`;
}
