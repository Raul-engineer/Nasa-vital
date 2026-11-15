"use client";
import { createClient } from "@supabase/supabase-js";
import { generateMock, isoDate } from "./mockData";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const supabase = URL && KEY ? createClient(URL, KEY) : null;
export const MODO = supabase ? "supabase" : "local";

const LS_KEY = "quickfix_local_v1";
const VACIO = () => ({ alerts: [], checkins: [], resolved: [], profiles: {}, historias: {}, pruebas: [], eventos: [], actividad: {} });
const ACTIVIDAD_INICIAL = (id) => ({ astronaut_id: id, estado: "reposo", desde: null, fiebre: false });
let mockBase = null;
let channel = null;

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

export async function loadData(astronautId) {
  const id = Number(astronautId);
  if (supabase) {
    const [a, v, c, p, al, pf, hc, pr, ev, cb, ac] = await Promise.all([
      supabase.from("astronauts").select("*").order("id"),
      supabase.from("vitals").select("*").eq("astronaut_id", id).order("fecha"),
      supabase.from("checkins").select("*").eq("astronaut_id", id).order("fecha"),
      supabase.from("protocols").select("*").order("id"),
      supabase.from("alerts").select("*").eq("astronaut_id", id).order("creada_en", { ascending: false }),
      supabase.from("profiles").select("*").eq("astronaut_id", id).maybeSingle(),
      supabase.from("historia_clinica").select("*").eq("astronaut_id", id).maybeSingle(),
      supabase.from("pruebas").select("*").eq("astronaut_id", id).order("creada_en"),
      supabase.from("eventos_radiacion").select("*").order("inicio"),
      supabase.from("cabina").select("*").eq("astronaut_id", id).order("fecha"),
      supabase.from("actividad").select("*").eq("astronaut_id", id).maybeSingle(),
    ]);
    const err = a.error || v.error || c.error || p.error || al.error || pf.error || hc.error || pr.error || ev.error || cb.error;
    if (err) throw err;
    return {
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
  }
  const { base, extra } = local();
  const checkins = base.checkins
    .filter((x) => x.astronaut_id === id)
    .map((x) => extra.checkins.find((e) => e.astronaut_id === id && e.fecha === x.fecha) || x);
  const alerts = [...extra.alerts, ...base.alerts]
    .filter((x) => x.astronaut_id === id)
    .map((x) => (extra.resolved.includes(x.id) ? { ...x, resuelta: true } : x));
  return {
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
}

async function actividadDe(astronautId) {
  const id = Number(astronautId);
  if (supabase) {
    const { data } = await supabase.from("actividad").select("*").eq("astronaut_id", id).maybeSingle();
    return data || ACTIVIDAD_INICIAL(id);
  }
  const { base, extra } = local();
  return extra.actividad[id] || base.actividad.find((x) => x.astronaut_id === id) || ACTIVIDAD_INICIAL(id);
}

async function guardarActividad(astronautId, cambios) {
  const id = Number(astronautId);
  const row = { ...(await actividadDe(id)), ...cambios, astronaut_id: id };
  if (supabase) {
    const { error } = await supabase.from("actividad").upsert({ astronaut_id: id, estado: row.estado, desde: row.desde, fiebre: !!row.fiebre }, { onConflict: "astronaut_id" });
    if (error) throw error;
    return row;
  }
  const { extra } = local();
  extra.actividad = { ...extra.actividad, [id]: row };
  saveExtra(extra);
  return row;
}

export async function setActividad(astronautId, estado) {
  return guardarActividad(astronautId, { estado, desde: new Date().toISOString() });
}

export async function alternarEjercicio(astronautId) {
  const a = await actividadDe(astronautId);
  return setActividad(astronautId, a.estado === "ejercicio" ? "recuperacion" : "ejercicio");
}

export async function alternarFiebre(astronautId) {
  const a = await actividadDe(astronautId);
  return guardarActividad(astronautId, { fiebre: !a.fiebre });
}

export async function medirPresion(astronautId, sistolica, diastolica) {
  return savePrueba({
    astronaut_id: Number(astronautId), tipo: "presion", resultado: { sistolica, diastolica },
    interpretacion: `Presión ${sistolica}/${diastolica} mmHg · brazalete`, desenlace: null,
  });
}

export async function saveCheckin({ astronaut_id, ...campos }) {
  const fecha = isoDate(0);
  const datos = pick(campos, CAMPOS_CHECKIN);
  if (supabase) {
    const { error } = await supabase.from("checkins").upsert({ astronaut_id, fecha, ...datos }, { onConflict: "astronaut_id,fecha" });
    if (error) throw error;
    return;
  }
  const { base, extra } = local();
  const prev =
    extra.checkins.find((e) => e.astronaut_id === astronaut_id && e.fecha === fecha) ||
    base.checkins.find((e) => e.astronaut_id === astronaut_id && e.fecha === fecha) ||
    {};
  const row = { ...prev, astronaut_id, fecha, ...datos };
  extra.checkins = [...extra.checkins.filter((e) => !(e.astronaut_id === astronaut_id && e.fecha === fecha)), row];
  saveExtra(extra);
}

export async function addAlert({ astronaut_id, sistema, nivel, mensaje, clave = null }) {
  const row = { astronaut_id, sistema, nivel, mensaje, clave, fecha: isoDate(0), resuelta: false };
  if (supabase) {
    const { error } = await supabase.from("alerts").insert(row);
    if (error) throw error;
    return;
  }
  const { extra } = local();
  extra.alerts = [{ ...row, id: Date.now(), creada_en: new Date().toISOString() }, ...extra.alerts];
  saveExtra(extra);
}

export async function resolveAlert(id) {
  if (supabase) {
    const { error } = await supabase.from("alerts").update({ resuelta: true }).eq("id", id);
    if (error) throw error;
    return;
  }
  const { extra } = local();
  extra.resolved = [...new Set([...extra.resolved, id])];
  saveExtra(extra);
}

export async function loadProfile(astronautId) {
  return (await loadData(astronautId)).profile;
}

export async function saveProfile(astronaut_id, perfil) {
  const row = { astronaut_id, ...pick(perfil, CAMPOS_PERFIL) };
  if (supabase) {
    const { error } = await supabase.from("profiles").upsert({ ...row, actualizado_en: new Date().toISOString() }, { onConflict: "astronaut_id" });
    if (error) throw error;
    return;
  }
  const { extra } = local();
  extra.profiles = { ...extra.profiles, [astronaut_id]: row };
  saveExtra(extra);
}

export async function loadHistoria(astronautId) {
  return (await loadData(astronautId)).historia;
}

export async function saveHistoria(astronaut_id, historia) {
  const row = { astronaut_id, ...pick(historia, CAMPOS_HISTORIA) };
  if (supabase) {
    const { error } = await supabase.from("historia_clinica").upsert({ ...row, actualizado_en: new Date().toISOString() }, { onConflict: "astronaut_id" });
    if (error) throw error;
    return;
  }
  const { extra } = local();
  extra.historias = { ...extra.historias, [astronaut_id]: row };
  saveExtra(extra);
}

export async function savePrueba({ astronaut_id, tipo, resultado, interpretacion, desenlace = null }) {
  const row = { astronaut_id, tipo, fecha: isoDate(0), resultado, interpretacion, desenlace };
  if (supabase) {
    const { error } = await supabase.from("pruebas").insert(row);
    if (error) throw error;
    return;
  }
  const { extra } = local();
  extra.pruebas = [...extra.pruebas, { ...row, id: Date.now(), creada_en: new Date().toISOString() }];
  saveExtra(extra);
}

function eventosLocales(base, extra) {
  const propios = new Map(extra.eventos.map((e) => [String(e.id), e]));
  return [...base.eventos.filter((e) => !propios.has(String(e.id))), ...extra.eventos].sort((a, b) => String(a.inicio).localeCompare(String(b.inicio)));
}

export async function loadEventos() {
  if (supabase) {
    const { data, error } = await supabase.from("eventos_radiacion").select("*").order("inicio");
    if (error) throw error;
    return data;
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
  if (supabase) {
    const { data, error } = await supabase.from("eventos_radiacion").insert(row).select().single();
    if (error) throw error;
    return data;
  }
  const { extra } = local();
  const ev = { ...row, id: Date.now() };
  extra.eventos = [...extra.eventos, ev];
  saveExtra(extra);
  return ev;
}

export async function terminarTormenta() {
  const activo = await eventoActivo();
  if (!activo) return null;
  const fin = new Date().toISOString();
  if (supabase) {
    const { error } = await supabase.from("eventos_radiacion").update({ fin }).eq("id", activo.id);
    if (error) throw error;
    return { ...activo, fin };
  }
  const { extra } = local();
  extra.eventos = [...extra.eventos.filter((e) => String(e.id) !== String(activo.id)), { ...activo, fin }];
  saveExtra(extra);
  return { ...activo, fin };
}

export async function confirmarRefugio(astronautId) {
  const activo = await eventoActivo();
  if (!activo) return null;
  const refugio = { ...(activo.refugio || {}) };
  if (!refugio[astronautId]) refugio[astronautId] = new Date().toISOString();
  if (supabase) {
    const { error } = await supabase.from("eventos_radiacion").update({ refugio }).eq("id", activo.id);
    if (error) throw error;
    return { ...activo, refugio };
  }
  const { extra } = local();
  extra.eventos = [...extra.eventos.filter((e) => String(e.id) !== String(activo.id)), { ...activo, refugio }];
  saveExtra(extra);
  return { ...activo, refugio };
}

export function subscribe(cb) {
  if (supabase) {
    let ch = supabase.channel("quickfix-" + Math.random().toString(36).slice(2));
    for (const t of ["alerts", "checkins", "vitals", "profiles", "historia_clinica", "pruebas", "eventos_radiacion", "cabina", "actividad"]) {
      ch = ch.on("postgres_changes", { event: "*", schema: "public", table: t }, cb);
    }
    ch.subscribe();
    return () => supabase.removeChannel(ch);
  }
  localListeners.add(cb);
  const bc = getChannel();
  const onMsg = () => cb();
  bc?.addEventListener("message", onMsg);
  return () => {
    localListeners.delete(cb);
    bc?.removeEventListener("message", onMsg);
  };
}
