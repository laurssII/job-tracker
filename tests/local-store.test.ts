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
