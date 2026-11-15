import { fechaLocal } from "./analysis.js";
import { mayorNivel, RANGO_NIVEL } from "./fichas.js";
import { PRUEBAS_CATALOGO, PRUEBAS_POR_ID } from "./pruebas.js";

export const METRICAS_CATEGORIA = { corazon: ["fc", "pa", "fr", "spo2"], mente: ["temp", "conciencia", "sueno", "animo"], espacio: ["radiacion", "vision", "huesos", "cabina"], diario: [] };
export const NIVELES_ALERTA = ["critico", "urgente", "moderado", "info"];
const DIA = 864e5;

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

export function semanaDe(fecha) {
  const d = new Date(fecha + "T12:00:00");
  const lunes = new Date(d);
  lunes.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return fechaLocal(lunes.toISOString());
}

export function alertasPorSemana(registros = [], categoria = null) {
  const m = new Map();
  for (const r of registros) {
    if ((categoria && r.categoria !== categoria) || !NIVELES_ALERTA.includes(r.nivel)) continue;
    const s = semanaDe(r.fecha);
    const fila = m.get(s) || { semana: s, critico: 0, urgente: 0, moderado: 0, info: 0 };
    fila[r.nivel]++;
    m.set(s, fila);
  }
  return [...m.values()].sort((a, b) => a.semana.localeCompare(b.semana)).map((f) => ({ ...f, etiqueta: new Date(f.semana + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" }) }));
}

export function conteoPorNivel(registros = [], categoria = null) {
  const c = { critico: 0, urgente: 0, moderado: 0, info: 0 };
  for (const r of registros) if ((!categoria || r.categoria === categoria) && r.nivel in c) c[r.nivel]++;
  return c;
}

export function cumplimiento(historial = [], { categoria = null, dias = 30, ahora = Date.now(), diaMision = null } = {}) {
  const desde = ahora - dias * DIA;
  let debidas = 0, hechas = 0;
  for (const p of PRUEBAS_CATALOGO) {
    if (categoria && p.categoria !== categoria) continue;
    const f = p.frecuencia.tipo;
    let d = 0;
    if (f === "diaria") d = dias;
    else if (f === "semanal") d = Math.max(1, Math.floor(dias / 7));
    else if (f === "mision" && diaMision != null) d = (p.frecuencia.dias || []).filter((x) => x <= diaMision && x > diaMision - dias).length;
    if (!d) continue;
    const n = historial.filter((r) => r.prueba_id === p.id && Date.parse(r.hecho_en) >= desde).length;
    debidas += d;
    hechas += Math.min(n, d);
  }
  return { hechas, debidas, pct: debidas ? Math.round((hechas / debidas) * 100) : null };
}

export function resumenFichas(eventos = [], { dias = null, ahora = Date.now() } = {}) {
  const desde = dias ? ahora - dias * DIA : 0;
  const lista = eventos.filter((e) => Date.parse(e.abierto_en) >= desde);
  const resueltas = lista.filter((e) => e.cierre === "resuelto");
  const escaladas = lista.filter((e) => e.cierre === "escalado" || (e.respuestas?._m?.escalados || []).length > 0);
  const tiempos = resueltas.map((e) => (Date.parse(e.cerrado_en) - Date.parse(e.abierto_en)) / 6e4).filter((x) => Number.isFinite(x) && x >= 0);
  return { total: lista.length, resueltas: resueltas.length, escaladas: escaladas.length, promedioMin: tiempos.length ? Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length) : null };
}

export function serieDeMetrica(clave, data, porDia) {
  const campo = { fc: "fc", pa: "sistolica", fr: "frec_resp", spo2: "spo2", temp: "temperatura", sueno: "horas_sueno", huesos: "minutos_ejercicio" }[clave];
  return (data?.vitals || []).map((v) => ({ fecha: v.fecha, valor: campo ? Number(v[campo]) : null, nivel: porDia?.get(v.fecha)?.gravedades?.[clave] || "ok" })).filter((x) => x.valor != null && Number.isFinite(x.valor));
}

export function serieDePrueba(id, historial = []) {
  return historial.filter((r) => r.prueba_id === id).map((r) => ({ fecha: fechaLocal(r.hecho_en), hecho_en: r.hecho_en, valor: Number(r.valor?.resultado?.valor), nivel: r.nivel, texto: r.valor?.resultado?.texto || "", desde_ficha: r.desde_ficha })).filter((x) => Number.isFinite(x.valor));
}
