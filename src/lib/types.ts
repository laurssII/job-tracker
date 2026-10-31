import type { SortKey, Status, WorkMode } from "./constants";

export interface Application {
  id: number;
  company: string;
  role: string;
  url: string | null;
  location: string | null;
  workMode: WorkMode;
  contractType: string | null;
  salary: string | null;
  source: string | null;
  /** Fecha de solicitud, formato YYYY-MM-DD. */
  appliedAt: string;
  status: Status;
  contactName: string | null;
  contactEmail: string | null;
  cvVersion: string | null;
  notes: string | null;
  nextAction: string | null;
  /** Fecha de la próxima acción, formato YYYY-MM-DD. */
  nextActionDate: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Campos editables desde el formulario de edición (el estado se cambia aparte, con historial). */
export type ApplicationUpdate = Omit<Application, "id" | "status" | "createdAt" | "updatedAt">;

/** Campos necesarios para crear una solicitud. */
export type ApplicationInput = ApplicationUpdate & { status: Status };

export interface StatusChange {
  id: number;
  applicationId: number;
  status: Status;
  /** Fecha del cambio, formato YYYY-MM-DD. */
  changedAt: string;
  note: string | null;
}

export interface ListFilters {
  q?: string;
  status?: Status;
  workMode?: WorkMode;
  source?: string;
  sort?: SortKey;
}
