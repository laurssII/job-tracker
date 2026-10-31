import { STATUS_LABELS, WORK_MODE_LABELS } from "./constants";
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

const COLUMNS: { header: string; value: (app: Application) => string | number | null }[] = [
  { header: "Empresa", value: (a) => a.company },
  { header: "Rol", value: (a) => a.role },
  { header: "Modalidad", value: (a) => WORK_MODE_LABELS[a.workMode] },
  { header: "Ubicación", value: (a) => a.location },
  { header: "Contrato", value: (a) => a.contractType },
  { header: "Salario", value: (a) => a.salary },
  { header: "Fuente", value: (a) => a.source },
  { header: "Fecha de solicitud", value: (a) => a.appliedAt },
  { header: "Estado", value: (a) => STATUS_LABELS[a.status] },
  { header: "Contacto", value: (a) => a.contactName },
  { header: "Email de contacto", value: (a) => a.contactEmail },
  { header: "Versión de CV", value: (a) => a.cvVersion },
  { header: "Próxima acción", value: (a) => a.nextAction },
  { header: "Fecha próxima acción", value: (a) => a.nextActionDate },
  { header: "Enlace", value: (a) => a.url },
  { header: "Notas", value: (a) => a.notes },
];

/** CSV con BOM UTF-8 (para que Excel respete tildes) y saltos de línea CRLF. */
export function applicationsToCsv(apps: Application[]): string {
  const lines = [
    COLUMNS.map((c) => escapeCell(c.header)).join(DELIMITER),
    ...apps.map((app) => COLUMNS.map((c) => escapeCell(c.value(app))).join(DELIMITER)),
  ];
  return `﻿${lines.join("\r\n")}\r\n`;
}
