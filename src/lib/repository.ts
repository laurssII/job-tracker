import type { Status } from "./constants";
import type {
  Application,
  ApplicationInput,
  ApplicationUpdate,
  ListFilters,
  StatusChange,
} from "./types";

/**
 * Contrato que cumplen las dos implementaciones de la capa de datos:
 * `applications.ts` (SQLite, modo normal) y `local-store.ts` (navegador, modo demo).
 * Las pruebas ejecutan los mismos casos contra las dos, para que se comporten igual.
 */
export interface Repository {
  listApplications(filters?: ListFilters): Application[];
  getApplication(id: number): Application | null;
  countApplications(): number;
  listSources(): string[];
  getHistory(applicationId: number): StatusChange[];
  listAllHistory(): StatusChange[];
  createApplication(input: ApplicationInput): number;
  updateApplication(id: number, input: ApplicationUpdate): boolean;
  changeStatus(id: number, status: Status, date: string, note: string | null): boolean;
  deleteApplication(id: number): boolean;
  deleteAllApplications(): void;
}
