/**
 * Rellena la base de datos con solicitudes ficticias.
 *
 *   npm run seed                      -> solo si la base de datos está vacía
 *   npm run seed -- --reset           -> BORRA todo lo que haya y vuelve a cargar los ejemplos
 *   npm run seed -- --lang=en        -> ejemplos en inglés (por defecto, español)
 *   DATABASE_PATH=data/demo.db npm run seed   -> usa un fichero aparte (p. ej. para la demo)
 */
import {
  changeStatus,
  countApplications,
  createApplication,
  deleteAllApplications,
} from "../src/lib/applications";
import { todayISO } from "../src/lib/dates";
import { getDbPath } from "../src/lib/db";
import { buildSeed } from "../src/lib/seed-data";

const reset = process.argv.includes("--reset");
const lang = process.argv.includes("--lang=en") ? "en" : "es";
const existing = countApplications();

if (existing > 0 && !reset) {
  console.error(
    `La base de datos (${getDbPath()}) ya tiene ${existing} solicitudes; no se ha cambiado nada.\n` +
      "Usa `npm run seed -- --reset` si quieres BORRARLAS y cargar los ejemplos.",
  );
  process.exit(1);
}

if (reset) deleteAllApplications();

const items = buildSeed(todayISO(), lang);
for (const item of items) {
  const id = createApplication(item.input);
  for (const change of item.changes) {
    changeStatus(id, change.status, change.date, change.note);
  }
}

console.log(`Cargadas ${items.length} solicitudes de ejemplo en ${getDbPath()}`);
