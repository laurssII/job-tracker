/**
 * Casos que debe cumplir CUALQUIER implementación de la capa de datos.
 * Se ejecutan contra SQLite (applications.test.ts) y contra el almacén del navegador
 * (local-store.test.ts), para asegurar que la app se comporta igual en modo normal y demo.
 */
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { todayISO } from "../src/lib/dates";
import type { Repository } from "../src/lib/repository";
import { buildSeed } from "../src/lib/seed-data";
import { computeStats, followUps } from "../src/lib/stats";
import type { ApplicationInput } from "../src/lib/types";

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

export function runRepositoryContract(name: string, repo: Repository): void {
  describe(name, () => {
    beforeEach(() => repo.deleteAllApplications());

    it("crear: guarda la solicitud y su primer estado en el historial", () => {
      const id = repo.createApplication(input());
      const app = repo.getApplication(id);
      assert.ok(app);
      assert.equal(app.company, "Nubelia Systems");
      assert.equal(app.workMode, "hibrido");
      assert.equal(app.status, "enviada");
      assert.equal(app.url, null);
      assert.deepEqual(
        repo.getHistory(id).map((h) => [h.status, h.changedAt]),
        [["enviada", "2026-10-01"]],
      );
      assert.equal(repo.getApplication(9999), null);
    });

    it("cambiar estado: registra el cambio y no repite el mismo estado", () => {
      const id = repo.createApplication(input());
      assert.equal(repo.changeStatus(id, "respondida", "2026-10-04", "Me escribió RRHH"), true);
      assert.equal(repo.changeStatus(id, "respondida", "2026-10-05", null), false);
      assert.equal(repo.changeStatus(9999, "oferta", "2026-10-05", null), false);
      assert.equal(repo.getApplication(id)?.status, "respondida");
      assert.deepEqual(
        repo.getHistory(id).map((h) => [h.status, h.changedAt, h.note]),
        [
          ["enviada", "2026-10-01", null],
          ["respondida", "2026-10-04", "Me escribió RRHH"],
        ],
      );
    });

    it("cambiar estado: al enviar una solicitud pendiente, la fecha de solicitud pasa a ser la del envío", () => {
      const id = repo.createApplication(input({ status: "pendiente", appliedAt: "2026-10-01" }));
      repo.changeStatus(id, "enviada", "2026-10-09", null);
      assert.equal(repo.getApplication(id)?.appliedAt, "2026-10-09");
      // En cambios posteriores la fecha de solicitud no se toca.
      repo.changeStatus(id, "respondida", "2026-10-12", null);
      assert.equal(repo.getApplication(id)?.appliedAt, "2026-10-09");
    });

    it("editar: cambia los datos pero no el estado", () => {
      const id = repo.createApplication(input());
      repo.changeStatus(id, "entrevista", "2026-10-10", null);
      const { status: _status, ...update } = input({ company: "Nubelia Group", salary: null, notes: "Nota nueva" });
      assert.equal(repo.updateApplication(id, update), true);
      const app = repo.getApplication(id);
      assert.equal(app?.company, "Nubelia Group");
      assert.equal(app?.salary, null);
      assert.equal(app?.notes, "Nota nueva");
      assert.equal(app?.status, "entrevista");
      assert.equal(repo.updateApplication(9999, update), false);
    });

    it("listar: filtros, búsqueda (con comodines escapados) y orden", () => {
      repo.createApplication(
        input({ company: "Brisa Labs", workMode: "remoto", source: "InfoJobs", appliedAt: "2026-10-05", notes: "Sueldo 100% variable" }),
      );
      repo.createApplication(input({ company: "alba Insurtech", workMode: "presencial", appliedAt: "2026-10-20" }));
      const id = repo.createApplication(input({ company: "Cobalto", appliedAt: "2026-10-10" }));
      repo.changeStatus(id, "rechazada", "2026-10-12", null);

      const names = (filters: Parameters<Repository["listApplications"]>[0]) =>
        repo.listApplications(filters).map((a) => a.company);

      assert.deepEqual(names({}), ["alba Insurtech", "Cobalto", "Brisa Labs"]);
      assert.deepEqual(names({ sort: "applied_asc" }), ["Brisa Labs", "Cobalto", "alba Insurtech"]);
      assert.deepEqual(names({ sort: "company" }), ["alba Insurtech", "Brisa Labs", "Cobalto"]);
      assert.deepEqual(names({ workMode: "remoto" }), ["Brisa Labs"]);
      assert.deepEqual(names({ status: "rechazada" }), ["Cobalto"]);
      assert.deepEqual(names({ source: "InfoJobs" }), ["Brisa Labs"]);
      assert.deepEqual(names({ q: "ALBA" }), ["alba Insurtech"]);
      assert.deepEqual(names({ q: "100%" }), ["Brisa Labs"]);
      assert.deepEqual(names({ q: "%" }), ["Brisa Labs"]); // el % no es comodín
      assert.deepEqual(names({ q: "x'; DROP TABLE applications; --" }), []);
      assert.deepEqual(repo.listSources(), ["InfoJobs", "LinkedIn"]);
      assert.equal(repo.countApplications(), 3);
    });

    it("borrar: elimina la solicitud y su historial", () => {
      const id = repo.createApplication(input());
      repo.changeStatus(id, "respondida", "2026-10-04", null);
      assert.equal(repo.listAllHistory().length, 2);
      assert.equal(repo.deleteApplication(id), true);
      assert.equal(repo.deleteApplication(id), false);
      assert.equal(repo.listAllHistory().length, 0);
    });

    it("los datos devueltos son copias: modificarlos no altera lo guardado", () => {
      const id = repo.createApplication(input());
      const app = repo.getApplication(id);
      assert.ok(app);
      app.company = "Otra";
      assert.equal(repo.getApplication(id)?.company, "Nubelia Systems");
    });

    it("datos de ejemplo: se cargan completos y son coherentes", () => {
      const today = todayISO();
      const items = buildSeed(today);
      for (const item of items) {
        const id = repo.createApplication(item.input);
        for (const change of item.changes) repo.changeStatus(id, change.status, change.date, change.note);
      }

      const apps = repo.listApplications();
      const history = repo.listAllHistory();
      assert.equal(apps.length, items.length);

      // Ninguna fecha en el futuro y cada estado actual es el último del historial.
      for (const app of apps) {
        const changes = repo.getHistory(app.id);
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
  });
}
