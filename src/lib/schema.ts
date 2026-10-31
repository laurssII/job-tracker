/**
 * Esquema SQLite. Se aplica al abrir la base de datos (CREATE ... IF NOT EXISTS).
 *
 * - `applications`: una fila por solicitud, con su estado actual.
 * - `status_history`: un registro por cada cambio de estado (nunca se sobrescribe),
 *   de ahí salen el tiempo medio de respuesta y la línea de tiempo del detalle.
 *
 * Los valores de `status` y `work_mode` se validan en la aplicación (src/lib/validation.ts)
 * y no con CHECK, para poder añadir estados nuevos sin migrar la base de datos.
 */
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS applications (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  company          TEXT NOT NULL,
  role             TEXT NOT NULL,
  url              TEXT,
  location         TEXT,
  work_mode        TEXT NOT NULL,
  contract_type    TEXT,
  salary           TEXT,
  source           TEXT,
  applied_at       TEXT NOT NULL,
  status           TEXT NOT NULL,
  contact_name     TEXT,
  contact_email    TEXT,
  cv_version       TEXT,
  notes            TEXT,
  next_action      TEXT,
  next_action_date TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS status_history (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  status         TEXT NOT NULL,
  changed_at     TEXT NOT NULL,
  note           TEXT
);

CREATE INDEX IF NOT EXISTS idx_history_application ON status_history(application_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON applications(applied_at);
`;
