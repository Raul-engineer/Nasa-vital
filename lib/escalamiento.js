import { ETIQUETA_NIVEL, FICHAS, limpiarRespuestas, pasosDeEvento, subirNivel, TITULOS } from "./fichas.js";

export const REVISION_MS = 15000;
export const SIN_TOCAR_MIN = { urgente: 10, emergencia: 2 };
const MIN = 6e4;

export function pasosHechos(pasos = [], eventoId = null) {
  return new Set(pasos.filter((p) => (eventoId == null || p.evento_id === eventoId) && !String(p.nota || "").startsWith("no:")).map((p) => p.paso_id));
}

export function revisarEvento(evento, { pasos = [], ahora = Date.now() } = {}) {
  if (!evento || evento.cerrado_en) return null;
  const m = evento.respuestas?._m || {};
  const inicio = Date.parse(evento.abierto_en) || ahora;
  const hechos = pasosHechos(pasos, evento.id);
  const escalados = new Set(m.escalados || []);
  const avisados = new Set((m.avisos || []).map((a) => a.id));
  const titulo = TITULOS[evento.clave] || evento.clave;
  const t = new Date(ahora).toISOString();
  let nivel = evento.nivel;
  const nuevos = [];
  const avisos = [];

  for (const p of pasosDeEvento(evento)) {
    if (!p.obligatorio || p.minutos == null || hechos.has(p.id) || escalados.has(p.id)) continue;
    if (ahora - inicio < p.minutos * MIN) continue;
    nivel = subirNivel(nivel);
    nuevos.push(p.id);
    avisos.push({ id: `esc.${p.id}`, t, nivel, sonar: true, texto: `${titulo}: paso sin marcar a tiempo (${p.texto}). Sube a ${ETIQUETA_NIVEL[nivel]}.` });
  }

  const limite = FICHAS[evento.clave]?.limiteRespuestaMin;
  if (limite && !escalados.has("sin_respuesta") && !Object.keys(limpiarRespuestas(evento.respuestas)).length && ahora - inicio >= limite * MIN) {
    nivel = "emergencia";
    nuevos.push("sin_respuesta");
    avisos.push({ id: "esc.sin_respuesta", t, nivel, sonar: true, texto: `${titulo}: sin respuesta en ${limite} min. Se trata como emergencia.` });
  }

  const toque = Date.parse(m.toque) || inicio;
  const lim = SIN_TOCAR_MIN[nivel];
  const idToque = `toque.${nivel}.${m.toque || evento.abierto_en}`;
  if (lim && ahora - toque >= lim * MIN && !avisados.has(idToque)) {
    avisos.push({ id: idToque, t, nivel, sonar: true, texto: `${titulo}: ${ETIQUETA_NIVEL[nivel].toLowerCase()} sin atender en ${lim} min.` });
  }

  if (!nuevos.length && !avisos.length) return null;
  return {
    nivel,
    avisos,
    respuestas: { ...(evento.respuestas || {}), _m: { ...m, nivelMin: nuevos.length ? nivel : m.nivelMin || null, escalados: [...escalados, ...nuevos], avisos: [...(m.avisos || []), ...avisos].slice(-30) } },
  };
}

export function ultimoAviso(eventos = []) {
  let mejor = null;
  for (const e of eventos) {
    if (e.cerrado_en) continue;
    for (const a of e.respuestas?._m?.avisos || []) if (!mejor || a.t > mejor.t) mejor = { ...a, evento: e.id, clave: e.clave };
  }
  return mejor;
}
