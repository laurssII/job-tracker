import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import {
  changeStatus,
  countApplications,
  createApplication,
  deleteAllApplications,
  deleteApplication,
  getApplication,
  getHistory,
  listAllHistory,
  listApplications,
  listSources,
  updateApplication,
} from "../src/lib/applications";
import { todayISO } from "../src/lib/dates";
import { buildSeed } from "../src/lib/seed-data";
import { computeStats, followUps } from "../src/lib/stats";
import type { ApplicationInput } from "../src/lib/types";

// Base de datos en memoria: se crea al primer uso, así que basta con definirlo antes de llamar a nada.
process.env.DATABASE_PATH = ":memory:";

function input(overrides: Partial<ApplicationInput> = {}): ApplicationInput {
  return {
    company: "Nubelia Systems",
    role: "Full Stack",
    url: null,
    location: "Madrid",
    workMode: "hibrido",
    contractType: "Indefinido",
    salary: "32-38k €",
    source: "LinkedIn",
    appliedAt: "2026-10-01",
    status: "enviada",
    contactName: null,
    contactEmail: null,
    cvVersion: "CV v1",
    notes: null,
    nextAction: null,
    nextActionDate: null,
    ...overrides,
  };
}

beforeEach(() => deleteAllApplications());

test("crear: guarda la solicitud y su primer estado en el historial", () => {
  const id = createApplication(input());
  const app = getApplication(id);
  assert.ok(app);
  assert.equal(app.company, "Nubelia Systems");
  assert.equal(app.workMode, "hibrido");
  assert.equal(app.status, "enviada");
  assert.equal(app.url, null);
  assert.deepEqual(
    getHistory(id).map((h) => [h.status, h.changedAt]),
    [["enviada", "2026-10-01"]],
  );
  assert.equal(getApplication(9999), null);
});

test("cambiar estado: registra el cambio y no repite el mismo estado", () => {
  const id = createApplication(input());
  assert.equal(changeStatus(id, "respondida", "2026-10-04", "Me escribió RRHH"), true);
  assert.equal(changeStatus(id, "respondida", "2026-10-05", null), false);
  assert.equal(changeStatus(9999, "oferta", "2026-10-05", null), false);
  assert.equal(getApplication(id)?.status, "respondida");
  assert.deepEqual(
    getHistory(id).map((h) => [h.status, h.changedAt, h.note]),
    [
      ["enviada", "2026-10-01", null],
      ["respondida", "2026-10-04", "Me escribió RRHH"],
    ],
  );
});

test("cambiar estado: al enviar una solicitud pendiente, la fecha de solicitud pasa a ser la del envío", () => {
  const id = createApplication(input({ status: "pendiente", appliedAt: "2026-10-01" }));
  changeStatus(id, "enviada", "2026-10-09", null);
  assert.equal(getApplication(id)?.appliedAt, "2026-10-09");
  // En cambios posteriores la fecha de solicitud no se toca.
  changeStatus(id, "respondida", "2026-10-12", null);
  assert.equal(getApplication(id)?.appliedAt, "2026-10-09");
});

test("editar: cambia los datos pero no el estado", () => {
  const id = createApplication(input());
  changeStatus(id, "entrevista", "2026-10-10", null);
  const { status: _status, ...update } = input({ company: "Nubelia Group", salary: null, notes: "Nota nueva" });
  assert.equal(updateApplication(id, update), true);
  const app = getApplication(id);
  assert.equal(app?.company, "Nubelia Group");
  assert.equal(app?.salary, null);
  assert.equal(app?.notes, "Nota nueva");
  assert.equal(app?.status, "entrevista");
  assert.equal(updateApplication(9999, update), false);
});

test("listar: filtros, búsqueda (con comodines escapados) y orden", () => {
  createApplication(input({ company: "Brisa Labs", workMode: "remoto", source: "InfoJobs", appliedAt: "2026-10-05", notes: "Sueldo 100% variable" }));
  createApplication(input({ company: "alba Insurtech", workMode: "presencial", appliedAt: "2026-10-20" }));
  const id = createApplication(input({ company: "Cobalto", appliedAt: "2026-10-10" }));
  changeStatus(id, "rechazada", "2026-10-12", null);

  assert.deepEqual(listApplications().map((a) => a.company), ["alba Insurtech", "Cobalto", "Brisa Labs"]);
  assert.deepEqual(listApplications({ sort: "applied_asc" }).map((a) => a.company), ["Brisa Labs", "Cobalto", "alba Insurtech"]);
  assert.deepEqual(listApplications({ sort: "company" }).map((a) => a.company), ["alba Insurtech", "Brisa Labs", "Cobalto"]);
  assert.deepEqual(listApplications({ workMode: "remoto" }).map((a) => a.company), ["Brisa Labs"]);
  assert.deepEqual(listApplications({ status: "rechazada" }).map((a) => a.company), ["Cobalto"]);
  assert.deepEqual(listApplications({ source: "InfoJobs" }).map((a) => a.company), ["Brisa Labs"]);
  assert.deepEqual(listApplications({ q: "ALBA" }).map((a) => a.company), ["alba Insurtech"]);
  assert.deepEqual(listApplications({ q: "100%" }).map((a) => a.company), ["Brisa Labs"]);
  assert.deepEqual(listApplications({ q: "%" }).map((a) => a.company), ["Brisa Labs"]); // el % no es comodín
  assert.deepEqual(listApplications({ q: "x'; DROP TABLE applications; --" }), []);
  assert.deepEqual(listSources(), ["InfoJobs", "LinkedIn"]);
  assert.equal(countApplications(), 3);
});

test("borrar: elimina la solicitud y su historial", () => {
  const id = createApplication(input());
  changeStatus(id, "respondida", "2026-10-04", null);
  assert.equal(listAllHistory().length, 2);
  assert.equal(deleteApplication(id), true);
  assert.equal(deleteApplication(id), false);
  assert.equal(listAllHistory().length, 0);
});

test("datos de ejemplo: se cargan completos y son coherentes", () => {
  const today = todayISO();
  const items = buildSeed(today);
  for (const item of items) {
    const id = createApplication(item.input);
    for (const change of item.changes) changeStatus(id, change.status, change.date, change.note);
  }

  const apps = listApplications();
  const history = listAllHistory();
  assert.equal(apps.length, items.length);

  // Ninguna fecha en el futuro y cada estado actual es el último del historial.
  for (const app of apps) {
    const changes = getHistory(app.id);
    assert.ok(app.appliedAt <= today, `${app.company}: fecha de solicitud futura`);
    assert.ok(changes.every((c) => c.changedAt <= today), `${app.company}: cambio de estado futuro`);
    assert.equal(changes.at(-1)?.status, app.status, `${app.company}: estado y historial no coinciden`);
  }

  const stats = computeStats(apps, history, today);
  assert.equal(stats.sent, items.filter((i) => i.input.status !== "pendiente").length);
  assert.equal(stats.pending, 2);
  assert.ok(stats.responseRate > 0.2 && stats.responseRate < 0.8);
  assert.ok(stats.offers >= 1 && stats.rejected >= 1 && stats.ghosted >= 1);
  assert.ok(stats.avgDaysToResponse !== null && stats.avgDaysToResponse > 0);
  assert.ok(followUps(apps, today).length >= 3);
});
