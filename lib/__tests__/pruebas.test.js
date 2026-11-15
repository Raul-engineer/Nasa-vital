import { test } from "node:test";
import assert from "node:assert/strict";
import { baseDe, calificarPrueba, comparar, necesitaOtraLectura, PRUEBAS_CATALOGO, PRUEBAS_POR_ID, promedioPronam } from "../pruebas.js";
import { contextoFicha, evaluarFicha, FICHAS, mostrarPruebaCompleta } from "../fichas.js";
import { motivosDe, resolverMotivo, contarMotivo, notaMotivo, leerNota } from "../motivos.js";
import { peorPorDia, registrosDeResultados } from "../historial.js";

const items = (n, v) => Object.fromEntries(Array.from({ length: n }, (_, i) => [`i${i + 1}`, typeof v === "function" ? v(i) : v]));

test("El catálogo tiene las 4 categorías y el formato completo", () => {
  const cats = new Set(PRUEBAS_CATALOGO.map((p) => p.categoria));
  assert.deepEqual([...cats].sort(), ["corazon", "diario", "espacio", "mente"]);
  for (const p of PRUEBAS_CATALOGO) for (const k of ["id", "categoria", "nombre", "duracion", "resumen", "paraQue", "fuente", "pasos", "calificar", "critico", "intervalo", "repetirSi", "metricas"]) assert.ok(p[k] !== undefined, `${p.id} sin ${k}`);
  for (const k of Object.keys(FICHAS)) for (const id of FICHAS[k].pruebasRecomendadas) assert.ok(PRUEBAS_POR_ID[id], `${k} recomienda ${id}`);
});

test("PHQ-9: todas en 1 = 9 (leve); con la 9 en 1 → alarma al oficial médico", () => {
  const r = calificarPrueba("phq9", items(9, 1));
  assert.equal(r.valor, 9);
  assert.equal(r.detalles.severidad, "leve");
  assert.equal(r.critico, true);
  assert.equal(r.alcance, "oficial");
  const sin9 = calificarPrueba("phq9", items(9, (i) => (i === 8 ? 0 : 1)));
  assert.equal(sin9.critico, false);
});

test("GAD-7 = 15 → urgente · WHO-5 bruto 12 → 48 % → bienestar bajo", () => {
  assert.equal(calificarPrueba("gad7", { ...items(7, 2), i7: 3 }).nivel, "urgente");
  const w = calificarPrueba("who5", { i1: 3, i2: 3, i3: 2, i4: 2, i5: 2 });
  assert.equal(w.valor, 48);
  assert.equal(w.nivel, "moderado");
  assert.match(w.texto, /bienestar bajo/);
});

test("PVT-B con 4 lapsos → urgente si hay tarea crítica", () => {
  const r = { pvt: { mediana_ms: 330, lapsos: 4, falsas: 0 } };
  assert.equal(calificarPrueba("pvt", r, { mediana: 290, tareaCritica: true }).nivel, "urgente");
  assert.equal(calificarPrueba("pvt", r, { mediana: 290, tareaCritica: false }).nivel, "moderado");
});

test("Ortostática 120/80 → 98/72 al minuto 3 → positiva", () => {
  const r = calificarPrueba("ortostatica", { acostado: { sistolica: 120, diastolica: 80, fc: 70 }, min1: { sistolica: 112, diastolica: 78, fc: 80 }, min3: { sistolica: 98, diastolica: 72, fc: 88 }, sintomas: "no" });
  assert.equal(r.detalles.positiva, true);
  assert.equal(r.nivel, "moderado");
});

test("Recuperación de FC 150 → 141 en 1 min → anormal", () => {
  const r = calificarPrueba("recuperacion_fc", { fin: 150, min1: 141, sintomas: "no" });
  assert.equal(r.detalles.anormal, true);
  assert.equal(r.valor, 9);
});

test("Presión PRONAM 152/94, 148/92, 146/90 → 147/91 grado 1", () => {
  const resp = { l1: { sistolica: 152, diastolica: 94 }, l2: { sistolica: 148, diastolica: 92 }, l3: { sistolica: 146, diastolica: 90 } };
  assert.deepEqual([promedioPronam(resp).sistolica, promedioPronam(resp).diastolica], [147, 91]);
  const r = calificarPrueba("presion_pronam", resp);
  assert.equal(r.detalles.grado, "Grado 1");
  assert.equal(necesitaOtraLectura([resp.l2, resp.l3]), false);
});

test("Lecturas 150 y 128 → pide otra lectura", () => {
  assert.equal(necesitaOtraLectura([{ sistolica: 150, diastolica: 90 }, { sistolica: 128, diastolica: 84 }]), true);
  const paso = PRUEBAS_POR_ID.presion_pronam.pasos.find((p) => p.id === "l4");
  assert.equal(paso.si({ l2: { sistolica: 150, diastolica: 90 }, l3: { sistolica: 128, diastolica: 84 } }), true);
});

test("Cincinnati con un brazo que cae → crítico y alarma", () => {
  const r = calificarPrueba("cincinnati", { cara: "no", brazo: "si", habla: "no" });
  assert.equal(r.nivel, "critico");
  assert.equal(r.critico, true);
});

test("AMT-4 con 1 error nuevo → confusión, urgente", () => {
  const r = calificarPrueba("amt4", { edad: "bien", nacimiento: "bien", lugar: "bien", anio: "error" }, { erroresPrevios: 0, news2: 0 });
  assert.equal(r.nivel, "urgente");
  assert.equal(r.detalles.confusion, true);
});

test("KSS 8 + tarea crítica → aviso", () => {
  const r = calificarPrueba("kss", { kss: 8 }, { tareaCritica: true });
  assert.equal(r.nivel, "info");
  assert.match(r.texto, /planea la misión/);
});

test("Color de orina 7 → poca agua y la ficha de huesos sube deshidratación", () => {
  const r = calificarPrueba("orina", { color: 7 });
  assert.equal(r.detalles.pocaAgua, true);
  const fila = { prueba_id: "orina", nivel: r.nivel, hecho_en: new Date().toISOString(), valor: { respuestas: { color: 7 }, resultado: r, causas: r.causas } };
  const sin = evaluarFicha("huesos", { contexto: {}, respuestas: {} });
  const con = evaluarFicha("huesos", { contexto: contextoFicha("huesos", null, null, { resultados: [fila] }), respuestas: {} });
  const pts = (ev) => ev.causas.find((c) => c.id === "deshidratacion").puntos;
  assert.equal(pts(con) - pts(sin), 3);
  assert.equal(con.principales[0].id, "deshidratacion");
});

test("Amsler con una zona marcada → urgente", () => {
  assert.equal(calificarPrueba("amsler", { amsler: { od: ["4-5"], oi: [] } }).nivel, "urgente");
});

test("Agudeza 2 líneas peor que la base → urgente", () => {
  const r = calificarPrueba("agudeza", { agudeza: { od: 6, oi: 8, cerca: 7 } }, { anterior: { agudeza: { od: 8, oi: 8, cerca: 7 } } });
  assert.equal(r.nivel, "urgente");
});

test("Fuerza de agarre −12 % → aviso", () => {
  const r = calificarPrueba("agarre", { derecha: { i1: 40, i2: 44, i3: 42 }, izquierda: { i1: 38, i2: 40, i3: 39 } }, { mediana: 50 });
  assert.equal(r.detalles.cambio, -12);
  assert.equal(r.nivel, "info");
});

test("Comparación con la base y primera vez", () => {
  assert.equal(comparar("pvt", 342, { valores: [] }), "Primera vez: esta será tu base.");
  const base = baseDe("pvt", [{ prueba_id: "pvt", hecho_en: new Date().toISOString(), valor: { resultado: { valor: 285 } } }]);
  assert.match(comparar("pvt", 342, base), /mediana del PVT habitual es 285 ms; hoy 342 ms \(\+20 %\)/);
});

test("Tomar agua + náusea → sorbos y se abre la ficha de mareo", () => {
  const paso = FICHAS.fc.planes.estres.find((p) => p.id === "fc.agua");
  assert.equal(paso.tipo, "beber");
  assert.deepEqual(motivosDe(paso).map((m) => m.id), ["nausea", "tragar", "peor"]);
  const r = resolverMotivo(paso, "nausea");
  assert.match(r.alternativa.texto, /sorbos cada 5 min/);
  assert.equal(r.abrir, "conciencia");
  assert.ok(!motivosDe(paso).some((m) => m.id === "sensor"));
});

test("Volver a medir + tarea dos veces → la segunda escala", () => {
  const paso = FICHAS.fc.planes.estres.find((p) => p.id === "fc.remedir");
  assert.equal(paso.tipo, "medir");
  const primera = resolverMotivo(paso, "tarea", { previos: 0 });
  assert.equal(primera.posponerMin, 10);
  assert.equal(primera.escalar, null);
  const nota = leerNota(notaMotivo(paso, primera));
  const segunda = resolverMotivo(paso, "tarea", { previos: contarMotivo([nota], paso.id, "tarea") });
  assert.equal(segunda.escalar, "subir");
});

test("Ficha que sube de nivel → aparece Hacer prueba completa con sus pruebas", () => {
  const ev = evaluarFicha("pa", { contexto: { lectura: { sistolica: 92, diastolica: 60 }, gravedad: "urgente", nivelMinimo: "critico" }, respuestas: {} });
  const sin = mostrarPruebaCompleta({ ev: evaluarFicha("pa", { contexto: { lectura: { sistolica: 92, diastolica: 60 }, gravedad: "urgente" }, respuestas: { b3: "si" } }), evento: { respuestas: { _m: { nivelInicial: "urgente" } } } });
  assert.equal(sin.mostrar, false);
  const r = mostrarPruebaCompleta({ ev, evento: { respuestas: { _m: { nivelInicial: "urgente" } } } });
  assert.equal(r.mostrar, true);
  assert.deepEqual(r.pruebas, ["presion_pronam", "ortostatica"]);
  assert.ok(r.motivos.includes("El nivel subió"));
});

test("El calendario pinta cada día con el peor nivel del día en la categoría", () => {
  const reg = [
    { fecha: "2026-11-01", categoria: "corazon", nivel: "moderado" },
    { fecha: "2026-11-01", categoria: "corazon", nivel: "critico" },
    { fecha: "2026-11-01", categoria: "mente", nivel: "urgente" },
    { fecha: "2026-11-02", categoria: "corazon", nivel: "ok" },
    { fecha: "2026-11-02", categoria: "corazon", nivel: "info" },
  ];
  const m = peorPorDia(reg, "corazon");
  assert.equal(m.get("2026-11-01"), "critico");
  assert.equal(m.get("2026-11-02"), "info");
  assert.equal(peorPorDia(reg, "mente").get("2026-11-01"), "urgente");
  const r = registrosDeResultados([{ prueba_id: "pvt", nivel: "urgente", hecho_en: "2026-11-03T10:00:00" }]);
  assert.equal(r[0].categoria, "mente");
});
