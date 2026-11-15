import { test } from "node:test";
import assert from "node:assert/strict";
import { combinarEnVivo } from "../data.js";
import { analizar } from "../analysis.js";
import { contextoFicha, evaluarFicha } from "../fichas.js";
import { generateMock } from "../mockData.js";

function datosReyes(actividad = {}) {
  const b = generateMock();
  return {
    astronauts: b.astronauts, astronaut: b.astronauts[0], alerts: [], protocols: b.protocols, eventos: [],
    vitals: b.vitals.filter((x) => x.astronaut_id === 1), checkins: b.checkins.filter((x) => x.astronaut_id === 1), profile: b.profiles[0],
    pruebas: b.pruebas.filter((x) => x.astronaut_id === 1), cabina: b.cabina.filter((x) => x.astronaut_id === 1),
    actividad: { astronaut_id: 1, estado: "reposo", desde: null, fiebre: false, ...actividad },
  };
}
const fila = (clave, valor, t = new Date().toISOString()) => ({ astronaut_id: 1, clave, valor, updated_at: t });
const hace = (min) => new Date(Date.now() - min * 6e4).toISOString();
const ESCENARIOS = {
  "sin ejercicio": { actividad: {}, vivo: [] },
  "con ejercicio activo": { actividad: { estado: "ejercicio", desde: hace(5) }, vivo: [] },
  "en recuperación": { actividad: { estado: "recuperacion", desde: hace(2) }, vivo: [] },
  "con fiebre de en_vivo": { actividad: {}, vivo: [fila("fiebre", true), fila("temperatura", 36.5)] },
};

for (const fc of [60, 91, 110]) {
  for (const [nombre, esc] of Object.entries(ESCENARIOS)) {
    test(`FC ${fc} escrita en /control ${nombre} → Inicio, ficha y motor usan ${fc}`, () => {
      const data = combinarEnVivo(datosReyes(esc.actividad), [...esc.vivo, fila("fc", fc)]);
      const analisis = analizar(data);
      const t = analisis.tarjetas.find((x) => x.k === "fc");
      assert.equal(analisis.hoy.fc, fc, "motor");
      assert.equal(analisis.hoyReposo.fc, fc, "/control");
      assert.equal(t.valor, fc, "tarjeta");
      assert.equal(t.texto, String(fc), "número grande de Inicio y Análisis");
      const ctx = contextoFicha("fc", analisis, data);
      assert.equal(ctx.lectura.fc, fc, "ficha");
      assert.match(evaluarFicha("fc", { contexto: ctx, respuestas: {} }).frase, new RegExp(`HR is at ${fc} bpm`));
      if (nombre === "con fiebre de en_vivo") assert.equal(analisis.hoy.temperatura, 36.5);
    });
  }
}

test("Todos los signos escritos se ven exactos aunque haya ejercicio", () => {
  const vivo = { fc: 72, frec_resp: 15, temperatura: 36.6, sistolica: 118, diastolica: 76, spo2: 97 };
  const data = combinarEnVivo(datosReyes({ estado: "ejercicio", desde: hace(4), fiebre: true }), Object.entries(vivo).map(([k, v]) => fila(k, v)));
  const a = analizar(data);
  for (const [k, v] of Object.entries(vivo)) assert.equal(a.hoy[k], v, k);
  assert.equal(a.actividad.estado, "ejercicio");
  assert.equal(a.interpretaciones.fc ? typeof a.interpretaciones.fc.conclusion : "string", "string");
});

test("Una medición tomada después del valor de /control manda; una anterior no", () => {
  const base = datosReyes();
  const hoy = base.vitals.at(-1).fecha;
  const med = (min, fc) => ({ id: `r${min}`, astronaut_id: 1, tipo: "remedicion", fecha: hoy, creada_en: hace(min), resultado: { despues: { fc } } });
  const vieja = combinarEnVivo({ ...base, pruebas: [...base.pruebas, med(30, 61)] }, [fila("fc", 60, hace(5))]);
  assert.equal(analizar(vieja).hoy.fc, 60);
  const nueva = combinarEnVivo({ ...base, pruebas: [...base.pruebas, med(1, 64)] }, [fila("fc", 60, hace(5))]);
  assert.equal(analizar(nueva).hoy.fc, 64);
});

test("Sin valor escrito, el ejercicio sigue moviendo la FC simulada", () => {
  const sin = analizar(datosReyes());
  const con = analizar(datosReyes({ estado: "ejercicio", desde: hace(5) }));
  assert.ok(con.hoy.fc > sin.hoy.fc + 20);
});
