import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import * as P from "../pruebas.js";
import { calificarPrueba, construirValor, disponibilidad, PRUEBAS_CATALOGO, PRUEBAS_POR_ID, puedeCargarDesdeControl, respuestasDeResultado } from "../pruebas.js";
import { contextoFicha, evaluarFicha } from "../fichas.js";
import { respuestasComoObjeto } from "../respuestas.js";
import { cambioPct, datosDePrueba, formaSemana, serieDePrueba } from "../historial.js";
import { generateMock } from "../mockData.js";

const raiz = new URL("../../", import.meta.url);
const leer = (r) => readFileSync(new URL(r, raiz), "utf8");
const DIA = 864e5;
const ahora = Date.parse("2026-11-15T12:00:00");
const fila = (prueba_id, diasAtras, extra = {}) => ({ id: `${prueba_id}-${diasAtras}`, prueba_id, nivel: "ok", hecho_en: new Date(ahora - diasAtras * DIA).toISOString(), valor: { resultado: { valor: 1 } }, ...extra });
const ctx = (extra = {}) => ({ ahora, diaMision: 142, diaRegreso: 180, fase: "orbita", fichas: [], historial: [], origen: "laptop", ...extra });

test("La página de Pruebas no tiene 'Para ti hoy'; arriba solo el título y las categorías", () => {
  const src = leer("app/pruebas/page.js");
  assert.ok(!/Para ti hoy|paraTiHoy|data-para-ti|Buscar prueba|Vencidas/.test(src));
  assert.match(src, /<EncabezadoPagina titulo="Pruebas"/);
  assert.equal(P.paraTiHoy, undefined);
  assert.deepEqual(P.ORDEN_CATEGORIAS.map((c) => P.CATEGORIAS_PRUEBA[c].nombre), ["Diario", "Corazón y respiración", "Mente y defensas", "Efectos del espacio"]);
});

test("Análisis ya no tiene la tarjeta 'Prueba recomendada'; la ficha conserva 'Hacer prueba completa'", () => {
  assert.ok(!/Prueba recomendada/.test(leer("components/analisis/Variable.js")));
  assert.match(leer("components/Ficha.js"), /Hacer prueba completa/);
});

test("PHQ-9 hecho hace 3 días → bloqueado; con la ficha de Ánimo en urgente → permitido con la razón", () => {
  const h = [fila("phq9", 3)];
  const bloq = disponibilidad(PRUEBAS_POR_ID.phq9, ctx({ historial: h }));
  assert.equal(bloq.permitido, false);
  assert.equal(bloq.texto, "Disponible en 4 días · se hace cada semana");
  const abierta = disponibilidad(PRUEBAS_POR_ID.phq9, ctx({ historial: h, fichas: [{ clave: "animo", nivel: "moderado" }] }));
  assert.equal(abierta.permitido, false);
  const urg = disponibilidad(PRUEBAS_POR_ID.phq9, ctx({ historial: h, fichas: [{ clave: "animo", nivel: "urgente" }] }));
  assert.equal(urg.permitido, true);
  assert.equal(urg.motivo, "Puedes hacerla ahora: tu ficha de Ánimo, estrés y tripulación está en urgente");
  const who5 = disponibilidad(PRUEBAS_POR_ID.who5, ctx({ historial: [fila("who5", 2)], fichas: [{ clave: "animo", nivel: "moderado" }] }));
  assert.match(who5.motivo, /ficha de Ánimo.*abierta/);
});

test("Remedición, Cincinnati y AMT-4 siempre permitidas", () => {
  for (const id of ["remedicion", "cincinnati", "amt4"]) assert.equal(disponibilidad(PRUEBAS_POR_ID[id], ctx({ historial: [fila(id, 0)] })).permitido, true, id);
});

test("Amsler fuera de sus días fijos → bloqueada; con la ficha de Visión abierta → permitida", () => {
  const h = [fila("amsler", 52)];
  const b = disponibilidad(PRUEBAS_POR_ID.amsler, ctx({ historial: h }));
  assert.equal(b.permitido, false);
  assert.match(b.texto, /Disponible en 8 días · se hace en días fijos de misión \(día 150\)/);
  assert.equal(disponibilidad(PRUEBAS_POR_ID.amsler, ctx({ historial: h, fichas: [{ clave: "vision", nivel: "moderado" }] })).permitido, true);
  assert.equal(disponibilidad(PRUEBAS_POR_ID.amsler, ctx({ historial: h, dolorCabezaCo2: true })).permitido, true);
  assert.equal(disponibilidad(PRUEBAS_POR_ID.amsler, ctx({ historial: h, diaMision: 151 })).permitido, true);
});

test("Ortostática en órbita sin ficha → bloqueada; en gravedad → 1 vez al día", () => {
  const o = PRUEBAS_POR_ID.ortostatica;
  assert.equal(disponibilidad(o, ctx()).permitido, false);
  assert.equal(disponibilidad(o, ctx({ fichas: [{ clave: "pa", nivel: "urgente", rama: "baja" }] })).permitido, true);
  assert.equal(disponibilidad(o, ctx({ fase: "marte" })).permitido, true);
  const hoy = disponibilidad(o, ctx({ fase: "marte", historial: [fila("ortostatica", 0.1)] }));
  assert.equal(hoy.permitido, false);
  assert.match(hoy.texto, /mañana/);
});

test("Un resultado cargado desde /control lleva origen control y recalcula la ficha", () => {
  const prueba = PRUEBAS_POR_ID.orina;
  const resultado = calificarPrueba("orina", { color: 7 });
  const valor = construirValor({ prueba, respuestas: { color: 7 }, resultado, origen: "control" });
  assert.equal(valor.origen, "control");
  const fila = { id: "x", prueba_id: "orina", nivel: resultado.nivel, hecho_en: new Date().toISOString(), valor };
  const sin = evaluarFicha("huesos", { contexto: {}, respuestas: {} });
  const con = evaluarFicha("huesos", { contexto: contextoFicha("huesos", null, null, { resultados: [fila] }), respuestas: {} });
  assert.equal(con.causas.find((c) => c.id === "deshidratacion").puntos - sin.causas.find((c) => c.id === "deshidratacion").puntos, 3);
  assert.equal(serieDePrueba("orina", [fila])[0].origen, "control");
});

test("Amsler, agudeza, lentes y PVT-B no se pueden cargar desde /control", () => {
  for (const id of ["amsler", "agudeza", "lentes", "pvt"]) assert.equal(puedeCargarDesdeControl(id), false, id);
  for (const p of PRUEBAS_CATALOGO.filter((x) => !["amsler", "agudeza", "lentes", "pvt"].includes(x.id))) assert.equal(puedeCargarDesdeControl(p.id), true, p.id);
});

test("'Ignorar intervalo' solo funciona desde /control", () => {
  const h = [fila("phq9", 1)];
  assert.equal(disponibilidad(PRUEBAS_POR_ID.phq9, ctx({ historial: h, ignorarIntervalo: true, origen: "laptop" })).permitido, false);
  assert.equal(disponibilidad(PRUEBAS_POR_ID.phq9, ctx({ historial: h, ignorarIntervalo: true, origen: "control" })).permitido, true);
});

test("Cada prueba guarda todas sus respuestas con hora y el detalle muestra las mismas", () => {
  const casos = {
    ortostatica: { acostado: { sistolica: 120, diastolica: 80, fc: 70 }, min1: { sistolica: 110, diastolica: 76, fc: 82 }, min3: { sistolica: 98, diastolica: 72, fc: 88 }, sintomas: "no" },
    pvt: { pvt: { mediana_ms: 300, lapsos: 1, falsas: 0, tiempos: [280, 300, 410, "falsa"] } },
    amsler: { amsler: { od: ["4-5"], oi: [] } },
    phq9: Object.fromEntries(Array.from({ length: 9 }, (_, i) => [`i${i + 1}`, 1])),
    checkin: { checkin: { animo: 3, estres: 2, fatiga: 3, tripulacion: 4, confusion: false, mareo_de_pie: false, vision_borrosa: false, dolor_cabeza: true, sintomas: [] } },
    diario_sueno: { acostarse: "23:00", levantarse: "06:30", latencia: 20, despertares: 1, despierto: 15, calidad: 4, ambiente: ["ruido"], somnifero: "no" },
  };
  for (const [id, r] of Object.entries(casos)) {
    const resultado = calificarPrueba(id, r, {});
    const valor = construirValor({ prueba: PRUEBAS_POR_ID[id], respuestas: r, resultado, horas: {}, origen: "laptop" });
    for (const k of ["respuestas", "resultado", "base", "comparacion", "origen"]) assert.ok(k in valor, `${id} sin ${k}`);
    assert.ok(valor.respuestas.length > 0, id);
    for (const it of valor.respuestas) assert.ok(it.pregunta && it.hora && it.respuesta !== undefined, `${id}: ${JSON.stringify(it)}`);
    assert.deepEqual(calificarPrueba(id, respuestasComoObjeto(valor), {}).valor, resultado.valor, id);
    assert.deepEqual(respuestasDeResultado({ prueba_id: id, valor }), valor.respuestas);
  }
  const orto = construirValor({ prueba: PRUEBAS_POR_ID.ortostatica, respuestas: casos.ortostatica, resultado: calificarPrueba("ortostatica", casos.ortostatica) });
  assert.deepEqual(orto.respuestas.filter((x) => x.minuto != null).map((x) => x.minuto), [0, 1, 3]);
  const pvt = construirValor({ prueba: PRUEBAS_POR_ID.pvt, respuestas: casos.pvt, resultado: calificarPrueba("pvt", casos.pvt) });
  assert.deepEqual(pvt.respuestas[0].respuesta.tiempos, [280, 300, 410, "falsa"]);
  const sembrado = generateMock().resultados.find((x) => x.prueba_id === "pvt");
  assert.ok(Array.isArray(sembrado.valor.respuestas) && sembrado.valor.respuestas[0].respuesta.tiempos.length > 0);
});

test("Radar 100 % y 0 %; semana contra semana de 60 a 66 = +10 %", () => {
  const fechas = Array.from({ length: 14 }, (_, i) => `2026-11-${String(i + 1).padStart(2, "0")}`);
  assert.deepEqual(formaSemana([{ nombre: "FC", enRango: () => true }], fechas), [{ metrica: "FC", actual: 100, anterior: 100 }]);
  assert.deepEqual(formaSemana([{ nombre: "FC", enRango: () => false }], fechas), [{ metrica: "FC", actual: 0, anterior: 0 }]);
  assert.equal(cambioPct(60, 66), 10);
});

test("Historial: categoría → prueba muestra solo los datos de esa prueba", () => {
  const h = generateMock().resultados.filter((r) => r.astronaut_id === 1);
  const solo = datosDePrueba(h, "pvt");
  assert.ok(solo.length > 5);
  assert.ok(solo.every((r) => r.prueba_id === "pvt"));
  assert.equal(serieDePrueba("pvt", h).length, solo.length);
  assert.ok(PRUEBAS_POR_ID.pvt.categoria === "mente");
});

test("Las pantallas que ya existían conservan su ruta", () => {
  for (const r of ["app/page.js", "app/analisis/page.js", "app/pruebas/page.js", "app/pruebas/[id]/page.js", "app/historial/page.js", "app/perfil/page.js", "app/tripulacion/page.js", "app/control/page.js", "app/reloj/page.js", "app/bienvenida/page.js"]) assert.ok(existsSync(new URL(r, raiz)), r);
});
