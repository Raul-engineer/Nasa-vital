import { test } from "node:test";
import assert from "node:assert/strict";
import { aplicarAccion, estadoAlarma, evaluarAlarmas, MENSAJE_RECIBIDO, visibleParaQuien } from "../alarma.js";

const A = { id: 1, nombre: "Cmdr. A. Reyes" };

test("SpO₂ 86 confirmada → alarma crítica para toda la tripulación", () => {
  const al = evaluarAlarmas({ astronauta: { ...A, lectura: { spo2: 86 }, oximetro: 86, news2: 3 } });
  const a = al.find((x) => x.tipo === "spo2");
  assert.ok(a);
  assert.equal(a.alcance, "tripulacion");
  assert.match(a.titulo, /confirmada/);
  assert.equal(a.valor, "86 %");
  assert.equal(a.acciones.length, 3);
  assert.equal(a.nombre, A.nombre);
});

test("SpO₂ 88 del reloj sin confirmar también alarma; con oxímetro 97 no", () => {
  assert.ok(evaluarAlarmas({ astronauta: { ...A, lectura: { spo2: 88 } } }).some((x) => x.tipo === "spo2"));
  assert.ok(!evaluarAlarmas({ astronauta: { ...A, lectura: { spo2: 88 }, oximetro: 97 } }).some((x) => x.tipo === "spo2"));
});

test("La alarma no se cierra con la X; solo con Recibido, voy", () => {
  const a = evaluarAlarmas({ astronauta: { ...A, lectura: { spo2: 86 }, oximetro: 86 } })[0];
  let acks = {};
  assert.equal(estadoAlarma(a, acks), "pantalla");
  acks = aplicarAccion(acks, a.id, "x", "Garza");
  assert.equal(estadoAlarma(a, acks), "pantalla");
  acks = aplicarAccion(acks, a.id, "recibido", "Garza");
  assert.equal(estadoAlarma(a, acks), "banda");
  assert.equal(acks[a.id].recibido.por, "Garza");
  assert.ok(acks[a.id].recibido.t);
  acks = aplicarAccion(acks, a.id, "cerrar", "Oficial médico");
  assert.equal(estadoAlarma(a, acks), "cerrada");
  assert.equal(MENSAJE_RECIBIDO, "Recibido, voy");
});

test("Pregunta 9 del PHQ-9 → alarma solo al oficial médico", () => {
  const al = evaluarAlarmas({ astronauta: A, analisis: { tamizaje: { phq9: { resultado: { item9: 1 } } }, hoy: {} } });
  const a = al.find((x) => x.tipo === "phq9");
  assert.equal(a.alcance, "oficial");
  assert.equal(visibleParaQuien(a, { esOficial: false }), false);
  assert.equal(visibleParaQuien(a, { esOficial: true }), true);
});

test("Cincinnati crítico, NEWS2 ≥ 7, FR 26 y alarma de la nave", () => {
  const ahora = Date.now();
  const r = [{ prueba_id: "cincinnati", hecho_en: new Date(ahora - 6e4).toISOString(), valor: { resultado: { critico: true, valor: 1, detalles: { anomalias: ["brazo"] } } } }];
  const tipos = evaluarAlarmas({ astronauta: { ...A, lectura: { frec_resp: 26 }, news2: 8, alarmaNave: { tipo: "incendio" } }, resultados: r, ahora }).map((x) => x.tipo);
  for (const t of ["cincinnati", "news2", "fr", "nave"]) assert.ok(tipos.includes(t), t);
});

test("FC 135 solo alarma con síntomas", () => {
  assert.ok(!evaluarAlarmas({ astronauta: { ...A, lectura: { fc: 135 } } }).some((x) => x.tipo === "fc"));
  assert.ok(evaluarAlarmas({ astronauta: { ...A, lectura: { fc: 135 }, ci: { confusion: true } } }).some((x) => x.tipo === "fc"));
});
