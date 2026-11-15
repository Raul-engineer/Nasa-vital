import { fechaLocal, mediana } from "./analysis.js";
import { mayorNivel, RANGO_NIVEL } from "./fichas.js";
import { diasFijos, PRUEBAS_CATALOGO, PRUEBAS_POR_ID } from "./pruebas.js";
import { entradaCombinaciones, evaluarCombinaciones } from "./combinaciones.js";

export const METRICAS_CATEGORIA = { corazon: ["fc", "pa", "fr", "spo2"], mente: ["temp", "conciencia", "sueno", "animo"], espacio: ["radiacion", "vision", "huesos", "cabina"], diario: [] };
export const FICHAS_DIARIO = ["animo", "conciencia", "vision", "temp"];
export const NIVELES_ALERTA = ["critico", "urgente", "moderado", "info"];
export const CAMPOS_DIARIO = [
  { clave: "animo", nombre: "Mood", mejor: "alto", bien: (v) => v >= 3 },
  { clave: "estres", nombre: "Stress", mejor: "bajo", bien: (v) => v <= 3 },
  { clave: "fatiga", nombre: "Fatigue", mejor: "bajo", bien: (v) => v <= 3 },
  { clave: "tripulacion", nombre: "Crew", mejor: "alto", bien: (v) => v >= 3 },
];
const SERIES = {
  fc: { nombre: "HR", unidad: "bpm", mejor: "rango", de: (v) => v.fc },
  pa: { nombre: "Systolic", unidad: "mmHg", mejor: "rango", de: (v) => v.sistolica },
  fr: { nombre: "RR", unidad: "br/min", mejor: "rango", de: (v) => v.frec_resp },
  spo2: { nombre: "SpO₂", unidad: "%", mejor: "alto", de: (v) => v.spo2 },
  temp: { nombre: "Temperature", unidad: "°C", mejor: "rango", de: (v) => v.temperatura },
  sueno: { nombre: "Sleep", unidad: "h", mejor: "alto", de: (v) => v.horas_sueno },
  radiacion: { nombre: "Radiation", unidad: "µSv/h", mejor: "bajo", de: (v) => (v.dosis_dia_msv == null ? null : (Number(v.dosis_dia_msv) * 1000) / 24) },
  huesos: { nombre: "Exercise", unidad: "min", mejor: "alto", de: (v) => v.minutos_ejercicio },
};
export const MEJOR_PRUEBA = { who5: "alto", spo2_confirmacion: "alto", recuperacion_fc: "alto", agudeza: "alto", agarre: "alto", ejercicio_registro: "alto", diario_sueno: "alto" };
export const CORTO = { fc: "HR", pa: "Pressure", fr: "RR", spo2: "SpO₂", temp: "Temperature", conciencia: "Consciousness", sueno: "Sleep", animo: "Mood", radiacion: "Radiation", vision: "Vision", huesos: "Bones", cabina: "Cabin" };
const DIA = 864e5;
const num = (x) => (x == null || x === "" || Number.isNaN(Number(x)) ? null : Number(x));
const prom = (xs) => {
  const v = xs.map(num).filter((x) => x != null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};
const r1 = (x) => (x == null ? null : Math.round(x * 10) / 10);

export function categoriaDeMetrica(k) {
  return Object.keys(METRICAS_CATEGORIA).find((c) => METRICAS_CATEGORIA[c].includes(k)) || null;
}

export function registrosDeDias(porDia) {
  const out = [];
  for (const [fecha, a] of porDia || []) {
    if (!a?.suficiente) continue;
    for (const [k, g] of Object.entries(a.gravedades || {})) if (g && g !== "ok") out.push({ fecha, categoria: categoriaDeMetrica(k), nivel: g, fuente: "metrica", clave: k });
  }
  return out;
}

export function registrosDeResultados(historial = []) {
  return historial.map((r) => ({ fecha: fechaLocal(r.hecho_en), categoria: PRUEBAS_POR_ID[r.prueba_id]?.categoria || null, nivel: r.nivel in RANGO_NIVEL ? r.nivel : "ok", fuente: "prueba", prueba_id: r.prueba_id, resultado: r }));
}

export function enRango(registros = [], dias = null, ahora = Date.now()) {
  if (!dias) return registros;
  const desde = fechaLocal(new Date(ahora - (dias - 1) * DIA).toISOString());
  return registros.filter((r) => r.fecha >= desde);
}

export function peorPorDia(registros = [], categoria = null) {
  const m = new Map();
  for (const r of registros) {
    if (categoria && r.categoria !== categoria) continue;
    m.set(r.fecha, mayorNivel(m.get(r.fecha) || "ok", r.nivel));
  }
  return m;
}

export function cambioPct(anterior, actual) {
  if (anterior == null || actual == null || !anterior) return null;
  return Math.round(((actual - anterior) / anterior) * 100);
}

export function partirSemanas(fechas = []) {
  return { actual: fechas.slice(-7), anterior: fechas.slice(-14, -7) };
}

export function formaSemana(items = [], fechas = []) {
  const { actual, anterior } = partirSemanas(fechas);
  const pct = (it, fs) => {
    const v = fs.map((f) => it.enRango(f)).filter((x) => x === true || x === false);
    return v.length ? Math.round((v.filter(Boolean).length / v.length) * 100) : 0;
  };
  return items.map((it) => ({ metrica: it.nombre, actual: pct(it, actual), anterior: pct(it, anterior) }));
}

export function itemsForma(categoria, { porDia, data }) {
  if (categoria === "diario") {
    const ci = new Map((data?.checkins || []).map((c) => [c.fecha, c]));
    return CAMPOS_DIARIO.map((c) => ({ nombre: c.nombre, enRango: (f) => { const v = num(ci.get(f)?.[c.clave]); return v == null ? null : c.bien(v); } }));
  }
  return METRICAS_CATEGORIA[categoria].map((k) => ({ nombre: CORTO[k], enRango: (f) => { const a = porDia?.get(f); return a?.suficiente ? (a.gravedades?.[k] || "ok") === "ok" : null; } }));
}

export function repartoDia(categoria, data, fechas = []) {
  const { actual } = partirSemanas(fechas);
  const vit = (data?.vitals || []).filter((v) => actual.includes(v.fecha));
  if (categoria === "corazon") {
    const ej = (prom(vit.map((v) => v.minutos_ejercicio)) || 0) / 60;
    return [{ nombre: "Exercise", valor: r1(ej), unidad: "h", color: "ok" }, { nombre: "Rest", valor: r1(24 - ej), unidad: "h", color: "muted" }];
  }
  if (categoria === "mente") {
    const s = prom(vit.map((v) => v.horas_sueno)) || 0;
    return [{ nombre: "Sleep", valor: r1(s), unidad: "h", color: "info" }, { nombre: "Awake", valor: r1(24 - s), unidad: "h", color: "muted" }];
  }
  if (categoria === "espacio") {
    const meta = Number(data?.profile?.ejercicio_prescrito_min) || 120;
    const e = prom(vit.map((v) => v.minutos_ejercicio)) || 0;
    return [{ nombre: "Exercise done", valor: Math.round(Math.min(e, meta)), unidad: "min", color: "ok" }, { nombre: "Left to reach the goal", valor: Math.round(Math.max(0, meta - e)), unidad: "min", color: "muted" }];
  }
  const hechos = (data?.checkins || []).filter((c) => actual.includes(c.fecha)).length;
  return [{ nombre: "Check-ins done", valor: hechos, unidad: "", color: "ok" }, { nombre: "Missing", valor: Math.max(0, actual.length - hechos), unidad: "", color: "muted" }];
}

function mejora(mejor, anterior, actual, centro) {
  if (anterior == null || actual == null || anterior === actual) return null;
  if (mejor === "alto") return actual > anterior;
  if (mejor === "bajo") return actual < anterior;
  return Math.abs(actual - centro) < Math.abs(anterior - centro);
}

export function semanaContraSemana(categoria, { data, porDia, fechas = [] }) {
  const { actual, anterior } = partirSemanas(fechas);
  if (categoria === "diario") {
    const ci = data?.checkins || [];
    return CAMPOS_DIARIO.map((c) => {
      const a = prom(ci.filter((x) => anterior.includes(x.fecha)).map((x) => x[c.clave]));
      const b = prom(ci.filter((x) => actual.includes(x.fecha)).map((x) => x[c.clave]));
      return { clave: c.clave, nombre: c.nombre, anterior: r1(a), actual: r1(b), unidad: "/5", cambio: cambioPct(a, b), mejora: mejora(c.mejor, a, b) };
    });
  }
  return METRICAS_CATEGORIA[categoria].map((k) => {
    const s = SERIES[k];
    if (k === "cabina") {
      const cab = data?.cabina || [];
      const a = prom(cab.filter((x) => anterior.includes(x.fecha)).map((x) => x.co2_ppm));
      const b = prom(cab.filter((x) => actual.includes(x.fecha)).map((x) => x.co2_ppm));
      return { clave: k, nombre: "CO₂", anterior: a == null ? null : Math.round(a), actual: b == null ? null : Math.round(b), unidad: "ppm", cambio: cambioPct(a, b), mejora: mejora("bajo", a, b) };
    }
    if (k === "animo") {
      const ci = data?.checkins || [];
      const a = prom(ci.filter((x) => anterior.includes(x.fecha)).map((x) => x.animo));
      const b = prom(ci.filter((x) => actual.includes(x.fecha)).map((x) => x.animo));
      return { clave: k, nombre: "Mood", anterior: r1(a), actual: r1(b), unidad: "/5", cambio: cambioPct(a, b), mejora: mejora("alto", a, b) };
    }
    if (!s) {
      const cuenta = (fs) => fs.filter((f) => { const g = porDia?.get(f)?.gravedades?.[k]; return g && g !== "ok"; }).length;
      const a = cuenta(anterior), b = cuenta(actual);
      return { clave: k, nombre: `${CORTO[k]} · days on alert`, anterior: a, actual: b, unidad: "days", cambio: cambioPct(a, b), mejora: mejora("bajo", a, b) };
    }
    const vit = data?.vitals || [];
    const a = prom(vit.filter((v) => anterior.includes(v.fecha)).map(s.de));
    const b = prom(vit.filter((v) => actual.includes(v.fecha)).map(s.de));
    const centro = prom(vit.map(s.de));
    return { clave: k, nombre: s.nombre, anterior: r1(a), actual: r1(b), unidad: s.unidad, cambio: cambioPct(a, b), mejora: mejora(s.mejor, a, b, centro) };
  });
}

export function combinacionesSemana(categoria, { data, porDia, fechas = [], eventosFicha = [] }) {
  const claves = categoria === "diario" ? FICHAS_DIARIO : METRICAS_CATEGORIA[categoria];
  const { actual } = partirSemanas(fechas);
  const dias = new Map();
  const anotar = (c, f) => {
    if (!(c.fichas || []).some((k) => claves.includes(k))) return;
    const x = dias.get(c.id) || { id: c.id, titulo: c.titulo, nivel: c.nivel, fechas: new Set() };
    x.fechas.add(f);
    x.nivel = mayorNivel(x.nivel, c.nivel);
    dias.set(c.id, x);
  };
  for (const f of actual) {
    const a = porDia?.get(f);
    if (!a?.suficiente) continue;
    const dataDia = { ...data, enVivo: {}, vitals: (data?.vitals || []).filter((v) => v.fecha <= f), pruebas: (data?.pruebas || []).filter((p) => p.fecha <= f) };
    for (const c of evaluarCombinaciones(entradaCombinaciones({ analisis: a, data: dataDia }))) anotar(c, f);
  }
  for (const e of eventosFicha) {
    const f = fechaLocal(e.abierto_en);
    if (!actual.includes(f)) continue;
    for (const c of e.combinaciones || []) anotar(c, f);
  }
  return [...dias.values()].map((x) => ({ id: x.id, titulo: x.titulo, nivel: x.nivel, veces: x.fechas.size })).sort((a, b) => b.veces - a.veces || a.id - b.id);
}

export function datosDePrueba(historial = [], id) {
  return historial.filter((r) => r.prueba_id === id);
}

export function debidas(prueba, { dias = 30, diaMision = null, diaRegreso = 180 } = {}) {
  const iv = prueba?.intervalo || { tipo: "libre" };
  if (iv.tipo === "diaria") return dias;
  if (iv.tipo === "dias") return Math.max(1, Math.floor(dias / iv.valor));
  if (iv.tipo === "horas") return Math.max(1, Math.floor((dias * 24) / iv.valor));
  if (iv.tipo === "mision" && diaMision != null) return diasFijos(iv, diaRegreso).filter((d) => d <= diaMision && d > diaMision - dias).length || null;
  return null;
}

export function statsPrueba(id, historial = [], { dias = null, ahora = Date.now(), diaMision = null, diaRegreso = 180 } = {}) {
  const prueba = PRUEBAS_POR_ID[id];
  const todas = datosDePrueba(historial, id);
  const desde = dias ? ahora - dias * DIA : -Infinity;
  const enR = todas.filter((r) => Date.parse(r.hecho_en) >= desde);
  const valores = enR.map((r) => num(r.valor?.resultado?.valor)).filter((x) => x != null);
  const alto = (MEJOR_PRUEBA[id] || "bajo") === "alto";
  const deb = debidas(prueba, { dias: dias || 90, diaMision, diaRegreso });
  const v7 = todas.filter((r) => ahora - Date.parse(r.hecho_en) <= 7 * DIA).map((r) => r.valor?.resultado?.valor);
  const vPrev = todas.filter((r) => { const d = ahora - Date.parse(r.hecho_en); return d > 7 * DIA && d <= 14 * DIA; }).map((r) => r.valor?.resultado?.valor);
  const p7 = prom(v7), pPrev = prom(vPrev);
  return {
    veces: enR.length, debidas: deb, hechas: deb != null ? Math.min(enR.length, deb) : enR.length, cumplimiento: deb ? Math.round((Math.min(enR.length, deb) / deb) * 100) : null,
    mejor: valores.length ? (alto ? Math.max(...valores) : Math.min(...valores)) : null, peor: valores.length ? (alto ? Math.min(...valores) : Math.max(...valores)) : null,
    prom7: r1(p7), promPrev7: r1(pPrev), cambio: cambioPct(pPrev, p7), mediana: valores.length ? mediana(valores) : null,
  };
}

const DIAS_SEM = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export function porDiaSemana(serie = []) {
  return DIAS_SEM.map((dia, i) => {
    const v = serie.filter((x) => (new Date(x.fecha + "T12:00:00").getDay() + 6) % 7 === i).map((x) => x.valor);
    return { dia, promedio: r1(prom(v)), veces: v.length };
  });
}

export function serieDePrueba(id, historial = []) {
  return datosDePrueba(historial, id).map((r) => ({ id: r.id, fecha: fechaLocal(r.hecho_en), hecho_en: r.hecho_en, valor: Number(r.valor?.resultado?.valor), nivel: r.nivel, texto: r.valor?.resultado?.texto || "", desde_ficha: r.desde_ficha, origen: r.valor?.origen || (r.legado ? "laptop" : "laptop"), fila: r })).filter((x) => Number.isFinite(x.valor));
}

export function pruebasDeCategoria(categoria) {
  return PRUEBAS_CATALOGO.filter((p) => p.categoria === categoria);
}
