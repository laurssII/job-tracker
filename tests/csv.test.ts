import assert from "node:assert/strict";
import test from "node:test";
import { applicationsToCsv, escapeCell } from "../src/lib/csv";
import { makeApp } from "./helpers";

test("csv: escapa separadores, comillas y saltos de línea", () => {
  assert.equal(escapeCell(null), "");
  assert.equal(escapeCell(5), "5");
  assert.equal(escapeCell("simple"), "simple");
  assert.equal(escapeCell("a;b"), '"a;b"');
  assert.equal(escapeCell('dijo "hola"'), '"dijo ""hola"""');
  assert.equal(escapeCell("línea 1\nlínea 2"), '"línea 1\nlínea 2"');
});

test("csv: neutraliza fórmulas de Excel", () => {
  assert.equal(escapeCell("=SUM(A1:A9)"), "'=SUM(A1:A9)");
  assert.equal(escapeCell("@cmd"), "'@cmd");
  assert.equal(escapeCell("+34 600 000 000"), "'+34 600 000 000");
});

test("csv: cabecera, BOM y una fila por solicitud", () => {
  const csv = applicationsToCsv([
    makeApp(1, { company: "Nubelia; S.L.", status: "entrevista", workMode: "hibrido", notes: "=HYPERLINK()" }),
  ]);
  assert.ok(csv.startsWith("﻿Empresa;Rol;Modalidad;"));
  const lines = csv.trimEnd().split("\r\n");
  assert.equal(lines.length, 2);
  assert.equal(lines[0].replace("﻿", "").split(";").length, 16);
  assert.ok(lines[1].startsWith('"Nubelia; S.L.";'));
  assert.ok(lines[1].includes(";Híbrido;"));
  assert.ok(lines[1].includes(";Entrevista;"));
  assert.ok(lines[1].endsWith(";'=HYPERLINK()"));
});
