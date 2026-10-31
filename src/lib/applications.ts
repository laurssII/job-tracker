/**
 * Capa de acceso a datos. Es lo único que habla con SQLite: si más adelante se migra a
 * Postgres (Vercel), basta con reescribir este fichero manteniendo las mismas funciones.
 */
import type { SortKey, Status, WorkMode } from "./constants";
import { getDb } from "./db";
import type {
  Application,
  ApplicationInput,
  ApplicationUpdate,
  ListFilters,
  StatusChange,
} from "./types";

interface ApplicationRow {
  id: number;
  company: string;
  role: string;
  url: string | null;
  location: string | null;
  work_mode: string;
  contract_type: string | null;
  salary: string | null;
  source: string | null;
  applied_at: string;
  status: string;
  contact_name: string | null;
  contact_email: string | null;
  cv_version: string | null;
  notes: string | null;
  next_action: string | null;
  next_action_date: string | null;
  created_at: string;
  updated_at: string;
}

interface HistoryRow {
  id: number;
  application_id: number;
  status: string;
  changed_at: string;
  note: string | null;
}

function toApplication(row: ApplicationRow): Application {
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    url: row.url,
    location: row.location,
    workMode: row.work_mode as WorkMode,
    contractType: row.contract_type,
    salary: row.salary,
    source: row.source,
    appliedAt: row.applied_at,
    status: row.status as Status,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    cvVersion: row.cv_version,
    notes: row.notes,
    nextAction: row.next_action,
    nextActionDate: row.next_action_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toStatusChange(row: HistoryRow): StatusChange {
  return {
    id: row.id,
    applicationId: row.application_id,
    status: row.status as Status,
    changedAt: row.changed_at,
    note: row.note,
  };
}

function toParams(input: ApplicationUpdate) {
  return {
    company: input.company,
    role: input.role,
    url: input.url,
    location: input.location,
    work_mode: input.workMode,
    contract_type: input.contractType,
    salary: input.salary,
    source: input.source,
    applied_at: input.appliedAt,
    contact_name: input.contactName,
    contact_email: input.contactEmail,
    cv_version: input.cvVersion,
    notes: input.notes,
    next_action: input.nextAction,
    next_action_date: input.nextActionDate,
  };
}

// Lista blanca: el orden nunca se construye con texto que venga del usuario.
const ORDER_BY: Record<SortKey, string> = {
  applied_desc: "applied_at DESC, id DESC",
  applied_asc: "applied_at ASC, id ASC",
  company: "company COLLATE NOCASE ASC, id ASC",
  updated_desc: "updated_at DESC, id DESC",
};

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export function listApplications(filters: ListFilters = {}): Application[] {
  const where: string[] = [];
  const params: Record<string, string> = {};

  if (filters.q) {
    where.push(
      "(company LIKE @q ESCAPE '\\' OR role LIKE @q ESCAPE '\\' OR location LIKE @q ESCAPE '\\' OR notes LIKE @q ESCAPE '\\')",
    );
    params.q = `%${escapeLike(filters.q)}%`;
  }
  if (filters.status) {
    where.push("status = @status");
    params.status = filters.status;
  }
  if (filters.workMode) {
    where.push("work_mode = @work_mode");
    params.work_mode = filters.workMode;
  }
  if (filters.source) {
    where.push("source = @source");
    params.source = filters.source;
  }

  const sql = `SELECT * FROM applications
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY ${ORDER_BY[filters.sort ?? "applied_desc"]}`;

  const statement = getDb().prepare(sql);
  const rows = (Object.keys(params).length > 0 ? statement.all(params) : statement.all()) as ApplicationRow[];
  return rows.map(toApplication);
}

export function getApplication(id: number): Application | null {
  const row = getDb().prepare("SELECT * FROM applications WHERE id = ?").get(id) as
    | ApplicationRow
    | undefined;
  return row ? toApplication(row) : null;
}

export function countApplications(): number {
  const row = getDb().prepare("SELECT COUNT(*) AS n FROM applications").get() as { n: number };
  return row.n;
}

/** Fuentes distintas ya usadas, para el filtro de la lista. */
export function listSources(): string[] {
  const rows = getDb()
    .prepare(
      "SELECT DISTINCT source FROM applications WHERE source IS NOT NULL AND source <> '' ORDER BY source COLLATE NOCASE",
    )
    .all() as { source: string }[];
  return rows.map((row) => row.source);
}

export function getHistory(applicationId: number): StatusChange[] {
  const rows = getDb()
    .prepare("SELECT * FROM status_history WHERE application_id = ? ORDER BY changed_at ASC, id ASC")
    .all(applicationId) as HistoryRow[];
  return rows.map(toStatusChange);
}

export function listAllHistory(): StatusChange[] {
  const rows = getDb()
    .prepare("SELECT * FROM status_history ORDER BY changed_at ASC, id ASC")
    .all() as HistoryRow[];
  return rows.map(toStatusChange);
}

/** Crea la solicitud y anota su estado inicial en el historial (con la fecha de solicitud). */
export function createApplication(input: ApplicationInput): number {
  const db = getDb();
  const insert = db.transaction((data: ApplicationInput) => {
    const info = db
      .prepare(
        `INSERT INTO applications
           (company, role, url, location, work_mode, contract_type, salary, source,
            applied_at, status, contact_name, contact_email, cv_version, notes,
            next_action, next_action_date)
         VALUES
           (@company, @role, @url, @location, @work_mode, @contract_type, @salary, @source,
            @applied_at, @status, @contact_name, @contact_email, @cv_version, @notes,
            @next_action, @next_action_date)`,
      )
      .run({ ...toParams(data), status: data.status });
    const id = Number(info.lastInsertRowid);
    db.prepare(
      "INSERT INTO status_history (application_id, status, changed_at, note) VALUES (?, ?, ?, NULL)",
    ).run(id, data.status, data.appliedAt);
    return id;
  });
  return insert(input);
}

/** Actualiza los datos de la solicitud (no el estado: para eso, changeStatus). */
export function updateApplication(id: number, input: ApplicationUpdate): boolean {
  const info = getDb()
    .prepare(
      `UPDATE applications SET
         company = @company, role = @role, url = @url, location = @location,
         work_mode = @work_mode, contract_type = @contract_type, salary = @salary,
         source = @source, applied_at = @applied_at, contact_name = @contact_name,
         contact_email = @contact_email, cv_version = @cv_version, notes = @notes,
         next_action = @next_action, next_action_date = @next_action_date,
         updated_at = datetime('now')
       WHERE id = @id`,
    )
    .run({ ...toParams(input), id });
  return info.changes > 0;
}

/**
 * Cambia el estado y lo registra en el historial. Devuelve false si la solicitud no existe
 * o ya tenía ese estado. Si estaba "pendiente" y pasa a otro estado, la fecha de solicitud
 * pasa a ser la fecha del cambio (el día en que realmente se envió).
 */
export function changeStatus(id: number, status: Status, date: string, note: string | null): boolean {
  const db = getDb();
  const change = db.transaction(() => {
    const current = db.prepare("SELECT status FROM applications WHERE id = ?").get(id) as
      | { status: string }
      | undefined;
    if (!current || current.status === status) return false;

    db.prepare("UPDATE applications SET status = ?, updated_at = datetime('now') WHERE id = ?").run(
      status,
      id,
    );
    if (current.status === "pendiente") {
      db.prepare("UPDATE applications SET applied_at = ? WHERE id = ?").run(date, id);
    }
    db.prepare(
      "INSERT INTO status_history (application_id, status, changed_at, note) VALUES (?, ?, ?, ?)",
    ).run(id, status, date, note);
    return true;
  });
  return change();
}

export function deleteApplication(id: number): boolean {
  return getDb().prepare("DELETE FROM applications WHERE id = ?").run(id).changes > 0;
}

export function deleteAllApplications(): void {
  getDb().exec("DELETE FROM applications");
}
