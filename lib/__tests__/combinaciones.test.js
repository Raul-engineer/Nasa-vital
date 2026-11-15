import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluarCombinaciones, evaluarConCombinaciones, entradaCombinaciones, aplicarCombinaciones } from "../combinaciones.js";
import { contextoFicha, evaluarFicha, RANGO_NIVEL } from "../fichas.js";
import { analizar } from "../analysis.js";
import { generateMock } from "../mockData.js";

function datosDe(id) {
  const b = generateMock();
  return {
    astronauts: b.astronauts,
    astronaut: b.astronauts.find((a) => a.id === id),
    vitals: b.vitals.filter((x) => x.astronaut_id === id),
    checkins: b.checkins.filter((x) => x.astronaut_id === id),
    protocols: b.protocols,
    alerts: [],
    profile: b.profiles.find((x) => x.astronaut_id === id),
    historia: b.historias.find((x) => x.astronaut_id === id),
    pruebas: b.pruebas.filter((x) => x.astronaut_id === id),
    eventos: b.eventos,
    cabina: b.cabina.filter((x) => x.astronaut_id === id),
    actividad: b.actividad.find((x) => x.astronaut_id === id),
    enVivo: {},
  };
}

const ids = (lista) => lista.map((c) => c.id);

test("FC 125 + FR 24 + miedo de golpe + SpO₂ 98 → pánico, moderado (combinación 19)", () => {
  const lectura = { fc: 125, frec_resp: 24, spo2: 98 };
  const { ficha, combinaciones } = evaluarConCombinaciones("animo", { contexto: { lectura }, respuestas: { p9: "si" }, entrada: { astronauta: { lectura } } });
  assert.equal(ficha.principales[0].id, "panico");
  const c19 = combinaciones.find((c) => c.id === 19);
  assert.equal(c19?.nivel, "moderado");
  assert.equal(ficha.nivel, "moderado");
});

test("Lo mismo con dolor de pecho → emergencia y pánico no queda como causa principal", () => {
  const lectura = { fc: 125, frec_resp: 24, spo2: 98 };
  const { ficha, combinaciones } = evaluarConCombinaciones("animo", { contexto: { lectura }, respuestas: { p9: "si" }, todas: { fc: { p1: "si" } }, entrada: { astronauta: { lectura } } });
  assert.equal(combinaciones.find((c) => c.id === 19)?.nivel, "emergencia");
  assert.equal(ficha.nivel, "emergencia");
  assert.notEqual(ficha.principales[0].id, "panico");
  assert.equal(ficha.exclusion?.abrir, "fc");
});

test("Ánimo bajo + medicamento nuevo → causa medicamento (combinación 20)", () => {
  const { ficha, combinaciones } = evaluarConCombinaciones("animo", { contexto: { who5: 40 }, respuestas: { p6: "si" }, entrada: { astronauta: { who5: 40 } } });
  assert.equal(ficha.principales[0].id, "medicamento");
  assert.ok(ids(combinaciones).includes(20));
});

test("Mal sueño + ruido → ambiente (combinación 23)", () => {
  const { ficha, combinaciones } = evaluarConCombinaciones("sueno", { contexto: { horasSueno: 5 }, respuestas: { p2: "si", p6: "si" }, entrada: { astronauta: { horasSueno: 5 } } });
  assert.equal(ficha.principales[0].id, "ambiente");
  const c23 = combinaciones.find((c) => c.id === 23);
  assert.equal(c23?.titulo, "Ambiente");
  assert.ok(!/insomnio/i.test(c23.titulo));
});

test("CO₂ 5.0 mmHg + dolor de cabeza en 2 tripulantes → urgente para todos (combinaciones 9 y 10)", () => {
  const combos = evaluarCombinaciones({
    astronauta: { id: 1, ci: { dolor_cabeza: true, fatiga: 4 }, horasSueno: 5.5 },
    tripulacion: [{ id: 2, ci: { dolor_cabeza: true } }, { id: 3, ci: {} }],
    cabina: { co2_mmhg: 5.0 },
  });
  const c9 = combos.find((c) => c.id === 9);
  const c10 = combos.find((c) => c.id === 10);
  assert.equal(c9?.nivel, "urgente");
  assert.equal(c10?.nivel, "urgente");
  assert.ok(c9.todos && c10.todos);
  const ev = evaluarFicha("cabina", { contexto: { co2_ppm: 6600 }, respuestas: {}, combinaciones: combos });
  assert.equal(ev.nivel, "urgente");
});

test("Temperatura 39.6 con ejercicio → aviso de pausa (combinación 12)", () => {
  const combos = evaluarCombinaciones({ astronauta: { lectura: { temperatura: 39.6 }, actividad: "ejercicio" } });
  const c12 = combos.find((c) => c.id === 12);
  assert.ok(c12?.pausa);
  assert.match(c12.titulo, /Pausa/);
  const tibio = evaluarCombinaciones({ astronauta: { lectura: { temperatura: 38.6 }, actividad: "ejercicio" } }).find((c) => c.id === 12);
  assert.equal(tibio.pausa, false);
});

test("Reyes → combinación 17 carga acumulada y los 180 mSv sin subir el nivel", () => {
  const data = datosDe(1);
  const analisis = analizar(data);
  const entrada = entradaCombinaciones({ analisis, data });
  const combos = evaluarCombinaciones(entrada);
  const c17 = combos.find((c) => c.id === 17);
  assert.equal(c17?.titulo, "Carga acumulada");
  assert.equal(c17.nivel, "moderado");
  assert.ok(!combos.some((c) => c.fichas.includes("radiacion")));
  const ctx = contextoFicha("radiacion", analisis, data);
  const ev = evaluarFicha("radiacion", { contexto: ctx, respuestas: {}, combinaciones: combos });
  assert.ok(RANGO_NIVEL[ev.nivel] <= RANGO_NIVEL.aviso, `radiación en ${ev.nivel}`);
  assert.match(ev.frase, /180 mSv/);
  const sueno = evaluarFicha("sueno", { contexto: contextoFicha("sueno", analisis, data), respuestas: {}, combinaciones: combos });
  assert.ok(sueno.combinaciones.some((c) => c.id === 17));
});

test("Ninguna combinación baja el nivel de una emergencia", () => {
  const combos = [{ id: 6, nivel: "moderado", fichas: ["pa"] }, { id: 14, nivel: "aviso", fichas: [] }];
  assert.equal(aplicarCombinaciones("emergencia", combos, "pa"), "emergencia");
  const ev = evaluarFicha("pa", { contexto: { lectura: { sistolica: 92, diastolica: 60 } }, respuestas: { b1: "si" }, combinaciones: [{ id: 6, nivel: "moderado", fichas: ["pa"] }] });
  assert.equal(ev.nivel, "urgente");
  const sp = evaluarFicha("spo2", { contexto: { lectura: { spo2: 85 } }, respuestas: { p2: "si" }, combinaciones: combos });
  assert.equal(sp.nivel, "emergencia");
});

test("Una regla sin datos no se activa", () => {
  assert.deepEqual(evaluarCombinaciones({}), []);
});

test("NEWS2 total de 7 o más → emergencia (combinación 1)", () => {
  const combos = evaluarCombinaciones({ astronauta: { lectura: { fc: 135, frec_resp: 26, spo2: 92, sistolica: 120, temperatura: 37 } } });
  assert.equal(combos.find((c) => c.id === 1)?.nivel, "emergencia");
});
