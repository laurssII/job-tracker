/**
 * Capa de datos del modo demo: las mismas funciones que `applications.ts`, pero sobre
 * memoria + localStorage del navegador. Cada visitante tiene su propia copia, con datos
 * ficticios la primera vez, y nada llega al servidor.
 *
 * Solo debe usarse desde el navegador (componentes cliente).
 */
import { isLang, type Lang } from "../i18n/lang";
import type { Status } from "./constants";
import { todayISO } from "./dates";
import type { Repository } from "./repository";
import { buildSeed } from "./seed-data";
import type {
  Application,
  ApplicationInput,
  ApplicationUpdate,
  ListFilters,
  StatusChange,
} from "./types";

const STORAGE_KEY = "job-tracker-demo-v1";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface State {
  /**
   * Idioma de los datos de ejemplo, mientras estén sin tocar. Cualquier cambio del usuario lo borra:
   * así, al cambiar de idioma solo se vuelven a generar los ejemplos que nadie ha modificado.
   */
  seedLang?: Lang;
  apps: Application[];
  history: StatusChange[];
  nextAppId: number;
  nextHistoryId: number;
}

let storageOverride: StorageLike | null | undefined;
let state: State | null = null;
let version = 0;
const listeners = new Set<() => void>();

function getStorage(): StorageLike | null {
  if (storageOverride !== undefined) return storageOverride;
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null; // p. ej. navegación privada con el almacenamiento bloqueado
  }
}

function now(): string {
  return new Date().toISOString();
}

function emptyState(): State {
  return { apps: [], history: [], nextAppId: 1, nextHistoryId: 1 };
}

function insertApplication(s: State, input: ApplicationInput): number {
  const id = s.nextAppId++;
  const stamp = now();
  s.apps.push({ ...input, id, createdAt: stamp, updatedAt: stamp });
  s.history.push({
    id: s.nextHistoryId++,
    applicationId: id,
    status: input.status,
    changedAt: input.appliedAt,
    note: null,
  });
  return id;
}

function applyStatusChange(s: State, id: number, status: Status, date: string, note: string | null): boolean {
  const app = s.apps.find((a) => a.id === id);
  if (!app || app.status === status) return false;
  // Igual que en SQLite: al enviar una solicitud pendiente, la fecha de solicitud es la del envío.
  if (app.status === "pendiente") app.appliedAt = date;
  app.status = status;
  app.updatedAt = now();
  s.history.push({ id: s.nextHistoryId++, applicationId: id, status, changedAt: date, note });
  return true;
}

/** Idioma de la página (<html lang>): con él se eligen los ejemplos en español o inglés. */
function pageLang(): Lang {
  if (typeof document === "undefined") return "es";
  return isLang(document.documentElement.lang) ? document.documentElement.lang : "es";
}

function seededState(lang: Lang): State {
  const s = emptyState();
  s.seedLang = lang;
  for (const item of buildSeed(todayISO(), lang)) {
    const id = insertApplication(s, item.input);
    for (const change of item.changes) applyStatusChange(s, id, change.status, change.date, change.note);
  }
  return s;
}

function isValidState(value: unknown): value is State {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    Array.isArray(candidate.apps) &&
    Array.isArray(candidate.history) &&
    typeof candidate.nextAppId === "number" &&
    typeof candidate.nextHistoryId === "number"
  );
}

function persist(): void {
  try {
    getStorage()?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Almacenamiento lleno o bloqueado: la demo sigue funcionando en memoria.
  }
}

function ensureLoaded(): State {
  if (state) return state;

  let loaded: State | null = null;
  try {
    const raw = getStorage()?.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isValidState(parsed)) loaded = parsed;
    }
  } catch {
    // JSON corrupto: se empieza de cero con los datos de ejemplo.
  }

  if (loaded) {
    state = loaded;
  } else {
    state = seededState(pageLang());
    persist();
  }
  return state;
}

/** Guarda y avisa a las pantallas. Salvo que `keepSeed`, el cambio cuenta como «datos modificados por el usuario». */
function commit(keepSeed = false): void {
  if (state && !keepSeed) delete state.seedLang;
  persist();
  version += 1;
  for (const listener of listeners) listener();
}

// --- Suscripción (para useSyncExternalStore) ---------------------------------------------

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Número que cambia con cada modificación; también carga los datos la primera vez. */
export function getVersion(): number {
  ensureLoaded();
  return version;
}

// Si la demo está abierta en varias pestañas, se mantienen sincronizadas.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) {
      state = null;
      version += 1;
      for (const listener of listeners) listener();
    }
  });
}

// --- Misma API que applications.ts -------------------------------------------------------

function byAppliedDesc(a: Application, b: Application): number {
  return a.appliedAt === b.appliedAt ? b.id - a.id : a.appliedAt < b.appliedAt ? 1 : -1;
}

const SORTERS: Record<NonNullable<ListFilters["sort"]>, (a: Application, b: Application) => number> = {
  applied_desc: byAppliedDesc,
  applied_asc: (a, b) => (a.appliedAt === b.appliedAt ? a.id - b.id : a.appliedAt < b.appliedAt ? -1 : 1),
  company: (a, b) =>
    a.company.localeCompare(b.company, "es", { sensitivity: "base" }) || a.id - b.id,
  updated_desc: (a, b) => (a.updatedAt === b.updatedAt ? b.id - a.id : a.updatedAt < b.updatedAt ? 1 : -1),
};

export function listApplications(filters: ListFilters = {}): Application[] {
  const query = filters.q?.toLowerCase();
  return ensureLoaded()
    .apps.filter((app) => {
      if (filters.status && app.status !== filters.status) return false;
      if (filters.workMode && app.workMode !== filters.workMode) return false;
      if (filters.source && app.source !== filters.source) return false;
      if (query) {
        const haystack = [app.company, app.role, app.location, app.notes].join("\n").toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    })
    .sort(SORTERS[filters.sort ?? "applied_desc"])
    .map((app) => ({ ...app }));
}

export function getApplication(id: number): Application | null {
  const app = ensureLoaded().apps.find((a) => a.id === id);
  return app ? { ...app } : null;
}

export function countApplications(): number {
  return ensureLoaded().apps.length;
}

export function listSources(): string[] {
  const sources = new Set<string>();
  for (const app of ensureLoaded().apps) if (app.source) sources.add(app.source);
  return [...sources].sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
}

function sortedHistory(changes: StatusChange[]): StatusChange[] {
  return changes
    .map((c) => ({ ...c }))
    .sort((a, b) => (a.changedAt === b.changedAt ? a.id - b.id : a.changedAt < b.changedAt ? -1 : 1));
}

export function getHistory(applicationId: number): StatusChange[] {
  return sortedHistory(ensureLoaded().history.filter((c) => c.applicationId === applicationId));
}

export function listAllHistory(): StatusChange[] {
  return sortedHistory(ensureLoaded().history);
}

export function createApplication(input: ApplicationInput): number {
  const id = insertApplication(ensureLoaded(), input);
  commit();
  return id;
}

export function updateApplication(id: number, input: ApplicationUpdate): boolean {
  const app = ensureLoaded().apps.find((a) => a.id === id);
  if (!app) return false;
  Object.assign(app, input, { updatedAt: now() });
  commit();
  return true;
}

export function changeStatus(id: number, status: Status, date: string, note: string | null): boolean {
  const changed = applyStatusChange(ensureLoaded(), id, status, date, note);
  if (changed) commit();
  return changed;
}

export function deleteApplication(id: number): boolean {
  const s = ensureLoaded();
  const before = s.apps.length;
  s.apps = s.apps.filter((a) => a.id !== id);
  s.history = s.history.filter((c) => c.applicationId !== id);
  const deleted = s.apps.length < before;
  if (deleted) commit();
  return deleted;
}

export function deleteAllApplications(): void {
  const s = ensureLoaded();
  s.apps = [];
  s.history = [];
  commit();
}

/** Vuelve a los datos de ejemplo iniciales (botón «Restablecer» del banner de la demo). */
export function resetDemo(lang: Lang = pageLang()): void {
  state = seededState(lang);
  commit(true);
}

/**
 * Al cambiar de idioma: si los datos siguen siendo los de ejemplo sin tocar, se vuelven a generar
 * en ese idioma (puestos, fuentes, notas…). Si el usuario ya ha cambiado algo, no se toca nada.
 */
export function syncSeedLanguage(lang: Lang): void {
  const s = ensureLoaded();
  if (s.seedLang === undefined || s.seedLang === lang) return;
  state = seededState(lang);
  commit(true);
}

// --- Solo para pruebas -------------------------------------------------------------------

/** Cambia el almacenamiento usado (null = solo memoria) y olvida lo cargado. */
export function __useStorageForTests(storage: StorageLike | null): void {
  storageOverride = storage;
  state = null;
}

/** Olvida lo cargado en memoria, para comprobar que se recupera desde el almacenamiento. */
export function __forgetMemoryForTests(): void {
  state = null;
}

export const STORAGE_KEY_FOR_TESTS = STORAGE_KEY;

// Comprobación en compilación: este módulo cumple el mismo contrato que la capa SQLite.
const _contract: Repository = {
  listApplications,
  getApplication,
  countApplications,
  listSources,
  getHistory,
  listAllHistory,
  createApplication,
  updateApplication,
  changeStatus,
  deleteApplication,
  deleteAllApplications,
};
void _contract;
