import assert from "node:assert/strict";
import test from "node:test";
import { dictionaries } from "../src/i18n/dictionaries";
import { LANGS, isLang, resolveLang } from "../src/i18n/lang";
import { STATUSES, WORK_MODES, SORT_KEYS } from "../src/lib/constants";
import { formatDate, formatDays, formatPercent, formatShortDate } from "../src/lib/format";
import { buildSeed } from "../src/lib/seed-data";

test("idioma: usa la cookie si es válida", () => {
  assert.equal(resolveLang("en", "es-ES,es;q=0.9"), "en");
  assert.equal(resolveLang("es", "en-US,en;q=0.9"), "es");
});

test("idioma: sin cookie (o con una inválida) sigue al navegador", () => {
  assert.equal(resolveLang(undefined, "es-ES,es;q=0.9"), "es");
  assert.equal(resolveLang(undefined, "gl-ES"), "es");
  assert.equal(resolveLang(undefined, "en-GB,en;q=0.8"), "en");
  assert.equal(resolveLang("fr", "fr-FR"), "en");
  assert.equal(resolveLang(null, "de-DE"), "en");
});

test("idioma: sin ninguna pista, español", () => {
  assert.equal(resolveLang(undefined, undefined), "es");
  assert.equal(resolveLang(null, ""), "es");
});

test("idioma: isLang solo acepta es y en", () => {
  assert.deepEqual([...LANGS], ["es", "en"]);
  assert.equal(isLang("es"), true);
  assert.equal(isLang("en"), true);
  assert.equal(isLang("fr"), false);
  assert.equal(isLang(undefined), false);
});

test("diccionarios: cubren todos los estados, modalidades y órdenes, y ninguno está vacío", () => {
  for (const lang of LANGS) {
    const t = dictionaries[lang];
    for (const status of STATUSES) assert.ok(t.statuses[status].length > 0, `${lang}: estado ${status}`);
    for (const mode of WORK_MODES) assert.ok(t.workModes[mode].length > 0, `${lang}: modalidad ${mode}`);
    for (const key of SORT_KEYS) assert.ok(t.sort[key].length > 0, `${lang}: orden ${key}`);
    assert.equal(t.csv.headers.length, 16);
    assert.ok(t.sourceSuggestions.length > 0 && t.contractSuggestions.length > 0);
  }
});

test("diccionarios: el inglés no deja textos en español sin traducir", () => {
  const es = dictionaries.es;
  const en = dictionaries.en;
  const same = (a: object, b: object, path = ""): string[] =>
    Object.entries(a).flatMap(([key, value]) => {
      const other = (b as Record<string, unknown>)[key];
      if (typeof value === "string") {
        // Marcas y nombres propios que se escriben igual en los dos idiomas.
        const allowed = ["LinkedIn", "InfoJobs", "Indeed", "Freelance", "Demo."];
        return value === other && !allowed.includes(value) ? [`${path}${key}`] : [];
      }
      if (typeof value === "object" && value !== null && typeof other === "object" && other !== null) {
        return same(value, other, `${path}${key}.`);
      }
      return [];
    });
  // «Demo.» y «Freelance» son iguales; «Sin descripción» etc. no deben coincidir.
  assert.deepEqual(same(es, en), []);
});

test("diccionarios: textos con números en singular y plural", () => {
  assert.equal(dictionaries.es.list.count(1), "1 solicitud");
  assert.equal(dictionaries.es.list.count(3), "3 solicitudes");
  assert.equal(dictionaries.en.list.count(1), "1 application");
  assert.equal(dictionaries.en.list.count(3), "3 applications");
  assert.equal(dictionaries.es.dashboard.overdue(1), "vencida hace 1 día");
  assert.equal(dictionaries.en.dashboard.overdue(2), "2 days overdue");
  assert.equal(dictionaries.es.errors.too_long(200), "Máximo 200 caracteres.");
  assert.equal(dictionaries.en.errors.too_long(200), "Maximum 200 characters.");
});

test("formato: fechas, porcentajes y días según el idioma", () => {
  assert.equal(formatDate("2026-11-03", "es"), "3 nov 2026");
  assert.equal(formatDate("2026-11-03", "en"), "3 Nov 2026");
  assert.equal(formatDate(null, "en"), "—");
  assert.equal(formatShortDate("2026-03-09", "en"), "9 Mar");
  assert.equal(formatPercent(0.4286, "es"), "43 %");
  assert.equal(formatPercent(0.4286, "en"), "43%");
  assert.equal(formatDays(1, "es"), "1 día");
  assert.equal(formatDays(1, "en"), "1 day");
  assert.equal(formatDays(4.5, "es"), "4,5 días");
  assert.equal(formatDays(4.5, "en"), "4.5 days");
  assert.equal(formatDays(null, "en"), "—");
});

test("datos de ejemplo: mismas solicitudes en los dos idiomas, con los textos traducidos", () => {
  const es = buildSeed("2026-11-03", "es");
  const en = buildSeed("2026-11-03", "en");
  assert.equal(en.length, es.length);
  assert.deepEqual(
    en.map((item) => item.input.company),
    es.map((item) => item.input.company),
  );
  assert.deepEqual(
    en.map((item) => item.input.appliedAt),
    es.map((item) => item.input.appliedAt),
  );
  const first = en[0].input;
  assert.equal(first.role, "Full Stack Developer");
  assert.equal(first.contractType, "Permanent");
  assert.equal(first.salary, "€32-38k");
  assert.equal(es[0].input.role, "Desarrollador/a Full Stack");
  // Por defecto, español.
  assert.equal(buildSeed("2026-11-03")[0].input.role, "Desarrollador/a Full Stack");
  // Ningún texto de los ejemplos en inglés conserva expresiones típicas del español.
  const spanish = /\b(Entrevista|Oferta|Preparar|Enviar|Responder|Rechazo|Piden|Buscaban|Llamada|Ejercicio|Reto|Prueba)\b/;
  for (const item of en) {
    const texts = [item.input.notes, item.input.nextAction, ...item.changes.map((c) => c.note)];
    for (const text of texts) assert.ok(!text || !spanish.test(text), `sin traducir: ${text}`);
  }
});
