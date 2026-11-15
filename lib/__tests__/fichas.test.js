import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluarFicha, evaluarRemedicion, contextoFicha, gravedadesConFichas, FICHAS, CLAVES_FICHA, obtenerFicha, RANGO_NIVEL, NOTA_BOTIQUIN } from "../fichas.js";
import { evaluarConCombinaciones as _e, entradaCombinaciones } from "../combinaciones.js";
import { analizar } from "../analysis.js";
import { generateMock } from "../mockData.js";
import { evaluarConCombinaciones } from "../combinaciones.js";
import { revisarEvento } from "../escalamiento.js";

const pa = (s, d) => ({ lectura: { sistolica: s, diastolica: d } });

test("las 12 fichas tienen el formato completo", () => {
  assert.equal(CLAVES_FICHA.length, 12);
  for (const k of CLAVES_FICHA) {
    const fs = FICHAS[k].ramas ? Object.values(FICHAS[k].ramas) : [FICHAS[k]];
    for (const f of fs) {
      for (const campo of ["peligro", "preguntas", "causas", "planes", "botiquin", "remedir", "escalar", "fuentes"]) assert.ok(f[campo] !== undefined, `${k} sin ${campo}`);
      for (const c of f.causas) assert.ok(c.porque && c.fuente && Number.isFinite(c.peso), `${k}.${c.id}`);
      for (const p of f.preguntas) for (const id of [...Object.keys(p.si), ...Object.keys(p.no)]) assert.ok(f.causas.some((c) => c.id === id), `${k}.${p.id} → ${id}`);
    }
  }
  assert.ok(NOTA_BOTIQUIN.includes("flight surgeon"));
});

function reyesCon(cambios) {
  const b = generateMock();
  const data = {
    astronauts: b.astronauts, astronaut: b.astronauts[0], alerts: [], protocols: b.protocols, eventos: b.eventos, enVivo: {},
    vitals: b.vitals.filter((x) => x.astronaut_id === 1), checkins: b.checkins.filter((x) => x.astronaut_id === 1),
    profile: b.profiles[0], pruebas: b.pruebas.filter((x) => x.astronaut_id === 1 && x.tipo !== "presion"),
    cabina: b.cabina.filter((x) => x.astronaut_id === 1), actividad: b.actividad[0],
  };
  data.vitals[data.vitals.length - 1] = { ...data.vitals.at(-1), ...cambios };
  return { data, analisis: analizar(data) };
}

test("PA 92/60 + sí a susto → vasovagal con el mismo nivel que Inicio; 112/72 → resuelto", () => {
  const { data, analisis } = reyesCon({ sistolica: 92, diastolica: 60 });
  const inicio = analisis.gravedades.pa;
  assert.notEqual(inicio, "ok");
  const contexto = contextoFicha("pa", analisis, data);
  const entrada = entradaCombinaciones({ analisis, data });
  const sinResponder = _e("pa", { contexto, respuestas: {}, entrada }).ficha;
  assert.equal(sinResponder.nivel, inicio);
  const { ficha } = _e("pa", { contexto, respuestas: { b1: "no", b2: "no", b3: "si", b4: "no", b5: "no" }, entrada });
  assert.equal(ficha.rama, "baja");
  assert.equal(ficha.principales[0].id, "vasovagal");
  assert.equal(ficha.causaProbable, "Probable cause: vasovagal reaction");
  assert.equal(ficha.nivel, inicio);
  assert.ok(ficha.combinaciones.some((c) => c.id === 6));
  assert.equal(evaluarRemedicion("pa", contexto, { sistolica: 112, diastolica: 72 }).resultado, "resuelto");
  const resuelto = reyesCon({ sistolica: 112, diastolica: 72 }).analisis;
  assert.equal(resuelto.gravedades.pa, "ok");
});

test("La encuesta nunca baja el nivel y la ficha muestra el nivel de Inicio", () => {
  const { data, analisis } = reyesCon({ sistolica: 92, diastolica: 60 });
  for (const k of CLAVES_FICHA) {
    const ev = evaluarFicha(k, { contexto: contextoFicha(k, analisis, data), respuestas: {} });
    if (ev.modo === "normal") assert.equal(ev.nivel, analisis.gravedades[k] || "ok", k);
  }
  const ctx = { ...pa(92, 60), gravedad: "critico" };
  for (const r of [{}, { b3: "si" }, { b2: "si", b3: "no", b4: "no", b5: "no" }, { b5: "nose" }]) assert.equal(evaluarFicha("pa", { contexto: ctx, respuestas: r }).nivel, "critico");
  const g = gravedadesConFichas({ pa: "moderado", fc: "ok" }, [{ clave: "pa", nivel: "urgente", cerrado_en: null }, { clave: "fc", nivel: "critico", cerrado_en: "2026-01-01" }]);
  assert.deepEqual([g.pa, g.fc], ["urgente", "ok"]);
});

test("PA 92/60 + sí a desmayo → termina la encuesta, urgente", () => {
  const ev = evaluarFicha("pa", { contexto: { ...pa(92, 60), gravedad: "urgente" }, respuestas: { b1: "si" } });
  assert.equal(ev.modo, "emergencia");
  assert.equal(ev.terminada, true);
  assert.equal(ev.siguiente, null);
  assert.equal(ev.nivel, "urgente");
});

test("PA 185/112 + sí a visión borrosa → crítico (combinación 3)", () => {
  const ctx = pa(185, 112);
  const { ficha, combinaciones } = evaluarConCombinaciones("pa", { contexto: ctx, respuestas: { a1: "si" }, entrada: { astronauta: { lectura: ctx.lectura } } });
  assert.equal(ficha.nivel, "critico");
  assert.ok(combinaciones.some((c) => c.id === 3 && c.nivel === "critico"));
});

test("PA 185/112 sin síntomas → urgente (combinación 4)", () => {
  const ctx = pa(185, 112);
  const { ficha, combinaciones } = evaluarConCombinaciones("pa", { contexto: ctx, respuestas: { a1: "no" }, entrada: { astronauta: { lectura: ctx.lectura } } });
  assert.equal(ficha.nivel, "urgente");
  assert.ok(combinaciones.some((c) => c.id === 4));
  assert.ok(!combinaciones.some((c) => c.id === 3));
});

test("SpO₂ 88 del reloj + movimiento → lectura falsa, sigue en crítico sin oxímetro", () => {
  const ev = evaluarFicha("spo2", { contexto: { lectura: { spo2: 88 } }, respuestas: { p1: "no", p2: "si" } });
  assert.equal(ev.principales[0].id, "falsa");
  assert.equal(ev.nivel, "critico");
  assert.equal(ev.modo, "normal");
  assert.ok(ev.siguiente, "la encuesta sigue");
  assert.ok(ev.planes.some((p) => p.causa.id === "falsa"));
  const confirmado = evaluarFicha("spo2", { contexto: { lectura: { spo2: 88 }, oximetro: 97 }, respuestas: { p1: "no", p2: "si" } });
  assert.notEqual(confirmado.nivel, "critico");
});

test("Temperatura 38.6 tras ejercicio → causa ejercicio", () => {
  const ev = evaluarFicha("temp", { contexto: { lectura: { temperatura: 38.6 }, actividad: "ejercicio" }, respuestas: { p1: "no", p2: "si" } });
  assert.equal(ev.principales[0].id, "ejercicio");
});

test("Náusea + tormenta en 48 h + misión de 120 días → radiación arriba de mareo", () => {
  const ev = evaluarFicha("radiacion", { contexto: { tormenta48h: true, diaMision: 120 }, respuestas: {} });
  assert.equal(ev.respuestas.p1, "si");
  assert.equal(ev.respuestas.p2, "no");
  assert.equal(ev.principales[0].id, "radiacion");
  assert.ok(ev.causas.findIndex((c) => c.id === "radiacion") < ev.causas.findIndex((c) => c.id === "mareo"));
});

test("Náusea sin tormenta + día 2 de misión → mareo espacial arriba", () => {
  const ev = evaluarFicha("radiacion", { contexto: { tormenta48h: false, diaMision: 2 }, respuestas: { p3: "si" } });
  assert.equal(ev.principales[0].id, "mareo");
});

test("PHQ-9 pregunta 9 distinta de 0 → crítico sin encuesta ni consejos", () => {
  const ev = evaluarFicha("animo", { contexto: { phq9Item9: 1 }, respuestas: { p1: "si" } });
  assert.equal(ev.modo, "conductual");
  assert.equal(ev.nivel, "critico");
  assert.equal(ev.preguntas.length, 0);
  assert.equal(ev.siguiente, null);
  assert.equal(ev.botiquin.length, 0);
  assert.ok(ev.planes.every((p) => p.causa.id === "conductual"));
});

test("Mal sueño + ruido → ambiente, nunca insomnio", () => {
  const ev = evaluarFicha("sueno", { contexto: { horasSueno: 5.2 }, respuestas: { p2: "si", p6: "si" } });
  assert.equal(ev.principales[0].id, "ambiente");
  assert.equal(ev.causas.find((c) => c.id === "insomnio").puntos, 0);
  assert.ok(!ev.preguntas.some((p) => p.id === "p6"));
});

test("No sé no mueve puntos", () => {
  const a = evaluarFicha("fc", { contexto: { lectura: { fc: 110 } }, respuestas: {} });
  const b = evaluarFicha("fc", { contexto: { lectura: { fc: 110 } }, respuestas: { p2: "nose", p3: "nose" } });
  assert.deepEqual(a.causas.map((c) => c.puntos), b.causas.map((c) => c.puntos));
});

test("Empate → se muestran las dos causas con sus planes", () => {
  const ev = evaluarFicha("fc", { contexto: { lectura: { fc: 110 } }, respuestas: {} });
  assert.equal(ev.empate, true);
  assert.deepEqual(ev.principales.map((c) => c.id), ["ejercicio", "estres"]);
  assert.equal(ev.planes.length, 2);
});

test("Paso obligatorio sin marcar después de su tiempo → sube un nivel", () => {
  const ahora = Date.now();
  const evento = { id: "e1", clave: "pa", nivel: "moderado", causa: "vasovagal", abierto_en: new Date(ahora - 11 * 6e4).toISOString(), respuestas: { b3: "si", _m: { rama: "baja", toque: new Date(ahora).toISOString() } } };
  const r = revisarEvento(evento, { pasos: [], ahora });
  assert.ok(r);
  assert.equal(r.nivel, "urgente");
  assert.ok(r.respuestas._m.escalados.includes("pa.b.remedir"));
  const marcado = revisarEvento(evento, { pasos: [{ evento_id: "e1", paso_id: "pa.b.remedir" }], ahora });
  assert.equal(marcado, null);
  const otraVez = revisarEvento({ ...evento, nivel: r.nivel, respuestas: r.respuestas }, { pasos: [], ahora: ahora + 1000 });
  assert.equal(otraVez, null);
});

test("Conciencia sin respuesta en 2 min → crítico", () => {
  const ahora = Date.now();
  const r = revisarEvento({ id: "e2", clave: "conciencia", nivel: "moderado", causa: "mareo", abierto_en: new Date(ahora - 3 * 6e4).toISOString(), respuestas: {} }, { ahora });
  assert.equal(r.nivel, "critico");
});

test("El nivel mínimo del evento nunca baja", () => {
  const ev = evaluarFicha("fc", { contexto: { lectura: { fc: 95 }, nivelMinimo: "urgente" }, respuestas: { p2: "si" } });
  assert.ok(RANGO_NIVEL[ev.nivel] >= RANGO_NIVEL.urgente);
});

test("La ficha de presión elige la rama por el dato", () => {
  assert.equal(obtenerFicha("pa", pa(92, 60)).rama, "baja");
  assert.equal(obtenerFicha("pa", pa(150, 95)).rama, "alta");
});
