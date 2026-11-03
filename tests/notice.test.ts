import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import {
  NOTICE_MS,
  __resetNoticeForTests,
  getNotice,
  showNotice,
  subscribeNotice,
} from "../src/lib/notice";

describe("Aviso en pantalla", () => {
  beforeEach(() => {
    mock.timers.enable({ apis: ["setTimeout"] });
    __resetNoticeForTests();
  });
  afterEach(() => {
    __resetNoticeForTests();
    mock.timers.reset();
  });

  it("aparece al mostrarlo, avisa a los suscriptores y desaparece solo", () => {
    let calls = 0;
    const unsubscribe = subscribeNotice(() => {
      calls += 1;
    });

    assert.equal(getNotice(), null);
    showNotice("Demo vaciada.");
    assert.equal(getNotice(), "Demo vaciada.");
    assert.equal(calls, 1);

    mock.timers.tick(NOTICE_MS - 1);
    assert.equal(getNotice(), "Demo vaciada.");
    mock.timers.tick(1);
    assert.equal(getNotice(), null);
    assert.equal(calls, 2);

    unsubscribe();
    showNotice("Otro");
    assert.equal(calls, 2);
  });

  it("un aviso nuevo sustituye al anterior y reinicia el plazo", () => {
    showNotice("Primero");
    mock.timers.tick(NOTICE_MS - 500);
    showNotice("Segundo");
    mock.timers.tick(NOTICE_MS - 500); // el plazo del primero ya habría vencido
    assert.equal(getNotice(), "Segundo");
    mock.timers.tick(500);
    assert.equal(getNotice(), null);
  });
});
