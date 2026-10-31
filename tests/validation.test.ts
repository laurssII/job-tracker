import assert from "node:assert/strict";
import test from "node:test";
import {
  isValidISODate,
  parseApplicationForm,
  parseFilters,
  parseStatusChangeForm,
} from "../src/lib/validation";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const valid = { company: "  Nubelia  ", role: "Full Stack", workMode: "hibrido", appliedAt: "2026-10-15" };

test("fechas: solo acepta fechas reales", () => {
  assert.equal(isValidISODate("2026-10-31"), true);
  assert.equal(isValidISODate("2026-02-31"), false);
  assert.equal(isValidISODate("31/10/2026"), false);
  assert.equal(isValidISODate("2026-13-01"), false);
  assert.equal(isValidISODate(""), false);
});

test("formulario: datos válidos (recorta espacios, vacíos a null, estado por defecto)", () => {
  const result = parseApplicationForm(form({ ...valid, url: "https://example.com/oferta", salary: "" }));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.data.company, "Nubelia");
  assert.equal(result.data.salary, null);
  assert.equal(result.data.url, "https://example.com/oferta");
  assert.equal(result.data.status, "enviada");
});

test("formulario: devuelve un error por cada campo incorrecto y conserva lo escrito", () => {
  const result = parseApplicationForm(
    form({
      company: "",
      role: "Dev",
      workMode: "teletrabajo",
      appliedAt: "2026-02-31",
      status: "inventado",
      url: "ftp://example.com",
      contactEmail: "no-es-un-email",
      nextActionDate: "mañana",
      notes: "x".repeat(5001),
    }),
  );
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.deepEqual(Object.keys(result.errors).sort(), [
    "appliedAt",
    "company",
    "contactEmail",
    "nextActionDate",
    "notes",
    "status",
    "url",
    "workMode",
  ]);
  assert.equal(result.values.role, "Dev");
});

test("formulario: rechaza enlaces javascript:", () => {
  const result = parseApplicationForm(form({ ...valid, url: "javascript:alert(1)" }));
  assert.equal(result.ok, false);
});

test("cambio de estado: fecha por defecto y validación", () => {
  assert.deepEqual(parseStatusChangeForm(form({ status: "entrevista" }), "2026-10-31"), {
    status: "entrevista",
    date: "2026-10-31",
    note: null,
  });
  assert.deepEqual(parseStatusChangeForm(form({ status: "oferta", date: "2026-10-20", note: " ¡Sí! " }), "2026-10-31"), {
    status: "oferta",
    date: "2026-10-20",
    note: "¡Sí!",
  });
  assert.equal(parseStatusChangeForm(form({ status: "otra" }), "2026-10-31"), null);
  assert.equal(parseStatusChangeForm(form({ status: "oferta", date: "2026-99-99" }), "2026-10-31"), null);
});

test("filtros: ignora valores no válidos", () => {
  assert.deepEqual(
    parseFilters({ q: " react ", status: "entrevista", workMode: "remoto", source: "LinkedIn", sort: "company" }),
    { q: "react", status: "entrevista", workMode: "remoto", source: "LinkedIn", sort: "company" },
  );
  assert.deepEqual(parseFilters({ status: "x", workMode: "y", sort: "z; DROP TABLE applications" }), {});
  assert.deepEqual(parseFilters({ q: ["uno", "dos"] }), { q: "uno" });
});
