import {
  isSortKey,
  isStatus,
  isWorkMode,
  type Status,
  type WorkMode,
} from "./constants";
import type { ApplicationInput, ListFilters } from "./types";

/** Un error de campo: un código (la pantalla lo traduce) y, si hace falta, el máximo permitido. */
export type ErrorCode =
  | "company_required"
  | "role_required"
  | "work_mode_required"
  | "date_invalid"
  | "status_invalid"
  | "url_invalid"
  | "email_invalid"
  | "too_long";
export interface FormError {
  code: ErrorCode;
  max?: number;
}
export type FormErrors = Record<string, FormError>;
export type FormValues = Record<string, string>;

/** Estado que devuelven las acciones de formulario: errores por campo + lo que escribió el usuario. */
export interface FormState {
  errors: FormErrors;
  values: FormValues;
}

export const INITIAL_FORM_STATE: FormState = { errors: {}, values: {} };

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: FormErrors; values: FormValues };

type FormLike = { get(name: string): FormDataEntryValue | null };

const FIELD_NAMES = [
  "company",
  "role",
  "url",
  "location",
  "workMode",
  "contractType",
  "salary",
  "source",
  "appliedAt",
  "status",
  "contactName",
  "contactEmail",
  "cvVersion",
  "notes",
  "nextAction",
  "nextActionDate",
] as const;

const MAX_LENGTH: Record<string, number> = {
  company: 200,
  role: 200,
  url: 2000,
  location: 200,
  contractType: 100,
  salary: 100,
  source: 100,
  contactName: 200,
  contactEmail: 200,
  cvVersion: 100,
  notes: 5000,
  nextAction: 300,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(form: FormLike, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function orNull(value: string): string | null {
  return value === "" ? null : value;
}

/** Comprueba formato YYYY-MM-DD y que sea una fecha real (no 2026-02-31). */
export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  if (y < 1990 || y > 2100) return false;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Valida el formulario de solicitud. Si no viene el campo `status` (formulario de edición),
 * se usa "enviada"; quien edite ignora ese valor porque el estado se cambia con su propio formulario.
 */
export function parseApplicationForm(form: FormLike): ParseResult<ApplicationInput> {
  const values: FormValues = {};
  for (const name of FIELD_NAMES) values[name] = text(form, name);

  const errors: FormErrors = {};
  if (!values.company) errors.company = { code: "company_required" };
  if (!values.role) errors.role = { code: "role_required" };
  if (!isWorkMode(values.workMode)) errors.workMode = { code: "work_mode_required" };
  if (!isValidISODate(values.appliedAt)) errors.appliedAt = { code: "date_invalid" };

  const status = values.status === "" ? "enviada" : values.status;
  if (!isStatus(status)) errors.status = { code: "status_invalid" };

  if (values.url && !isHttpUrl(values.url)) errors.url = { code: "url_invalid" };
  if (values.contactEmail && !EMAIL_RE.test(values.contactEmail)) errors.contactEmail = { code: "email_invalid" };
  if (values.nextActionDate && !isValidISODate(values.nextActionDate)) {
    errors.nextActionDate = { code: "date_invalid" };
  }
  for (const [name, max] of Object.entries(MAX_LENGTH)) {
    if (!errors[name] && values[name].length > max) errors[name] = { code: "too_long", max };
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors, values };

  return {
    ok: true,
    data: {
      company: values.company,
      role: values.role,
      url: orNull(values.url),
      location: orNull(values.location),
      workMode: values.workMode as WorkMode,
      contractType: orNull(values.contractType),
      salary: orNull(values.salary),
      source: orNull(values.source),
      appliedAt: values.appliedAt,
      status: status as Status,
      contactName: orNull(values.contactName),
      contactEmail: orNull(values.contactEmail),
      cvVersion: orNull(values.cvVersion),
      notes: orNull(values.notes),
      nextAction: orNull(values.nextAction),
      nextActionDate: orNull(values.nextActionDate),
    },
  };
}

export interface StatusChangeInput {
  status: Status;
  date: string;
  note: string | null;
}

/** Valida el formulario de cambio de estado. Sin fecha, se usa `today`. */
export function parseStatusChangeForm(form: FormLike, today: string): StatusChangeInput | null {
  const status = text(form, "status");
  const date = text(form, "date") || today;
  const note = text(form, "note");
  if (!isStatus(status) || !isValidISODate(date) || note.length > 500) return null;
  return { status, date, note: orNull(note) };
}

/** Convierte los parámetros de la URL (?q=...&status=...) en filtros seguros. */
export function parseFilters(params: Record<string, string | string[] | undefined>): ListFilters {
  const first = (value: string | string[] | undefined): string =>
    (Array.isArray(value) ? value[0] : value)?.trim() ?? "";

  const filters: ListFilters = {};
  const q = first(params.q);
  const status = first(params.status);
  const workMode = first(params.workMode);
  const source = first(params.source);
  const sort = first(params.sort);

  if (q) filters.q = q.slice(0, 100);
  if (isStatus(status)) filters.status = status;
  if (isWorkMode(workMode)) filters.workMode = workMode;
  if (source) filters.source = source.slice(0, 100);
  if (isSortKey(sort)) filters.sort = sort;
  return filters;
}
