import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import * as store from "../src/lib/local-store";
import type { Repository } from "../src/lib/repository";
import { buildSeed } from "../src/lib/seed-data";
import { todayISO } from "../src/lib/dates";
import { runRepositoryContract } from "./repository-contract";

/** localStorage de mentira. */
class FakeStorage implements store.StorageLike {
  data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}

// Mismos casos que la capa SQLite, ahora contra el almacén del navegador (solo en memoria).
store.__useStorageForTests(null);
const repository: Repository = store;
runRepositoryContract("Almacén del navegador (modo demo)", repository);

describe("Almacén del navegador: persistencia y datos de ejemplo", () => {
  let storage: FakeStorage;

  beforeEach(() => {
    storage = new FakeStorage();
    store.__useStorageForTests(storage);
  });

  it("la primera vez carga los datos de ejemplo y los guarda", () => {
    assert.equal(store.countApplications(), buildSeed(todayISO()).length);
    assert.ok(storage.getItem(store.STORAGE_KEY_FOR_TESTS));
  });

  it("los cambios sobreviven a recargar la página", () => {
    const id = store.createApplication({ ...buildSeed(todayISO())[0].input, company: "Empresa nueva" });
    store.changeStatus(id, "respondida", todayISO(), "Nota");
    const before = store.countApplications();

    store.__forgetMemoryForTests(); // como si se recargara la página
    assert.equal(store.countApplications(), before);
    assert.equal(store.getApplication(id)?.company, "Empresa nueva");
    assert.equal(store.getApplication(id)?.status, "respondida");
    assert.equal(store.getHistory(id).length, 2);
  });

  it("los ids no se reutilizan tras borrar", () => {
    const first = store.createApplication(buildSeed(todayISO())[0].input);
    store.deleteApplication(first);
    const second = store.createApplication(buildSeed(todayISO())[0].input);
    assert.ok(second > first);
  });

  it("restablecer vuelve a los datos de ejemplo", () => {
    store.deleteAllApplications();
    assert.equal(store.countApplications(), 0);
    store.resetDemo();
    assert.equal(store.countApplications(), buildSeed(todayISO()).length);
  });

  it("vaciar deja la demo vacía y sigue vacía al recargar; restablecer la recupera", () => {
    store.deleteAllApplications();
    assert.equal(store.countApplications(), 0);

    store.__forgetMemoryForTests(); // como si se recargara la página
    assert.equal(store.countApplications(), 0); // no se vuelven a cargar los ejemplos por su cuenta
    assert.deepEqual(store.listAllHistory(), []);

    store.resetDemo();
    store.__forgetMemoryForTests();
    assert.equal(store.countApplications(), buildSeed(todayISO()).length);
  });

  it("si lo guardado está corrupto, vuelve a los datos de ejemplo", () => {
    storage.setItem(store.STORAGE_KEY_FOR_TESTS, "{esto no es json");
    store.__forgetMemoryForTests();
    assert.equal(store.countApplications(), buildSeed(todayISO()).length);

    storage.setItem(store.STORAGE_KEY_FOR_TESTS, JSON.stringify({ apps: "no" }));
    store.__forgetMemoryForTests();
    assert.equal(store.countApplications(), buildSeed(todayISO()).length);
  });

  it("avisa a los suscriptores solo cuando algo cambia", () => {
    let calls = 0;
    const unsubscribe = store.subscribe(() => {
      calls += 1;
    });
    const version = store.getVersion();

    const id = store.createApplication(buildSeed(todayISO())[0].input);
    assert.equal(calls, 1);
    assert.ok(store.getVersion() > version);

    store.changeStatus(id, "enviada", todayISO(), null); // mismo estado: no cambia nada
    assert.equal(calls, 1);

    unsubscribe();
    store.deleteApplication(id);
    assert.equal(calls, 1);
  });

  it("funciona sin almacenamiento (solo en memoria)", () => {
    store.__useStorageForTests(null);
    const id = store.createApplication(buildSeed(todayISO())[0].input);
    assert.ok(store.getApplication(id));
  });
});

describe("Almacén del navegador: idioma de los datos de ejemplo", () => {
  let storage: FakeStorage;

  beforeEach(() => {
    storage = new FakeStorage();
    store.__useStorageForTests(storage);
  });

  it("si los ejemplos están sin tocar, se vuelven a generar en el idioma elegido", () => {
    assert.ok(store.listApplications().some((app) => app.role === "Desarrollador/a Full Stack")); // arranca en español
    store.syncSeedLanguage("en");
    const apps = store.listApplications();
    assert.equal(apps.length, buildSeed(todayISO(), "en").length);
    assert.ok(apps.some((app) => app.role === "Full Stack Developer"));
    assert.ok(!apps.some((app) => app.role.startsWith("Desarrollador")));
    store.syncSeedLanguage("es");
    assert.ok(store.listApplications().some((app) => app.role === "Desarrollador/a Full Stack"));
  });

  it("el idioma elegido se guarda con los datos: tras recargar no se vuelve a traducir sin motivo", () => {
    store.syncSeedLanguage("en");
    store.__forgetMemoryForTests();
    const before = store.getVersion();
    store.syncSeedLanguage("en"); // ya están en inglés: no hace nada
    assert.equal(store.getVersion(), before);
    assert.ok(store.listApplications().some((app) => app.role === "Full Stack Developer"));
  });

  it("si el usuario ha cambiado algo, sus datos no se tocan al cambiar de idioma", () => {
    const first = store.listApplications()[0];
    store.updateApplication(first.id, { ...first, notes: "Mi nota" });
    store.syncSeedLanguage("en");
    const apps = store.listApplications();
    assert.equal(apps.find((app) => app.id === first.id)?.notes, "Mi nota");
    assert.ok(apps.some((app) => app.role === "Desarrollador/a Full Stack"));
  });

  it("una demo vaciada sigue vacía al cambiar de idioma", () => {
    store.deleteAllApplications();
    store.syncSeedLanguage("en");
    assert.equal(store.countApplications(), 0);
  });

  it("«Restablecer» usa el idioma indicado y vuelve a contar como ejemplos sin tocar", () => {
    const first = store.listApplications()[0];
    store.updateApplication(first.id, { ...first, notes: "Mi nota" });
    store.resetDemo("en");
    assert.ok(store.listApplications().some((app) => app.role === "Full Stack Developer"));
    store.syncSeedLanguage("es");
    assert.ok(store.listApplications().some((app) => app.role === "Desarrollador/a Full Stack"));
  });
});
