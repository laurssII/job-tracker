import assert from "node:assert/strict";
import test from "node:test";
import { addDays, daysBetween, startOfWeek, todayISO } from "../src/lib/dates";
import { computeStats, followUps } from "../src/lib/stats";
import { makeApp, makeChange } from "./helpers";

const TODAY = "2026-10-31"; // sábado

const apps = [
  makeApp(1, { appliedAt: "2026-10-01", status: "oferta", workMode: "remoto", source: "LinkedIn" }),
  makeApp(2, { appliedAt: "2026-10-10", status: "rechazada", workMode: "presencial", source: "InfoJobs" }),
  makeApp(3, { appliedAt: "2026-10-20", status: "enviada", workMode: "hibrido", source: "LinkedIn" }),
  makeApp(4, { appliedAt: "2026-10-30", status: "pendiente", workMode: "remoto" }),
  makeApp(5, { appliedAt: "2026-10-25", status: "sin_respuesta", workMode: "remoto", source: null }),
];

const history = [
  makeChange(1, "enviada", "2026-10-01"),
  makeChange(1, "respondida", "2026-10-05"),
  makeChange(1, "entrevista", "2026-10-12"),
  makeChange(1, "oferta", "2026-10-20"),
  makeChange(2, "enviada", "2026-10-10"),
  makeChange(2, "rechazada", "2026-10-12"),
  makeChange(3, "enviada", "2026-10-20"),
  makeChange(4, "pendiente", "2026-10-30"),
  makeChange(5, "enviada", "2026-10-25"),
  makeChange(5, "sin_respuesta", "2026-10-30"),
];

test("fechas: utilidades", () => {
  assert.equal(daysBetween("2026-10-01", "2026-10-31"), 30);
  assert.equal(addDays("2026-12-30", 3), "2027-01-02");
  assert.equal(startOfWeek("2026-10-31"), "2026-10-26"); // sábado -> lunes
  assert.equal(startOfWeek("2026-10-26"), "2026-10-26"); // lunes -> mismo lunes
  assert.equal(startOfWeek("2026-11-01"), "2026-10-26"); // domingo -> lunes anterior
  assert.equal(todayISO(new Date(2026, 0, 5)), "2026-01-05");
});

test("estadísticas: totales, tasas y tiempos", () => {
  const stats = computeStats(apps, history, TODAY);
  assert.equal(stats.total, 5);
  assert.equal(stats.sent, 4);
  assert.equal(stats.pending, 1);
  assert.equal(stats.responded, 2); // la oferta y el rechazo; "sin respuesta" no cuenta
  assert.equal(stats.responseRate, 0.5);
  assert.equal(stats.interviews, 1);
  assert.equal(stats.interviewRate, 0.25);
  assert.equal(stats.offers, 1);
  assert.equal(stats.rejected, 1);
  assert.equal(stats.ghosted, 1);
  assert.equal(stats.active, 2); // oferta + enviada
  assert.equal(stats.avgDaysToResponse, 3); // (4 + 2) / 2
  assert.equal(stats.byStatus.pendiente, 1);
  assert.equal(stats.byStatus.retirada, 0);
});

test("estadísticas: por fuente y por modalidad", () => {
  const stats = computeStats(apps, history, TODAY);
  assert.deepEqual(
    stats.bySource.map((g) => [g.key, g.total, g.responded]),
    [
      ["LinkedIn", 2, 1],
      ["InfoJobs", 1, 1],
      ["Sin especificar", 1, 0],
    ],
  );
  assert.deepEqual(
    stats.byWorkMode.map((g) => [g.key, g.total]),
    [
      ["presencial", 1],
      ["hibrido", 1],
      ["remoto", 2], // la pendiente no cuenta como enviada
    ],
  );
});

test("estadísticas: solicitudes por semana (8 semanas, la última es la actual)", () => {
  const stats = computeStats(apps, history, TODAY);
  assert.equal(stats.weekly.length, 8);
  assert.equal(stats.weekly[7].weekStart, "2026-10-26");
  assert.deepEqual(
    stats.weekly.map((w) => w.count),
    [0, 0, 0, 1, 1, 0, 2, 0],
  );
});

test("estadísticas: sin datos no divide por cero", () => {
  const stats = computeStats([], [], TODAY);
  assert.equal(stats.responseRate, 0);
  assert.equal(stats.avgDaysToResponse, null);
  assert.equal(stats.byWorkMode.length, 3);
});

test("seguimiento: acciones vencidas primero, luego envíos sin respuesta; los cerrados no cuentan", () => {
  const list = [
    ...apps,
    makeApp(6, { status: "entrevista", appliedAt: "2026-10-10", nextActionDate: "2026-10-29", nextAction: "Enviar email" }),
    makeApp(7, { status: "rechazada", appliedAt: "2026-10-01", nextActionDate: "2026-10-02" }),
    makeApp(8, { status: "enviada", appliedAt: "2026-10-28" }), // solo 3 días: aún no toca
  ];
  const result = followUps(list, TODAY);
  assert.deepEqual(
    result.map((f) => [f.application.id, f.kind, f.days]),
    [
      [6, "action", 2],
      [3, "stale", 11],
    ],
  );
});
