import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { conteoPestanas, cuandoToca, disponibilidad, idsDePestana, PESTANAS_PRUEBAS, pestanaInicial, PRUEBAS_POR_ID, recomendadasPorFichas, resumenUltimo, seleccionInicial } from "../pruebas.js";

const src = readFileSync(new URL("../../app/pruebas/page.js", import.meta.url), "utf8");
const ahora = Date.parse("2026-11-15T12:00:00");
const ctx = (extra = {}) => ({ ahora, diaMision: 142, diaRegreso: 180, fase: "orbita", fichas: [], historial: [], origen: "laptop", ...extra });

test("Pestañas Alertas · Diario · Corazón · Mente · Espacio · Completo; solo se muestra el detalle del chip elegido", () => {
  assert.deepEqual(PESTANAS_PRUEBAS, ["alertas", "diario", "corazon", "mente", "espacio", "completo"]);
  assert.equal((src.match(/<Tarjeta /g) || []).length, 1);
  assert.equal((src.match(/<Detalle /g) || []).length, 1);
  assert.match(src, /ChipMetrica/);
  assert.match(src, /Contador/);
  assert.match(src, /components\/analisis\/Pestanas/);
  assert.match(readFileSync(new URL("../../app/analisis/page.js", import.meta.url), "utf8"), /components\/analisis\/Pestanas/);
});

test("Con la ficha de Sueño abierta, Alertas cuenta sus pruebas y Mente y defensas muestra el punto con número", () => {
  const rec = recomendadasPorFichas([{ clave: "sueno", nivel: "urgente", cerrado_en: null }, { clave: "pa", nivel: "moderado", cerrado_en: "2026-11-15T10:00:00Z" }]);
  const c = conteoPestanas(rec);
  assert.equal(c.alertas.n, 3);
  assert.deepEqual(idsDePestana("alertas", rec).sort(), ["diario_sueno", "kss", "pvt"]);
  assert.equal(c.mente.n, 3);
  assert.equal(c.mente.nivel, "urgente");
  assert.equal(c.corazon.n, 0);
  assert.equal(pestanaInicial(null, rec), "alertas");
  assert.ok(["diario_sueno", "kss", "pvt"].includes(seleccionInicial(idsDePestana("mente", rec), rec)));
});

test("Sin fichas abiertas, entra en Diario y Alertas sale sin número", () => {
  const rec = recomendadasPorFichas([]);
  assert.equal(pestanaInicial(null, rec), "diario");
  assert.equal(conteoPestanas(rec).alertas.n, 0);
  assert.match(src, /conteo\.alertas\.n > 0 &&/);
  assert.equal(seleccionInicial(idsDePestana("diario", rec), rec), "checkin");
});

test("Una prueba que no toca sale atenuada con 'en X días' y su detalle muestra la razón", () => {
  const d = disponibilidad(PRUEBAS_POR_ID.phq9, ctx({ historial: [{ prueba_id: "phq9", hecho_en: new Date(ahora - 3 * 864e5).toISOString() }] }));
  assert.equal(cuandoToca(d), "in 4 days");
  assert.equal(d.texto, "Available in 4 days · done every week");
  assert.equal(cuandoToca(disponibilidad(PRUEBAS_POR_ID.cincinnati, ctx())), null);
  assert.equal(cuandoToca(disponibilidad(PRUEBAS_POR_ID.ortostatica, ctx())), "not due");
  assert.match(src, /atenuado=\{!!toca\} nota=\{toca\}/);
  assert.match(src, /data-bloqueada>\{disp\.texto\}/);
});

test("La pestaña y el chip viven en la URL y se conservan al recargar", () => {
  assert.equal(pestanaInicial("corazon", new Map([["pvt", []]])), "corazon");
  assert.equal(pestanaInicial("otra", new Map()), "diario");
  assert.equal(seleccionInicial(idsDePestana("corazon"), new Map(), "presion_pronam"), "presion_pronam");
  assert.match(src, /searchParams\.set\("cat", tab\)/);
  assert.match(src, /searchParams\.set\("p", elegida\)/);
});

test("El botón 'Hacer la prueba' sigue abriendo /pruebas/[id]", () => {
  assert.match(src, /href=\{`\/pruebas\/\$\{p\.id\}\?a=\$\{aid\}`\}/);
});

test("Resumen del último resultado en el chip", () => {
  assert.deepEqual(resumenUltimo(PRUEBAS_POR_ID.pvt, { valor: { resultado: { valor: 342 } } }), { valor: "342", unidad: "ms" });
  assert.deepEqual(resumenUltimo(PRUEBAS_POR_ID.who5, { valor: { resultado: { valor: 48 } } }), { valor: "48", unidad: "%" });
  assert.equal(resumenUltimo(PRUEBAS_POR_ID.amsler, { valor: { resultado: { valor: 0 } } }).valor, "no changes");
  assert.equal(resumenUltimo(PRUEBAS_POR_ID.pvt, null).valor, "Never");
});
