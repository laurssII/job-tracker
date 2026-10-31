import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { SCHEMA } from "./schema";

// Se guarda en globalThis para reutilizar la conexión cuando Next recarga módulos en desarrollo.
const globalForDb = globalThis as unknown as { __jobTrackerDb?: Database.Database };

/** Ruta del fichero SQLite. Se puede cambiar con la variable de entorno DATABASE_PATH. */
export function getDbPath(): string {
  return process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "job-tracker.db");
}

export function getDb(): Database.Database {
  if (!globalForDb.__jobTrackerDb) {
    const file = getDbPath();
    if (file !== ":memory:") {
      fs.mkdirSync(path.dirname(file), { recursive: true });
    }
    const db = new Database(file);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    db.exec(SCHEMA);
    globalForDb.__jobTrackerDb = db;
  }
  return globalForDb.__jobTrackerDb;
}
