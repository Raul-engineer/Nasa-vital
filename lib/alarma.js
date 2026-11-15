import { marcasDe, PLAN_EMERGENCIA, TITULOS } from "./fichas.js";
import { validarLectura } from "./validar.js";
import { respuestasComoObjeto } from "./respuestas.js";

const num = (x) => (x == null || x === "" || Number.isNaN(Number(x)) ? null : Number(x));
const HORA = 36e5;
const VAR_NEWS2 = { fr: "fr", spo2: "spo2", sistolica: "pa", pulso: "fc", temperatura: "temp", conciencia: "conciencia" };
const BASE = PLAN_EMERGENCIA.slice(0, 3).map((p) => p.texto);
const ACCIONES = {
  spo2: ["Put on the oxygen mask", "Confirm with the finger oximeter", "Tell the medical officer now"],
  pa: ["Sit down and do not exert yourself", "Tell the medical officer now", "Do not take antihypertensives under the tongue"],
  fc: ["Lie down and do not stay alone", "Tell the medical officer now", "Get the cardiac monitor ready"],
  fr: ["Sit upright", "Put on the oxygen mask", "Tell the medical officer now"],
  temp: ["Tell the medical officer now", "Have a crewmate stay with you", "Measure blood pressure and SpO₂"],
  neuro: ["Write down the time it started", "Tell the medical officer now", "Do not give them anything to eat or drink"],
  conciencia: ["Have a crewmate stay with you", "Tell the medical officer now", "Check SpO₂ and glucose"],
  phq9: ["Go to the astronaut now", "Open the private psychological conference", "Do not leave them alone"],
  nave: ["Follow the ship procedure", "Confirm that you are safe", "Go to the assembly point"],
};
export const MENSAJE_RECIBIDO = "Received, on my way";

export function evaluarAlarmas({ astronauta = {}, analisis = null, data = null, eventosFicha = [], resultados = [], ahora = Date.now() } = {}) {
  const aid = astronauta.id ?? data?.astronaut?.id;
  const nombre = astronauta.nombre ?? data?.astronaut?.nombre ?? "";
  const crudo = astronauta.lectura || analisis?.hoy || {};
  const valid = validarLectura(crudo);
  const l = Object.fromEntries(Object.entries(crudo).filter(([k]) => !valid.campos.includes(k)));
  const ci = astronauta.ci || analisis?.checkinHoy || {};
  const abiertos = (eventosFicha || []).filter((e) => !e.cerrado_en);
  const marcas = marcasDe(Object.fromEntries(abiertos.map((e) => [e.clave, e.respuestas || {}])));
  const recientes = (resultados || []).filter((r) => ahora - Date.parse(r.hecho_en) <= 6 * HORA);
  const ultimo = (id) => recientes.filter((r) => r.prueba_id === id).sort((a, b) => String(a.hecho_en).localeCompare(String(b.hecho_en))).at(-1);
  const out = [];
  const add = (tipo, titulo, valor, clave, acciones = BASE, alcance = "tripulacion") => out.push({ id: `${aid}:${tipo}`, tipo, astronautId: aid, nombre, titulo, valor, clave, acciones: acciones.slice(0, 3), alcance });

  const oxi = num(astronauta.oximetro) ?? num(respuestasComoObjeto(ultimo("spo2_confirmacion")?.valor).oximetro) ?? num(abiertos.find((e) => e.clave === "spo2")?.respuestas?._m?.oximetro);
  const fc = num(l.fc), fr = num(l.frec_resp), sp = num(l.spo2), sis = num(l.sistolica), dia = num(l.diastolica), t = num(l.temperatura);
  const news2 = num(astronauta.news2) ?? num(analisis?.news2?.total);
  const sintomas = marcas.has("dolor_pecho") || marcas.has("desmayo") || marcas.has("organo_blanco") || !!ci.confusion || !!ci.mareo_de_pie;

  if (news2 != null && news2 >= 7) {
    const top = [...(analisis?.news2?.desglose || [])].sort((a, b) => (b.puntos || 0) - (a.puntos || 0))[0];
    add("news2", `NEWS2 of ${news2}: high risk`, `NEWS2 ${news2}`, VAR_NEWS2[top?.k] || "fc");
  }
  if (oxi != null && oxi < 90) add("spo2", "SpO₂ below 90 % confirmed", `${oxi} %`, "spo2", ACCIONES.spo2);
  else if (sp != null && sp < 90 && !(oxi != null && oxi >= 90)) add("spo2", "SpO₂ below 90 % from the watch, not confirmed", `${sp} %`, "spo2", ACCIONES.spo2);
  if (((sis != null && sis >= 180) || (dia != null && dia >= 110)) && marcas.has("organo_blanco")) add("pa", "Very high blood pressure with symptoms", `${sis}/${dia} mmHg`, "pa", ACCIONES.pa);
  if (fc != null && (fc <= 40 || fc >= 131) && sintomas) add("fc", fc <= 40 ? "Very low HR with symptoms" : "Very high HR with symptoms", `${fc} bpm`, "fc", ACCIONES.fc);
  if (fr != null && (fr <= 8 || fr >= 25)) add("fr", fr <= 8 ? "Very slow breathing" : "Very fast breathing", `${fr} br/min`, "fr", ACCIONES.fr);
  if (t != null && (t >= 39.1 || t <= 35) && (ci.confusion || (sis != null && sis <= 90))) add("temp", t >= 39.1 ? "High fever with confusion or low blood pressure" : "Very low temperature with confusion or low blood pressure", `${t} °C`, "temp", ACCIONES.temp);
  if (ultimo("cincinnati")?.valor?.resultado?.critico) add("cincinnati", "Cincinnati with a sudden abnormality", (ultimo("cincinnati").valor.resultado.detalles?.anomalias || []).join(", ") || "Abnormality", "conciencia", ACCIONES.neuro);
  if (ultimo("amt4")?.valor?.resultado?.critico) add("amt4", "New confusion with high NEWS2", `${ultimo("amt4").valor.resultado.valor} errors`, "conciencia", ACCIONES.conciencia);
  if (abiertos.some((e) => (e.respuestas?._m?.escalados || []).includes("sin_respuesta"))) add("sin_respuesta", "No response to the survey in 2 min", "No response", "conciencia", ACCIONES.conciencia);
  for (const e of abiertos) if (e.nivel === "critico" && e.respuestas?._m?.peligroActivo && e.clave !== "animo") add(`peligro_${e.clave}`, `Danger sign: ${TITULOS[e.clave]}`, "Danger sign", e.clave);
  const item9 = num(analisis?.tamizaje?.phq9?.resultado?.item9) > 0 || !!ultimo("phq9")?.valor?.resultado?.critico;
  if (item9) add("phq9", "PHQ-9: answer on question 9", "Question 9", "animo", ACCIONES.phq9, "oficial");
  const nave = data?.enVivo?.alarma_nave || astronauta.alarmaNave;
  if (nave) add("nave", `Ship alarm: ${typeof nave === "object" ? nave.tipo || "fire" : nave}`, "Alarm", "cabina", ACCIONES.nave);

  const vistos = new Set();
  return out.filter((a) => (vistos.has(a.id) ? false : vistos.add(a.id)));
}

export function estadoAlarma(alarma, acks = {}) {
  const a = acks?.[alarma.id];
  if (a?.cerrada) return "cerrada";
  if (a?.recibido) return "banda";
  return "pantalla";
}

export function aplicarAccion(acks = {}, alarmaId, accion, por = "") {
  const t = new Date().toISOString();
  if (accion === "recibido") return { ...acks, [alarmaId]: { ...(acks[alarmaId] || {}), recibido: { por, t } } };
  if (accion === "cerrar") return { ...acks, [alarmaId]: { ...(acks[alarmaId] || {}), cerrada: { por, t } } };
  return acks;
}

export function visibleParaQuien(alarma, { esOficial = false } = {}) {
  return alarma.alcance !== "oficial" || esOficial;
}
