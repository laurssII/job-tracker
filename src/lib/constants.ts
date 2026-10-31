export const STATUSES = [
  "pendiente",
  "enviada",
  "respondida",
  "entrevista",
  "prueba_tecnica",
  "oferta",
  "rechazada",
  "sin_respuesta",
  "retirada",
] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  pendiente: "Pendiente de enviar",
  enviada: "Enviada",
  respondida: "Respondida",
  entrevista: "Entrevista",
  prueba_tecnica: "Prueba técnica",
  oferta: "Oferta",
  rechazada: "Rechazada",
  sin_respuesta: "Sin respuesta",
  retirada: "Retirada",
};

// Clases completas (no construidas dinámicamente) para que Tailwind las detecte.
export const STATUS_STYLES: Record<Status, string> = {
  pendiente: "bg-slate-100 text-slate-700 ring-slate-300",
  enviada: "bg-blue-50 text-blue-700 ring-blue-200",
  respondida: "bg-cyan-50 text-cyan-800 ring-cyan-200",
  entrevista: "bg-violet-50 text-violet-700 ring-violet-200",
  prueba_tecnica: "bg-amber-50 text-amber-800 ring-amber-200",
  oferta: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rechazada: "bg-rose-50 text-rose-700 ring-rose-200",
  sin_respuesta: "bg-zinc-100 text-zinc-600 ring-zinc-300",
  retirada: "bg-zinc-100 text-zinc-500 ring-zinc-300",
};

/** Estados que significan "la empresa me ha contestado". */
export const RESPONSE_STATUSES: readonly Status[] = [
  "respondida",
  "entrevista",
  "prueba_tecnica",
  "oferta",
  "rechazada",
];

/** Estados que significan "he pasado el primer filtro". */
export const PROGRESS_STATUSES: readonly Status[] = ["entrevista", "prueba_tecnica", "oferta"];

/** Procesos terminados (ya no requieren seguimiento). */
export const CLOSED_STATUSES: readonly Status[] = ["rechazada", "sin_respuesta", "retirada"];

/** Días sin respuesta tras los que sugerimos enviar un mensaje de seguimiento. */
export const FOLLOW_UP_DAYS = 7;

export const WORK_MODES = ["presencial", "hibrido", "remoto"] as const;
export type WorkMode = (typeof WORK_MODES)[number];

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  presencial: "Presencial",
  hibrido: "Híbrido",
  remoto: "Remoto",
};

export const SORT_LABELS = {
  applied_desc: "Más recientes",
  applied_asc: "Más antiguas",
  company: "Empresa (A-Z)",
  updated_desc: "Actualizadas recientemente",
} as const;
export type SortKey = keyof typeof SORT_LABELS;
export const SORT_KEYS = Object.keys(SORT_LABELS) as SortKey[];

export const SOURCE_SUGGESTIONS = ["LinkedIn", "InfoJobs", "Indeed", "Web de la empresa", "Referido", "Otro"];
export const CONTRACT_SUGGESTIONS = ["Indefinido", "Temporal", "Prácticas", "Freelance", "Otro"];

export function isStatus(value: unknown): value is Status {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

export function isWorkMode(value: unknown): value is WorkMode {
  return typeof value === "string" && (WORK_MODES as readonly string[]).includes(value);
}

export function isSortKey(value: unknown): value is SortKey {
  return typeof value === "string" && (SORT_KEYS as string[]).includes(value);
}
