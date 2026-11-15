import { marcasDe, PLAN_EMERGENCIA, TITULOS } from "./fichas.js";
import { validarLectura } from "./validar.js";

const num = (x) => (x == null || x === "" || Number.isNaN(Number(x)) ? null : Number(x));
const HORA = 36e5;
const VAR_NEWS2 = { fr: "fr", spo2: "spo2", sistolica: "pa", pulso: "fc", temperatura: "temp", conciencia: "conciencia" };
const BASE = PLAN_EMERGENCIA.slice(0, 3).map((p) => p.texto);
const ACCIONES = {
  spo2: ["Ponte la máscara de oxígeno", "Confirma con el oxímetro de dedo", "Avisa al oficial médico ahora"],
  pa: ["Siéntate y no hagas esfuerzo", "Avisa al oficial médico ahora", "No tomes antihipertensivos debajo de la lengua"],
  fc: ["Acuéstate y no te quedes solo", "Avisa al oficial médico ahora", "Prepara el monitor cardiaco"],
  fr: ["Siéntate erguido", "Ponte la máscara de oxígeno", "Avisa al oficial médico ahora"],
  temp: ["Avisa al oficial médico ahora", "Que un compañero se quede contigo", "Mide la presión y la SpO₂"],
  neuro: ["Anota la hora en que empezó", "Avisa al oficial médico ahora", "No le des nada de comer ni beber"],
  conciencia: ["Que un compañero se quede contigo", "Avisa al oficial médico ahora", "Revisa SpO₂ y glucosa"],
  phq9: ["Ve con el astronauta ahora", "Abre la conferencia psicológica privada", "No lo dejes solo"],
  nave: ["Sigue el procedimiento de la nave", "Confirma que estás a salvo", "Ve al punto de reunión"],
};
export const MENSAJE_RECIBIDO = "Recibido, voy";

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

  const oxi = num(astronauta.oximetro) ?? num(ultimo("spo2_confirmacion")?.valor?.respuestas?.oximetro) ?? num(abiertos.find((e) => e.clave === "spo2")?.respuestas?._m?.oximetro);
  const fc = num(l.fc), fr = num(l.frec_resp), sp = num(l.spo2), sis = num(l.sistolica), dia = num(l.diastolica), t = num(l.temperatura);
  const news2 = num(astronauta.news2) ?? num(analisis?.news2?.total);
  const sintomas = marcas.has("dolor_pecho") || marcas.has("desmayo") || marcas.has("organo_blanco") || !!ci.confusion || !!ci.mareo_de_pie;

  if (news2 != null && news2 >= 7) {
    const top = [...(analisis?.news2?.desglose || [])].sort((a, b) => (b.puntos || 0) - (a.puntos || 0))[0];
    add("news2", `NEWS2 de ${news2}: riesgo alto`, `NEWS2 ${news2}`, VAR_NEWS2[top?.k] || "fc");
  }
  if (oxi != null && oxi < 90) add("spo2", "SpO₂ menor a 90 % confirmada", `${oxi} %`, "spo2", ACCIONES.spo2);
  else if (sp != null && sp < 90 && !(oxi != null && oxi >= 90)) add("spo2", "SpO₂ menor a 90 % del reloj, sin confirmar", `${sp} %`, "spo2", ACCIONES.spo2);
  if (((sis != null && sis >= 180) || (dia != null && dia >= 110)) && marcas.has("organo_blanco")) add("pa", "Presión muy alta con síntomas", `${sis}/${dia} mmHg`, "pa", ACCIONES.pa);
  if (fc != null && (fc <= 40 || fc >= 131) && sintomas) add("fc", fc <= 40 ? "FC muy baja con síntomas" : "FC muy alta con síntomas", `${fc} lpm`, "fc", ACCIONES.fc);
  if (fr != null && (fr <= 8 || fr >= 25)) add("fr", fr <= 8 ? "Respiración muy lenta" : "Respiración muy rápida", `${fr} rpm`, "fr", ACCIONES.fr);
  if (t != null && (t >= 39.1 || t <= 35) && (ci.confusion || (sis != null && sis <= 90))) add("temp", t >= 39.1 ? "Fiebre alta con confusión o presión baja" : "Temperatura muy baja con confusión o presión baja", `${t} °C`, "temp", ACCIONES.temp);
  if (ultimo("cincinnati")?.valor?.resultado?.critico) add("cincinnati", "Cincinnati con anomalía súbita", (ultimo("cincinnati").valor.resultado.detalles?.anomalias || []).join(", ") || "Anomalía", "conciencia", ACCIONES.neuro);
  if (ultimo("amt4")?.valor?.resultado?.critico) add("amt4", "Confusión nueva con NEWS2 alto", `${ultimo("amt4").valor.resultado.valor} errores`, "conciencia", ACCIONES.conciencia);
  if (abiertos.some((e) => (e.respuestas?._m?.escalados || []).includes("sin_respuesta"))) add("sin_respuesta", "No responde a la encuesta en 2 min", "Sin respuesta", "conciencia", ACCIONES.conciencia);
  for (const e of abiertos) if (e.nivel === "critico" && e.respuestas?._m?.peligroActivo && e.clave !== "animo") add(`peligro_${e.clave}`, `Señal de peligro: ${TITULOS[e.clave]}`, "Señal de peligro", e.clave);
  const item9 = num(analisis?.tamizaje?.phq9?.resultado?.item9) > 0 || !!ultimo("phq9")?.valor?.resultado?.critico;
  if (item9) add("phq9", "PHQ-9: respuesta en la pregunta 9", "Pregunta 9", "animo", ACCIONES.phq9, "oficial");
  const nave = data?.enVivo?.alarma_nave || astronauta.alarmaNave;
  if (nave) add("nave", `Alarma de la nave: ${typeof nave === "object" ? nave.tipo || "incendio" : nave}`, "Alarma", "cabina", ACCIONES.nave);

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
