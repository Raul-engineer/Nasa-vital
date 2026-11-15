"use client";
import { createClient } from "@supabase/supabase-js";
import { generateMock, isoDate } from "./mockData.js";
import { validarLectura } from "./validar.js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const supabase = URL && KEY ? createClient(URL, KEY) : null;
export const MODO = supabase ? "supabase" : "local";

const LS_KEY = "quickfix_local_v1";
const VACIO = () => ({ alerts: [], checkins: [], resolved: [], profiles: {}, historias: {}, pruebas: [], eventos: [], actividad: {}, en_vivo: {}, fichas: { eventos: [], pasos: [], medicamentos: [] }, resultados: [] });
const ACTIVIDAD_INICIAL = (id) => ({ astronaut_id: id, estado: "reposo", desde: null, fiebre: false });
const TIEMPO_MAX_MS = 9000;
const REINTENTO_MS = 30000;
let mockBase = null;
let channel = null;
let caido = false;
let reintento = null;
const estadosCanal = new Map();
const oyentesConexion = new Set();

function local() {
  if (!mockBase) mockBase = generateMock();
  let extra = VACIO();
  try {
    extra = { ...VACIO(), ...(JSON.parse(localStorage.getItem(LS_KEY)) || {}) };
  } catch {}
  return { base: mockBase, extra };
}
function saveExtra(extra) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(extra));
  } catch {}
  notifyLocal();
}
function getChannel() {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) return null;
  if (!channel) channel = new BroadcastChannel("quickfix");
  return channel;
}
const localListeners = new Set();
function notifyLocal() {
  localListeners.forEach((cb) => cb());
  getChannel()?.postMessage("changed");
}

export function conexion() {
  const estados = [...estadosCanal.values()];
  const realtime = !supabase || caido ? "local" : estados.includes("SUBSCRIBED") ? "conectado" : estados.some((s) => s === "CHANNEL_ERROR" || s === "TIMED_OUT") ? "desconectado" : "conectando";
  return { modo: !supabase ? "local" : caido ? "respaldo" : "supabase", caido, realtime };
}
export function onConexion(cb) {
  oyentesConexion.add(cb);
  return () => oyentesConexion.delete(cb);
}
function avisarConexion() {
  const c = conexion();
  oyentesConexion.forEach((cb) => cb(c));
}
function db() {
  return supabase && !caido ? supabase : null;
}
function esErrorRed(e) {
  const m = `${e?.name || ""} ${e?.message || ""} ${e?.details || ""}`;
  return /Failed to fetch|NetworkError|fetch failed|Load failed|timed out|tiempo agotado|AbortError|ERR_/i.test(m);
}
function caer(e) {
  if (!supabase) return;
  console.warn("QuickFix: no Supabase connection, using local data.", e?.message || e);
  if (!caido) {
    caido = true;
    avisarConexion();
  }
  if (reintento || typeof window === "undefined") return;
  reintento = setInterval(async () => {
    try {
      const { error } = await conTiempo(supabase.from("astronauts").select("id").limit(1), TIEMPO_MAX_MS);
      if (error) return;
      caido = false;
      clearInterval(reintento);
      reintento = null;
      avisarConexion();
      notifyLocal();
    } catch {}
  }, REINTENTO_MS);
}
function conTiempo(promesa, ms) {
  let t;
  return Promise.race([promesa, new Promise((_, rej) => { t = setTimeout(() => rej(new Error("timed out")), ms); })]).finally(() => clearTimeout(t));
}

export function resetLocal() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {}
  notifyLocal();
}

const CAMPOS_CHECKIN = ["animo", "estres", "fatiga", "tiempo_reaccion_ms", "confusion", "vision_cefalea", "mareo_de_pie", "tripulacion", "sintomas", "vision_borrosa", "dolor_cabeza", "nota"];
const CAMPOS_PERFIL = [
  "edad", "sexo", "peso_kg", "estatura_cm", "tipo_sangre", "alergias", "medicamentos", "condiciones_cronicas",
  "fc_basal", "pa_basal", "spo2_basal", "dosis_carrera_previa_msv", "misiones_previas", "dias_espacio_previos",
  "usa_lentes", "contacto_emergencia", "ejercicio_prescrito_min",
];
const CAMPOS_HISTORIA = ["heredofamiliares", "personales_patologicos", "no_patologicos", "padecimiento_actual", "interrogatorio_sistemas", "espacial"];
const pick = (o, campos) => Object.fromEntries(campos.filter((k) => o[k] !== undefined).map((k) => [k, o[k]]));

const VITALES_VIVO = ["fc", "vfc", "sistolica", "diastolica", "frec_resp", "spo2", "temperatura", "horas_sueno"];
const CHECKIN_NUM_VIVO = { estres: "estres", tripulacion: "tripulacion", animo: "animo", fatiga: "fatiga", reaccion: "tiempo_reaccion_ms" };
const CHECKIN_BOOL_VIVO = ["confusion", "mareo_de_pie", "vision_borrosa", "dolor_cabeza"];

export function combinarEnVivo(d, filas) {
  if (!filas?.length) return { ...d, enVivo: {}, enVivoT: {}, sensor: [] };
  const ev = {};
  const t = {};
  for (const f of filas) {
    ev[f.clave] = f.valor;
    t[f.clave] = f.updated_at;
  }
  const n0 = (k) => (ev[k] !== null && ev[k] !== undefined && ev[k] !== "" && Number.isFinite(Number(ev[k])) ? Number(ev[k]) : undefined);
  const id = d.astronaut?.id;
  const vitals = [...d.vitals];
  const ult = vitals.length ? { ...vitals[vitals.length - 1] } : null;
  const efectivo = { ...(ult || {}) };
  for (const k of VITALES_VIVO) if (n0(k) !== undefined) efectivo[k] = n0(k);
  const revision = validarLectura(efectivo);
  const sensor = revision.errores.filter((e) => n0(e.campo) !== undefined || (e.par && n0(e.par) !== undefined));
  const invalidos = new Set(sensor.flatMap((e) => [e.campo, e.par].filter(Boolean)));
  const n = (k) => (invalidos.has(k) ? undefined : n0(k));
  const fecha = ult?.fecha || isoDate(0);
  if (ult) {
    for (const k of VITALES_VIVO) if (n(k) !== undefined) ult[k] = n(k);
    if (n("tasa_radiacion") !== undefined) ult.dosis_dia_msv = (n("tasa_radiacion") * 24) / 1000;
    if (n("ejercicio_pct") !== undefined) {
      const presc = Number(d.profile?.ejercicio_prescrito_min) || 120;
      const total = Math.round((n("ejercicio_pct") / 100) * presc);
      ult.minutos_ejercicio = total;
      ult.ejercicio_fuerza_min = Math.round(total * 0.55);
      ult.ejercicio_cardio_min = total - ult.ejercicio_fuerza_min;
    }
    vitals[vitals.length - 1] = ult;
  }
  const iCi = d.checkins.findIndex((c) => c.fecha === fecha);
  const ci = { ...(iCi >= 0 ? d.checkins[iCi] : { astronaut_id: id, fecha }) };
  for (const [k, campo] of Object.entries(CHECKIN_NUM_VIVO)) if (n(k) !== undefined) ci[campo] = n(k);
  for (const k of CHECKIN_BOOL_VIVO) if (typeof ev[k] === "boolean") ci[k] = ev[k];
  if (Array.isArray(ev.sintomas)) ci.sintomas = ev.sintomas;
  const checkins = iCi >= 0 ? d.checkins.map((c, i) => (i === iCi ? ci : c)) : [...d.checkins, ci];
  let cabina = d.cabina || [];
  if (n("co2_ppm") !== undefined || n("temp_cabina") !== undefined || n("humedad_cabina") !== undefined) {
    const iCab = cabina.findIndex((c) => c.fecha === fecha);
    const fila = { ...(iCab >= 0 ? cabina[iCab] : { astronaut_id: id, fecha }) };
    if (n("co2_ppm") !== undefined) fila.co2_ppm = n("co2_ppm");
    if (n("temp_cabina") !== undefined) fila.temp_c = n("temp_cabina");
    if (n("humedad_cabina") !== undefined) fila.humedad = n("humedad_cabina");
    cabina = iCab >= 0 ? cabina.map((c, i) => (i === iCab ? fila : c)) : [...cabina, fila];
  }
  const pruebas = [...(d.pruebas || [])];
  if (n("who5") !== undefined) pruebas.push({ id: "vivo-who5", astronaut_id: id, tipo: "who5", fecha, resultado: { puntaje: n("who5") }, interpretacion: `WHO-5: ${n("who5")}/100 · live`, desenlace: null, creada_en: t.who5 || new Date().toISOString() });
  if (n("sistolica") !== undefined || n("diastolica") !== undefined) {
    const cuando = [t.sistolica, t.diastolica].filter(Boolean).sort().at(-1) || new Date().toISOString();
    pruebas.push({ id: "vivo-presion", astronaut_id: id, tipo: "presion", fecha, resultado: { sistolica: n("sistolica") ?? ult?.sistolica, diastolica: n("diastolica") ?? ult?.diastolica }, interpretacion: "Live blood pressure", desenlace: null, creada_en: cuando });
  }
  let actividad = d.actividad;
  if (ev.actividad && typeof ev.actividad === "object") actividad = { ...actividad, ...ev.actividad };
  if (typeof ev.fiebre === "boolean") actividad = { ...actividad, fiebre: ev.fiebre };
  return { ...d, vitals, checkins, cabina, pruebas, actividad, enVivo: ev, enVivoT: t, sensor };
}

function filasLocales(extra, id) {
  return Object.entries(extra.en_vivo?.[id] || {}).map(([clave, x]) => ({ astronaut_id: id, clave, valor: x.valor, updated_at: x.t }));
}

function datosLocales(id) {
  const { base, extra } = local();
  const checkins = base.checkins
    .filter((x) => x.astronaut_id === id)
    .map((x) => extra.checkins.find((e) => e.astronaut_id === id && e.fecha === x.fecha) || x);
  const alerts = [...extra.alerts, ...base.alerts]
    .filter((x) => x.astronaut_id === id)
    .map((x) => (extra.resolved.includes(x.id) ? { ...x, resuelta: true } : x));
  const d = {
    astronauts: base.astronauts,
    astronaut: base.astronauts.find((x) => x.id === id) || base.astronauts[0],
    vitals: base.vitals.filter((x) => x.astronaut_id === id),
    checkins,
    protocols: base.protocols,
    alerts,
    profile: extra.profiles[id] || base.profiles.find((x) => x.astronaut_id === id) || { astronaut_id: id, alergias: [] },
    historia: extra.historias[id] || base.historias.find((x) => x.astronaut_id === id) || { astronaut_id: id },
    pruebas: [...base.pruebas, ...extra.pruebas].filter((x) => x.astronaut_id === id),
    eventos: eventosLocales(base, extra),
    cabina: base.cabina.filter((x) => x.astronaut_id === id),
    actividad: extra.actividad[id] || base.actividad.find((x) => x.astronaut_id === id) || ACTIVIDAD_INICIAL(id),
  };
  return combinarEnVivo(d, filasLocales(extra, id));
}

export async function loadData(astronautId) {
  const id = Number(astronautId);
  const cli = db();
  if (cli) {
    try {
      const [a, v, c, p, al, pf, hc, pr, ev, cb, ac, vivo] = await conTiempo(Promise.all([
        cli.from("astronauts").select("*").order("id"),
        cli.from("vitals").select("*").eq("astronaut_id", id).order("fecha"),
        cli.from("checkins").select("*").eq("astronaut_id", id).order("fecha"),
        cli.from("protocols").select("*").order("id"),
        cli.from("alerts").select("*").eq("astronaut_id", id).order("creada_en", { ascending: false }),
        cli.from("profiles").select("*").eq("astronaut_id", id).maybeSingle(),
        cli.from("historia_clinica").select("*").eq("astronaut_id", id).maybeSingle(),
        cli.from("pruebas").select("*").eq("astronaut_id", id).order("creada_en"),
        cli.from("eventos_radiacion").select("*").order("inicio"),
        cli.from("cabina").select("*").eq("astronaut_id", id).order("fecha"),
        cli.from("actividad").select("*").eq("astronaut_id", id).maybeSingle(),
        cli.from("en_vivo").select("*").eq("astronaut_id", id),
      ]), TIEMPO_MAX_MS);
      const err = a.error || v.error || c.error || p.error || al.error || pf.error || hc.error || pr.error || ev.error || cb.error;
      if (err) throw err;
      if (!a.data?.length || !v.data?.length) throw new Error("The database has no astronauts or vital signs");
      const d = {
        astronauts: a.data,
        astronaut: a.data.find((x) => x.id === id) || a.data[0],
        vitals: v.data,
        checkins: c.data,
        protocols: p.data,
        alerts: al.data,
        profile: pf.data || { astronaut_id: id, alergias: [], medicamentos: [], condiciones_cronicas: [] },
        historia: hc.data || { astronaut_id: id },
        pruebas: pr.data,
        eventos: ev.data,
        cabina: cb.data,
        actividad: (!ac.error && ac.data) || ACTIVIDAD_INICIAL(id),
      };
      return combinarEnVivo(d, (!vivo.error && vivo.data) || []);
    } catch (e) {
      caer(e);
    }
  }
  return datosLocales(id);
}

async function escribir(fnRemota, fnLocal) {
  const cli = db();
  if (cli) {
    try {
      const { error } = await conTiempo(fnRemota(cli), TIEMPO_MAX_MS);
      if (!error) {
        notifyLocal();
        return;
      }
      if (!esErrorRed(error)) throw error;
      caer(error);
    } catch (e) {
      if (!esErrorRed(e)) throw e;
      caer(e);
    }
  }
  fnLocal(local());
}

export async function leerEnVivo(astronautId) {
  const id = Number(astronautId);
  const cli = db();
  if (cli) {
    try {
      const { data, error } = await conTiempo(cli.from("en_vivo").select("*").eq("astronaut_id", id), TIEMPO_MAX_MS);
      if (!error) return Object.fromEntries((data || []).map((f) => [f.clave, f.valor]));
    } catch {}
  }
  return Object.fromEntries(filasLocales(local().extra, id).map((f) => [f.clave, f.valor]));
}

export async function setEnVivoVarios(astronautId, valores) {
  const id = Number(astronautId);
  const ahora = new Date().toISOString();
  const filas = Object.entries(valores).map(([clave, valor]) => ({ astronaut_id: id, clave, valor, updated_at: ahora }));
  if (!filas.length) return;
  await escribir(
    (cli) => cli.from("en_vivo").upsert(filas, { onConflict: "astronaut_id,clave" }),
    ({ extra }) => {
      const propias = { ...(extra.en_vivo[id] || {}) };
      for (const f of filas) propias[f.clave] = { valor: f.valor, t: ahora };
      extra.en_vivo = { ...extra.en_vivo, [id]: propias };
      saveExtra(extra);
    }
  );
}

export async function setEnVivo(astronautId, clave, valor) {
  return setEnVivoVarios(astronautId, { [clave]: valor });
}

export const CLAVES_TRIPULACION = ["co2_ppm", "temp_cabina", "humedad_cabina", "alarma_nave", "fase_mision"];

export async function setEnVivoTripulacion(ids, valores) {
  await Promise.all((ids || []).map((id) => setEnVivoVarios(id, valores)));
}

export async function borrarEnVivo(ids, claves) {
  const lista = (ids || []).map(Number);
  if (!lista.length || !claves?.length) return;
  await escribir(
    (cli) => cli.from("en_vivo").delete().in("astronaut_id", lista).in("clave", claves),
    ({ extra }) => {
      const nuevo = { ...extra.en_vivo };
      for (const id of lista) {
        const propias = { ...(nuevo[id] || {}) };
        claves.forEach((c) => delete propias[c]);
        nuevo[id] = propias;
      }
      extra.en_vivo = nuevo;
      saveExtra(extra);
    }
  );
}

export async function loadTripulacion(ids) {
  const datos = await Promise.all((ids || []).map((id) => loadData(id).catch(() => null)));
  return datos.filter(Boolean).map((d) => {
    const v = d.vitals.at(-1) || {};
    return { id: d.astronaut.id, nombre: d.astronaut.nombre, lectura: v, ci: d.checkins.find((c) => c.fecha === v.fecha) || {}, enVivo: d.enVivo || {} };
  });
}

function uuid() {
  const c = typeof globalThis !== "undefined" ? globalThis.crypto : null;
  if (c?.randomUUID) {
    try {
      return c.randomUUID();
    } catch {}
  }
  const b = new Uint8Array(16);
  if (c?.getRandomValues) c.getRandomValues(b);
  else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const sinTablas = new Set();
function esSinTabla(e) {
  return /42P01|PGRST205|PGRST204|does not exist|Could not find the table|schema cache/i.test(`${e?.code || ""} ${e?.message || ""}`);
}
function dbFichas(tabla = "eventos_ficha") {
  return sinTablas.has(tabla) ? null : db();
}
function fichasLocales(extra) {
  return { eventos: [], pasos: [], medicamentos: [], ...(extra.fichas || {}) };
}
async function escribirFicha(fnRemota, fnLocal, tabla = "eventos_ficha") {
  const cli = dbFichas(tabla);
  if (cli) {
    try {
      const { error } = await conTiempo(fnRemota(cli), TIEMPO_MAX_MS);
      if (!error) {
        notifyLocal();
        return;
      }
      if (esSinTabla(error)) sinTablas.add(tabla);
      else if (esErrorRed(error)) caer(error);
      else throw error;
    } catch (e) {
      if (esSinTabla(e)) sinTablas.add(tabla);
      else if (esErrorRed(e)) caer(e);
      else throw e;
    }
  }
  const l = local();
  l.extra.fichas = fichasLocales(l.extra);
  fnLocal(l.extra.fichas);
  saveExtra(l.extra);
}

const ordenDesc = (campo) => (a, b) => String(b[campo] || "").localeCompare(String(a[campo] || ""));

export async function loadFichas(astronautId) {
  const id = Number(astronautId);
  const desde24 = new Date(Date.now() - 24 * 36e5).toISOString();
  const cli = dbFichas();
  if (cli) {
    try {
      const [ev, md, mt] = await conTiempo(Promise.all([
        cli.from("eventos_ficha").select("*").eq("astronaut_id", id).order("abierto_en", { ascending: false }).limit(100),
        cli.from("medicamentos_tomados").select("*").eq("astronaut_id", id).order("tomado_en", { ascending: false }).limit(100),
        cli.from("medicamentos_tomados").select("*").gte("tomado_en", desde24),
      ]), TIEMPO_MAX_MS);
      const err = ev.error || md.error || mt.error;
      if (err) throw err;
      const idsEv = (ev.data || []).map((e) => e.id);
      let pasos = [];
      if (idsEv.length) {
        const ps = await conTiempo(cli.from("pasos_marcados").select("*").in("evento_id", idsEv).order("marcado_en"), TIEMPO_MAX_MS);
        if (ps.error) throw ps.error;
        pasos = ps.data || [];
      }
      return { eventos: ev.data || [], pasos, medicamentos: md.data || [], medicamentosTripulacion: mt.data || [] };
    } catch (e) {
      if (esSinTabla(e)) sinTablas.add("eventos_ficha");
      else if (esErrorRed(e)) caer(e);
      else console.warn("QuickFix: could not read the cards.", e?.message || e);
    }
  }
  const f = fichasLocales(local().extra);
  const eventos = f.eventos.filter((e) => e.astronaut_id === id).sort(ordenDesc("abierto_en"));
  const idsEv = new Set(eventos.map((e) => e.id));
  return {
    eventos,
    pasos: f.pasos.filter((p) => idsEv.has(p.evento_id)).sort((a, b) => String(a.marcado_en).localeCompare(String(b.marcado_en))),
    medicamentos: f.medicamentos.filter((m) => m.astronaut_id === id).sort(ordenDesc("tomado_en")),
    medicamentosTripulacion: f.medicamentos.filter((m) => m.tomado_en >= desde24),
  };
}

export async function abrirEventoFicha({ astronaut_id, clave, nivel, causa = null, respuestas = {}, combinaciones = [] }) {
  const row = { id: uuid(), astronaut_id: Number(astronaut_id), clave, nivel, causa, respuestas, combinaciones, abierto_en: new Date().toISOString(), cerrado_en: null, cierre: null };
  await escribirFicha(
    (cli) => cli.from("eventos_ficha").insert(row),
    (f) => { f.eventos = [...f.eventos, row]; }
  );
  return row;
}

export async function actualizarEventoFicha(id, cambios) {
  const permitidos = Object.fromEntries(Object.entries(cambios || {}).filter(([k]) => ["nivel", "causa", "respuestas", "combinaciones", "cerrado_en", "cierre"].includes(k)));
  if (!Object.keys(permitidos).length) return;
  await escribirFicha(
    (cli) => cli.from("eventos_ficha").update(permitidos).eq("id", id),
    (f) => { f.eventos = f.eventos.map((e) => (e.id === id ? { ...e, ...permitidos } : e)); }
  );
}

export async function guardarRespuestas(id, respuestas) {
  return actualizarEventoFicha(id, { respuestas });
}

export async function cerrarEventoFicha(id, cierre) {
  return actualizarEventoFicha(id, { cerrado_en: new Date().toISOString(), cierre });
}

export async function marcarPaso(evento_id, paso_id, { nota = null, marcado_por = "astronauta" } = {}) {
  const row = { id: uuid(), evento_id, paso_id, marcado_en: new Date().toISOString(), marcado_por, nota };
  await escribirFicha(
    (cli) => cli.from("pasos_marcados").insert(row),
    (f) => { f.pasos = [...f.pasos, row]; },
    "pasos_marcados"
  );
  return row;
}

export async function desmarcarPaso(id) {
  await escribirFicha(
    (cli) => cli.from("pasos_marcados").delete().eq("id", id),
    (f) => { f.pasos = f.pasos.filter((p) => p.id !== id); },
    "pasos_marcados"
  );
}

export async function registrarMedicamento(astronaut_id, nombre) {
  const row = { id: uuid(), astronaut_id: Number(astronaut_id), nombre, tomado_en: new Date().toISOString() };
  await escribirFicha(
    (cli) => cli.from("medicamentos_tomados").insert(row),
    (f) => { f.medicamentos = [...f.medicamentos, row]; },
    "medicamentos_tomados"
  );
  return row;
}

const sinCamposSemilla = ({ diasAtras, hora, ...r }) => r;

export async function loadResultados(astronautId) {
  const id = Number(astronautId);
  const cli = dbFichas("resultados_prueba");
  if (cli) {
    try {
      const { data, error } = await conTiempo(cli.from("resultados_prueba").select("*").eq("astronaut_id", id).order("hecho_en"), TIEMPO_MAX_MS);
      if (error) throw error;
      return data || [];
    } catch (e) {
      if (esSinTabla(e)) sinTablas.add("resultados_prueba");
      else if (esErrorRed(e)) caer(e);
      else console.warn("QuickFix: could not read the results.", e?.message || e);
    }
  }
  const { base, extra } = local();
  const porId = new Map();
  for (const r of [...(base.resultados || []).map(sinCamposSemilla), ...(extra.resultados || [])]) if (r.astronaut_id === id) porId.set(r.id, r);
  return [...porId.values()].sort((a, b) => String(a.hecho_en).localeCompare(String(b.hecho_en)));
}

export async function actualizarResultado(fila, cambios) {
  const permitidos = Object.fromEntries(Object.entries(cambios || {}).filter(([k]) => ["valor", "nivel", "hecho_en", "desde_ficha"].includes(k)));
  const nueva = { ...fila, ...permitidos };
  const cli = dbFichas("resultados_prueba");
  if (cli && !String(fila.id).startsWith("s-")) {
    try {
      const { error } = await conTiempo(cli.from("resultados_prueba").update(permitidos).eq("id", fila.id), TIEMPO_MAX_MS);
      if (!error) {
        notifyLocal();
        return nueva;
      }
      if (esSinTabla(error)) sinTablas.add("resultados_prueba");
      else if (esErrorRed(error)) caer(error);
      else throw error;
    } catch (e) {
      if (esSinTabla(e)) sinTablas.add("resultados_prueba");
      else if (esErrorRed(e)) caer(e);
      else throw e;
    }
  }
  const l = local();
  l.extra.resultados = [...(l.extra.resultados || []).filter((r) => r.id !== fila.id), sinCamposSemilla(nueva)];
  saveExtra(l.extra);
  return nueva;
}

export async function guardarResultado({ astronaut_id, prueba_id, valor, nivel, desde_ficha = null }) {
  const row = { id: uuid(), astronaut_id: Number(astronaut_id), prueba_id, valor, nivel, hecho_en: new Date().toISOString(), desde_ficha };
  const cli = dbFichas("resultados_prueba");
  if (cli) {
    try {
      const { error } = await conTiempo(cli.from("resultados_prueba").insert(row), TIEMPO_MAX_MS);
      if (!error) {
        notifyLocal();
        return row;
      }
      if (esSinTabla(error)) sinTablas.add("resultados_prueba");
      else if (esErrorRed(error)) caer(error);
      else throw error;
    } catch (e) {
      if (esSinTabla(e)) sinTablas.add("resultados_prueba");
      else if (esErrorRed(e)) caer(e);
      else throw e;
    }
  }
  const l = local();
  l.extra.resultados = [...(l.extra.resultados || []), row];
  saveExtra(l.extra);
  return row;
}

export function subscribeFichas(astronautId, cb) {
  localListeners.add(cb);
  const bc = getChannel();
  const onMsg = () => cb();
  bc?.addEventListener("message", onMsg);
  let ch = null;
  if (supabase) {
    try {
      const id = Number(astronautId);
      ch = supabase
        .channel("quickfix-fichas-" + Math.random().toString(36).slice(2))
        .on("postgres_changes", { event: "*", schema: "public", table: "eventos_ficha", filter: `astronaut_id=eq.${id}` }, () => cb())
        .on("postgres_changes", { event: "*", schema: "public", table: "medicamentos_tomados" }, () => cb())
        .on("postgres_changes", { event: "*", schema: "public", table: "pasos_marcados" }, () => cb())
        .on("postgres_changes", { event: "*", schema: "public", table: "resultados_prueba", filter: `astronaut_id=eq.${id}` }, () => cb())
        .subscribe();
    } catch {
      ch = null;
    }
  }
  return () => {
    localListeners.delete(cb);
    bc?.removeEventListener("message", onMsg);
    if (ch) supabase.removeChannel(ch);
  };
}

export async function resetEnVivo(astronautId) {
  const id = Number(astronautId);
  await escribir(
    (cli) => cli.from("en_vivo").delete().eq("astronaut_id", id),
    ({ extra }) => {
      const resto = { ...extra.en_vivo };
      delete resto[id];
      extra.en_vivo = resto;
      saveExtra(extra);
    }
  );
  try {
    await guardarActividad(id, { estado: "reposo", desde: new Date().toISOString(), fiebre: false });
  } catch {}
}

async function actividadDe(astronautId) {
  const id = Number(astronautId);
  const cli = db();
  if (cli) {
    try {
      const { data } = await conTiempo(cli.from("actividad").select("*").eq("astronaut_id", id).maybeSingle(), TIEMPO_MAX_MS);
      return data || ACTIVIDAD_INICIAL(id);
    } catch {}
  }
  const { base, extra } = local();
  return extra.actividad[id] || base.actividad.find((x) => x.astronaut_id === id) || ACTIVIDAD_INICIAL(id);
}

async function guardarActividad(astronautId, cambios) {
  const id = Number(astronautId);
  const row = { ...(await actividadDe(id)), ...cambios, astronaut_id: id };
  await escribir(
    (cli) => cli.from("actividad").upsert({ astronaut_id: id, estado: row.estado, desde: row.desde, fiebre: !!row.fiebre }, { onConflict: "astronaut_id" }),
    ({ extra }) => {
      extra.actividad = { ...extra.actividad, [id]: row };
      saveExtra(extra);
    }
  );
  return row;
}

async function actividadActual(astronautId) {
  const [base, ev] = await Promise.all([actividadDe(astronautId), leerEnVivo(astronautId)]);
  return { ...base, ...(ev.actividad && typeof ev.actividad === "object" ? ev.actividad : {}), fiebre: typeof ev.fiebre === "boolean" ? ev.fiebre : !!base.fiebre };
}

export async function setActividad(astronautId, estado) {
  const valor = { estado, desde: new Date().toISOString() };
  await setEnVivo(astronautId, "actividad", valor).catch(() => {});
  try {
    await guardarActividad(astronautId, valor);
  } catch {}
  return valor;
}

export async function alternarEjercicio(astronautId) {
  const a = await actividadActual(astronautId);
  return setActividad(astronautId, a.estado === "ejercicio" ? "recuperacion" : "ejercicio");
}

export async function alternarFiebre(astronautId) {
  const a = await actividadActual(astronautId);
  const fiebre = !a.fiebre;
  await setEnVivo(astronautId, "fiebre", fiebre).catch(() => {});
  try {
    await guardarActividad(astronautId, { fiebre });
  } catch {}
  return fiebre;
}

export async function medirPresion(astronautId, sistolica, diastolica) {
  return savePrueba({
    astronaut_id: Number(astronautId), tipo: "presion", resultado: { sistolica, diastolica },
    interpretacion: `Blood pressure ${sistolica}/${diastolica} mmHg · cuff`, desenlace: null,
  });
}

export async function saveCheckin({ astronaut_id, ...campos }) {
  const fecha = isoDate(0);
  const datos = pick(campos, CAMPOS_CHECKIN);
  await escribir(
    (cli) => cli.from("checkins").upsert({ astronaut_id, fecha, ...datos }, { onConflict: "astronaut_id,fecha" }),
    ({ base, extra }) => {
      const prev =
        extra.checkins.find((e) => e.astronaut_id === astronaut_id && e.fecha === fecha) ||
        base.checkins.find((e) => e.astronaut_id === astronaut_id && e.fecha === fecha) ||
        {};
      const row = { ...prev, astronaut_id, fecha, ...datos };
      extra.checkins = [...extra.checkins.filter((e) => !(e.astronaut_id === astronaut_id && e.fecha === fecha)), row];
      saveExtra(extra);
    }
  );
}

export async function addAlert({ astronaut_id, sistema, nivel, mensaje, clave = null }) {
  const row = { astronaut_id, sistema, nivel, mensaje, clave, fecha: isoDate(0), resuelta: false };
  await escribir(
    (cli) => cli.from("alerts").insert(row),
    ({ extra }) => {
      extra.alerts = [{ ...row, id: Date.now(), creada_en: new Date().toISOString() }, ...extra.alerts];
      saveExtra(extra);
    }
  );
}

export async function resolveAlert(id) {
  await escribir(
    (cli) => cli.from("alerts").update({ resuelta: true }).eq("id", id),
    ({ extra }) => {
      extra.resolved = [...new Set([...extra.resolved, id])];
      saveExtra(extra);
    }
  );
}

export async function loadProfile(astronautId) {
  return (await loadData(astronautId)).profile;
}

export async function saveProfile(astronaut_id, perfil) {
  const row = { astronaut_id, ...pick(perfil, CAMPOS_PERFIL) };
  await escribir(
    (cli) => cli.from("profiles").upsert({ ...row, actualizado_en: new Date().toISOString() }, { onConflict: "astronaut_id" }),
    ({ extra }) => {
      extra.profiles = { ...extra.profiles, [astronaut_id]: row };
      saveExtra(extra);
    }
  );
}

export async function loadHistoria(astronautId) {
  return (await loadData(astronautId)).historia;
}

export async function saveHistoria(astronaut_id, historia) {
  const row = { astronaut_id, ...pick(historia, CAMPOS_HISTORIA) };
  await escribir(
    (cli) => cli.from("historia_clinica").upsert({ ...row, actualizado_en: new Date().toISOString() }, { onConflict: "astronaut_id" }),
    ({ extra }) => {
      extra.historias = { ...extra.historias, [astronaut_id]: row };
      saveExtra(extra);
    }
  );
}

export async function savePrueba({ astronaut_id, tipo, resultado, interpretacion, desenlace = null }) {
  const row = { astronaut_id, tipo, fecha: isoDate(0), resultado, interpretacion, desenlace };
  await escribir(
    (cli) => cli.from("pruebas").insert(row),
    ({ extra }) => {
      extra.pruebas = [...extra.pruebas, { ...row, id: Date.now(), creada_en: new Date().toISOString() }];
      saveExtra(extra);
    }
  );
}

function eventosLocales(base, extra) {
  const propios = new Map(extra.eventos.map((e) => [String(e.id), e]));
  return [...base.eventos.filter((e) => !propios.has(String(e.id))), ...extra.eventos].sort((a, b) => String(a.inicio).localeCompare(String(b.inicio)));
}

export async function loadEventos() {
  const cli = db();
  if (cli) {
    try {
      const { data, error } = await conTiempo(cli.from("eventos_radiacion").select("*").order("inicio"), TIEMPO_MAX_MS);
      if (!error) return data;
      if (!esErrorRed(error)) throw error;
      caer(error);
    } catch (e) {
      if (!esErrorRed(e)) throw e;
      caer(e);
    }
  }
  const { base, extra } = local();
  return eventosLocales(base, extra);
}

async function eventoActivo() {
  return (await loadEventos()).find((e) => !e.fin) || null;
}

export async function iniciarTormenta(nivel = "S3", origen = "simulado") {
  const activo = await eventoActivo();
  if (activo) return activo;
  const row = { inicio: new Date().toISOString(), fin: null, nivel, origen, refugio: {} };
  let creado = null;
  await escribir(
    async (cli) => {
      const r = await cli.from("eventos_radiacion").insert(row).select().single();
      creado = r.data;
      return r;
    },
    ({ extra }) => {
      creado = { ...row, id: Date.now() };
      extra.eventos = [...extra.eventos, creado];
      saveExtra(extra);
    }
  );
  return creado;
}

export async function terminarTormenta() {
  const activo = await eventoActivo();
  if (!activo) return null;
  const fin = new Date().toISOString();
  await escribir(
    (cli) => cli.from("eventos_radiacion").update({ fin }).eq("id", activo.id),
    ({ extra }) => {
      extra.eventos = [...extra.eventos.filter((e) => String(e.id) !== String(activo.id)), { ...activo, fin }];
      saveExtra(extra);
    }
  );
  return { ...activo, fin };
}

export async function confirmarRefugio(astronautId) {
  const activo = await eventoActivo();
  if (!activo) return null;
  const refugio = { ...(activo.refugio || {}) };
  if (!refugio[astronautId]) refugio[astronautId] = new Date().toISOString();
  await escribir(
    (cli) => cli.from("eventos_radiacion").update({ refugio }).eq("id", activo.id),
    ({ extra }) => {
      extra.eventos = [...extra.eventos.filter((e) => String(e.id) !== String(activo.id)), { ...activo, refugio }];
      saveExtra(extra);
    }
  );
  return { ...activo, refugio };
}

export function subscribe(cb) {
  localListeners.add(cb);
  const bc = getChannel();
  const onMsg = () => cb();
  bc?.addEventListener("message", onMsg);
  let ch = null;
  const nombre = "quickfix-" + Math.random().toString(36).slice(2);
  if (supabase) {
    try {
      ch = supabase.channel(nombre);
      for (const t of ["alerts", "checkins", "vitals", "profiles", "historia_clinica", "pruebas", "eventos_radiacion", "cabina", "actividad", "en_vivo"]) {
        ch = ch.on("postgres_changes", { event: "*", schema: "public", table: t }, () => cb());
      }
      estadosCanal.set(nombre, "CONECTANDO");
      ch.subscribe((status) => {
        if (!estadosCanal.has(nombre)) return;
        estadosCanal.set(nombre, status);
        avisarConexion();
      });
    } catch {
      ch = null;
    }
  }
  return () => {
    localListeners.delete(cb);
    bc?.removeEventListener("message", onMsg);
    if (ch) {
      estadosCanal.delete(nombre);
      supabase.removeChannel(ch);
      avisarConexion();
    }
  };
}
