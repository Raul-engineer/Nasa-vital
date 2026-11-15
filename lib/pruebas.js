import { calcularNews2, evaluarOrtostatica, mediana, UMBRALES } from "./analysis.js";
import { ETIQUETA_NIVEL, mayorNivel, PRUEBAS_RECOMENDADAS, RANGO_NIVEL, TITULOS } from "./fichas.js";
import { respuestasComoObjeto } from "./respuestas.js";
import { LIMITES, validarCampo, validarLectura } from "./validar.js";

export const CATEGORIAS_PRUEBA = {
  diario: { nombre: "Daily", corto: "Daily" },
  corazon: { nombre: "Heart and breathing", corto: "Heart" },
  mente: { nombre: "Mind and defenses", corto: "Mind" },
  espacio: { nombre: "Space effects", corto: "Space" },
};
export const ORDEN_CATEGORIAS = ["diario", "corazon", "mente", "espacio"];

const num = (x) => (x == null || x === "" || Number.isNaN(Number(x)) ? null : Number(x));
const f1 = (x) => Number(x).toLocaleString("en-US", { maximumFractionDigits: 1 });
const R = (valor, nivel, texto, detalles = {}, extra = {}) => ({ valor, nivel, texto, detalles, ...extra });
const sino = (id, texto, extra = {}) => ({ id, tipo: "sino", texto, ...extra });
const info = (id, texto, extra = {}) => ({ id, tipo: "info", texto, ...extra });
const numero = (id, texto, campo, unidad, extra = {}) => ({ id, tipo: "numero", texto, campo, unidad, obligatorio: true, ...extra });
const lectura = (id, texto, campos, extra = {}) => ({ id, tipo: "lectura", texto, campos, ...extra });
const escala = (id, texto, min, max, etiquetas = {}, extra = {}) => ({ id, tipo: "escala", texto, min, max, etiquetas, ...extra });
const opciones = (id, texto, ops, extra = {}) => ({ id, tipo: "opciones", texto, opciones: ops, ...extra });
const PA_CAMPOS = [{ id: "sistolica", etiqueta: "Systolic", unidad: "mmHg", rango: "sistolica" }, { id: "diastolica", etiqueta: "Diastolic", unidad: "mmHg", rango: "diastolica" }];
const PA_FC_CAMPOS = [...PA_CAMPOS, { id: "fc", etiqueta: "HR", unidad: "bpm", rango: "fc" }];

const OPC_WHO5 = [[5, "All of the time"], [4, "Most of the time"], [3, "More than half of the time"], [2, "Less than half of the time"], [1, "Some of the time"], [0, "At no time"]];
const OPC_PHQ = [[0, "Not at all"], [1, "Several days"], [2, "More than half the days"], [3, "Nearly every day"]];
export const ITEMS = {
  who5: ["I have felt cheerful and in good spirits", "I have felt calm and relaxed", "I have felt active and vigorous", "I woke up feeling fresh and rested", "My daily life has been filled with things that interest me"],
  phq9: ["Little interest or pleasure in doing things", "Feeling down, depressed or hopeless", "Trouble falling or staying asleep, or sleeping too much", "Feeling tired or having little energy", "Poor appetite or overeating", "Feeling bad about yourself, or that you are a failure or have let yourself or your family down", "Trouble concentrating on things, such as reading or watching videos", "Moving or speaking so slowly that other people could have noticed, or being so restless that you move around a lot more than usual", "Thoughts that you would be better off dead or of hurting yourself in some way"],
  gad7: ["Feeling nervous, anxious or on edge", "Not being able to stop or control worrying", "Worrying too much about different things", "Trouble relaxing", "Being so restless that it is hard to sit still", "Becoming easily annoyed or irritable", "Feeling afraid, as if something awful might happen"],
};
const itemsDe = (tipo, intro) => ITEMS[tipo].map((t, i) => opciones(`i${i + 1}`, t, tipo === "who5" ? OPC_WHO5 : OPC_PHQ, { intro }));
const sumaItems = (r, n) => Array.from({ length: n }, (_, i) => num(r[`i${i + 1}`]) || 0).reduce((a, b) => a + b, 0);

export function clasificarPronam(s, d) {
  if (s == null || d == null) return { grado: "No data", nivel: "ok" };
  if (s >= 180 || d >= 110) return { grado: "Grade 3", nivel: "urgente" };
  if (s >= 160 || d >= 100) return { grado: "Grade 2", nivel: "urgente" };
  if (s >= 140 || d >= 90) return { grado: "Grade 1", nivel: "moderado" };
  if (s <= 90) return { grado: "Low blood pressure", nivel: "urgente" };
  if (s <= 100) return { grado: "Low blood pressure", nivel: "moderado" };
  if (s >= 130 || d >= 85) return { grado: "Elevated", nivel: "moderado" };
  if (s >= 120 || d >= 80) return { grado: "Elevated", nivel: "ok" };
  return { grado: "Normal", nivel: "ok" };
}

export function necesitaOtraLectura(lecturas = []) {
  const v = lecturas.filter((l) => l && num(l.sistolica) != null);
  if (v.length < 2) return false;
  const [a, b] = v.slice(-2);
  return Math.abs(a.sistolica - b.sistolica) > 10 || (num(a.diastolica) != null && num(b.diastolica) != null && Math.abs(a.diastolica - b.diastolica) > 10);
}

export function promedioPronam(r = {}) {
  const lecturas = ["l1", "l2", "l3", "l4"].map((k) => r[k]).filter((l) => l && num(l.sistolica) != null);
  const ult = lecturas.slice(-2);
  if (!ult.length) return null;
  return { sistolica: Math.round(ult.reduce((s, l) => s + Number(l.sistolica), 0) / ult.length), diastolica: Math.round(ult.reduce((s, l) => s + Number(l.diastolica), 0) / ult.length), lecturas };
}

const COLORES_ORINA = ["#f7f3c9", "#f4ef9e", "#f1e67a", "#ecd75a", "#e3c443", "#d6ab2e", "#c48f22", "#a8701b"];
export { COLORES_ORINA };
export const GRADUACIONES = [["0", "No magnification"], ["+0.75", "+0.75"], ["+1.50", "+1.50"], ["+2.25", "+2.25"], ["+3.00", "+3.00"]];
export const ZONAS_DOLOR = [["cabeza", "Head"], ["pecho", "Chest"], ["abdomen", "Abdomen"], ["espalda", "Lower back"], ["costado", "Flank"], ["brazos", "Arms"], ["piernas", "Legs"]];

export const PRUEBAS_CATALOGO = [
  {
    id: "checkin", categoria: "diario", nombre: "Daily check-in", icono: "clipboard", duracion: "30 s", legado: "checkin",
    resumen: "Mood, stress, fatigue, crew and symptoms of the day.", paraQue: "Catches what the sensors do not see. Recalculates your 12 cards.",
    fuente: "Check-in self-report", metricas: ["animo", "conciencia", "vision", "temp"],
    pasos: [{ id: "checkin", tipo: "especial", componente: "checkin" }],
    calificar: (r) => {
      const c = r.checkin || {};
      const sint = [c.confusion && "confusion", c.mareo_de_pie && "dizziness", c.vision_borrosa && "blurred vision", c.dolor_cabeza && "headache", ...(c.sintomas || [])].filter(Boolean);
      return R(sint.length, c.confusion ? "urgente" : sint.length ? "moderado" : "ok", sint.length ? `You reported ${sint.join(", ")}.` : "No symptoms today.", { animo: c.animo, estres: c.estres, fatiga: c.fatiga });
    },
    critico: () => false,
  },
  {
    id: "remedicion", categoria: "corazon", nombre: "Re-measurement at rest", icono: "heart", duracion: "5 min", legado: "remedicion",
    resumen: "5 min seated and silent; then HR, SpO₂ and blood pressure.", paraQue: "Confirms whether an abnormal value was brief.",
    fuente: "news2", metricas: ["fc", "spo2", "pa"], compara: { nombre: "NEWS2 points", unidad: "" },
    pasos: [{ id: "remedicion", tipo: "especial", componente: "remedicion" }],
    calificar: (r) => {
      const d = r.remedicion?.despues || r.despues || {};
      const n = calcularNews2(d, {}).total;
      return R(n, n >= 7 ? "critico" : n >= 5 ? "urgente" : n >= 1 ? "moderado" : "ok", `NEWS2 of these signs at rest: ${n}.`, { despues: d });
    },
    critico: (r) => calcularNews2(r.remedicion?.despues || r.despues || {}, {}).total >= 7,
  },
  {
    id: "ortostatica", categoria: "corazon", nombre: "Orthostatic test", icono: "standing", duracion: "4 min", legado: "ortostatica",
    resumen: "Blood pressure and pulse lying down, at 1 minute and at 3 minutes standing.", paraQue: "Detects a blood pressure drop when you stand up (≥ 20/10 mmHg).",
    fuente: "ortostatica,pronam", metricas: ["pa", "conciencia"], compara: { nombre: "systolic drop", unidad: "mmHg" }, temporizador: true,
    pasos: [
      info("p0", "Lie on your back for 5 minutes.", { segundos: 300 }),
      lectura("acostado", "Measure lying down.", PA_FC_CAMPOS, { minuto: 0 }),
      info("p1", "Stand up and wait 1 minute.", { segundos: 60 }),
      lectura("min1", "Measure after 1 minute standing.", PA_FC_CAMPOS, { minuto: 1 }),
      info("p3", "Keep standing 2 more minutes.", { segundos: 120 }),
      lectura("min3", "Measure after 3 minutes standing.", PA_FC_CAMPOS, { minuto: 3 }),
      sino("sintomas", "Did you feel like you were going to faint?"),
    ],
    calificar: (r) => {
      const e = evaluarOrtostatica(r);
      const caida = Math.max(0, ...e.caidas.map((c) => c.sis || 0));
      const caidaD = Math.max(0, ...e.caidas.map((c) => c.dia || 0));
      if (!e.positiva) return R(caida, "ok", `Negative: blood pressure dropped ${caida}/${caidaD} mmHg.`, { positiva: false }, { causas: { pa: { ortostatica: -2 }, conciencia: {} } });
      return R(caida, r.sintomas === "si" ? "urgente" : "moderado", `Positive: it dropped ${caida}/${caidaD} mmHg at ${e.momento} standing.`, { positiva: true }, { causas: { pa: { ortostatica: 4 }, conciencia: { presion: 2 } } });
    },
    critico: () => false,
  },
  {
    id: "presion_pronam", categoria: "corazon", nombre: "Properly measured blood pressure", icono: "bp", duracion: "9 min",
    resumen: "5 min seated, 3 readings 1 to 2 min apart.", paraQue: "Measures your blood pressure as PRONAM requires and classifies it.",
    fuente: "pronam", metricas: ["pa"], compara: { nombre: "average systolic", unidad: "mmHg" }, temporizador: true,
    pasos: [
      info("p0", "Sit with your back supported, feet on the floor and your arm at heart level. 5 min without talking.", { segundos: 300 }),
      lectura("l1", "First reading.", PA_CAMPOS),
      info("e1", "Wait 1 minute.", { segundos: 60 }),
      lectura("l2", "Second reading.", PA_CAMPOS),
      info("e2", "Wait 1 minute.", { segundos: 60 }),
      lectura("l3", "Third reading.", PA_CAMPOS),
      lectura("l4", "The last two differ by more than 10 mmHg. Take another reading.", PA_CAMPOS, { si: (r) => necesitaOtraLectura([r.l2, r.l3]) }),
    ],
    calificar: (r, base = {}) => {
      const p = promedioPronam(r);
      if (!p) return R(null, "ok", "No readings.");
      const c = clasificarPronam(p.sistolica, p.diastolica);
      const causas = { pa: {} };
      if (p.sistolica < 130 && p.diastolica < 85) causas.pa = { medicion: 4, hipertension: -1 };
      else if (p.sistolica >= 140 || p.diastolica >= 90) causas.pa = { hipertension: 3, medicion: -2 };
      return R(p.sistolica, c.nivel, `Average of the last 2: ${p.sistolica}/${p.diastolica} mmHg · ${c.grado} (PRONAM).`, { promedio: { sistolica: p.sistolica, diastolica: p.diastolica }, grado: c.grado, lecturas: p.lecturas.length }, { causas });
    },
    critico: () => false,
  },
  {
    id: "recuperacion_fc", categoria: "corazon", nombre: "Heart rate recovery", icono: "trend", duracion: "2 min",
    resumen: "HR at the end of exercise and one minute later.", paraQue: "If it drops less than 12 bpm in 1 minute, it is abnormal.",
    fuente: "cole1999", metricas: ["fc"], compara: { nombre: "recovery", unidad: "bpm" }, temporizador: true,
    pasos: [
      numero("fin", "HR at the end of exercise", "fc", "bpm"),
      info("espera", "Stay still for 1 minute.", { segundos: 60 }),
      numero("min1", "HR after one minute", "fc", "bpm"),
      sino("sintomas", "Do you have chest pain, dizziness or shortness of breath?"),
    ],
    calificar: (r) => {
      const d = (num(r.fin) ?? 0) - (num(r.min1) ?? 0);
      const anormal = d < 12;
      return R(d, anormal ? (r.sintomas === "si" ? "urgente" : "moderado") : "ok", anormal ? `It dropped ${d} bpm in 1 minute: less than 12, abnormal.` : `It dropped ${d} bpm in 1 minute: normal.`, { anormal });
    },
    critico: () => false,
  },
  {
    id: "spo2_confirmacion", categoria: "corazon", nombre: "SpO₂ confirmation", icono: "o2", duracion: "2 min",
    resumen: "Warm hands, 1 min still and a finger oximeter.", paraQue: "Confirms or rules out a low SpO₂ from the watch.",
    fuente: "oms_oximetria,hearn2023", metricas: ["spo2"], compara: { nombre: "Finger SpO₂", unidad: "%" }, temporizador: true,
    pasos: [
      info("manos", "Warm your hands by rubbing them for 30 seconds.", { segundos: 30 }),
      info("quieto", "Stay still for 1 minute.", { segundos: 60 }),
      numero("oximetro", "SpO₂ from the finger oximeter", "spo2", "%"),
      numero("reloj", "SpO₂ from the watch now", "spo2", "%", { obligatorio: false }),
    ],
    calificar: (r) => {
      const o = num(r.oximetro), w = num(r.reloj);
      const nivel = o < 90 ? "critico" : o < 94 ? "urgente" : o < 95 ? "moderado" : "ok";
      const dif = w != null ? Math.abs(o - w) : null;
      return R(o, nivel, `Finger oximeter: ${o} %${dif != null ? `; the watch reads ${w} % (${dif} points apart)` : ""}.`, { diferencia: dif }, { causas: { spo2: o >= 95 ? { falsa: 5 } : o < 90 ? { falsa: -4 } : {} } });
    },
    critico: (r) => num(r.oximetro) < 90,
  },
  {
    id: "borg", categoria: "corazon", nombre: "Shortness of breath (Borg CR10)", icono: "lungs", duracion: "1 min",
    resumen: "Rate your shortness of breath from 0 to 10, at rest and after exertion.", paraQue: "5 or more at rest is urgent.",
    fuente: "borg1982", metricas: ["fr", "spo2"], compara: { nombre: "Borg at rest", unidad: "" },
    pasos: [
      escala("reposo", "At rest, how short of breath are you?", 0, 10, { 0: "Nothing", 5: "Strong", 10: "Maximum" }, { campo: "borg" }),
      escala("esfuerzo", "After exertion, how much?", 0, 10, { 0: "Nothing", 5: "Strong", 10: "Maximum" }, { campo: "borg" }),
    ],
    calificar: (r) => {
      const a = num(r.reposo), b = num(r.esfuerzo);
      const nivel = a >= 5 ? "urgente" : a >= 3 || b >= 7 ? "moderado" : "ok";
      return R(a, nivel, `Rest ${a}/10 · exertion ${b}/10.`, {}, { causas: { fr: a <= 2 && b >= 5 ? { ejercicio: 2 } : a >= 3 ? { broncoespasmo: 1, infeccion: 1 } : {} } });
    },
    critico: () => false,
  },
  {
    id: "llenado_capilar", categoria: "corazon", nombre: "Capillary refill", icono: "drop", duracion: "1 min", companero: true,
    resumen: "Press the fingertip for 5 s and count how long the color takes to return.", paraQue: "Normal in under 2 s; slow with low blood pressure is urgent.",
    fuente: "abcde", metricas: ["pa"], compara: { nombre: "refill time", unidad: "s" }, temporizador: true,
    pasos: [
      info("apretar", "Press your crewmate's fingertip for 5 seconds and let go.", { segundos: 5 }),
      numero("segundos", "How many seconds did the color take to return?", "segundos", "s", { paso: 0.5 }),
    ],
    calificar: (r, base = {}) => {
      const s = num(r.segundos);
      const baja = num(base.sistolica) != null && base.sistolica <= 100;
      const nivel = s > 3 && baja ? "urgente" : s >= 2 ? "moderado" : "ok";
      return R(s, nivel, s < 2 ? `${f1(s)} s: normal.` : `${f1(s)} s: slow${baja ? " with low blood pressure" : ""}.`, { presionBaja: baja });
    },
    critico: () => false,
  },
  {
    id: "who5", categoria: "mente", nombre: "WHO-5 well-being", icono: "smile", duracion: "1 min", legado: "who5",
    resumen: "5 questions about the last 2 weeks.", paraQue: "52 % or less is low well-being. Screening, not diagnosis.",
    fuente: "who5", metricas: ["animo"], compara: { nombre: "WHO-5", unidad: "%" },
    pasos: itemsDe("who5", "Over the last two weeks…"),
    calificar: (r) => {
      const bruto = sumaItems(r, 5);
      const pct = bruto * 4;
      return R(pct, pct <= 28 ? "urgente" : pct <= 52 ? "moderado" : "ok", pct <= 52 ? `WHO-5 of ${pct} %: low well-being.` : `WHO-5 of ${pct} %: adequate well-being.`, { bruto }, { causas: {} });
    },
    critico: () => false,
  },
  {
    id: "phq9", categoria: "mente", nombre: "PHQ-9 screening", icono: "brain", duracion: "3 min", legado: "phq9",
    resumen: "9 questions about mood over the last 2 weeks.", paraQue: "10 or more notifies the physician. Screening, not diagnosis.",
    fuente: "phq9", metricas: ["animo"], compara: { nombre: "PHQ-9", unidad: "" },
    pasos: itemsDe("phq9", "Over the last two weeks, how often has this happened to you?"),
    calificar: (r) => {
      const p = sumaItems(r, 9);
      const item9 = num(r.i9) || 0;
      const sev = p >= 20 ? "severe" : p >= 15 ? "moderately severe" : p >= 10 ? "moderate" : p >= 5 ? "mild" : "minimal";
      const nivel = item9 > 0 ? "critico" : p >= 15 ? "urgente" : p >= 10 ? "moderado" : "ok";
      return R(p, nivel, `PHQ-9 of ${p}: ${sev}.${item9 > 0 ? " Immediate notice to the medical officer." : ""}`, { severidad: sev, item9 }, { alcance: item9 > 0 ? "oficial" : null });
    },
    critico: (r) => (num(r.i9) || 0) > 0,
  },
  {
    id: "gad7", categoria: "mente", nombre: "GAD-7 screening", icono: "bolt", duracion: "2 min", legado: "gad7",
    resumen: "7 questions about anxiety over the last 2 weeks.", paraQue: "10 or more notifies the physician. Screening, not diagnosis.",
    fuente: "gad7", metricas: ["animo"], compara: { nombre: "GAD-7", unidad: "" },
    pasos: itemsDe("gad7", "Over the last two weeks, how often has this happened to you?"),
    calificar: (r) => {
      const p = sumaItems(r, 7);
      const sev = p >= 15 ? "severe" : p >= 10 ? "moderate" : p >= 5 ? "mild" : "minimal";
      return R(p, p >= 15 ? "urgente" : p >= 10 ? "moderado" : "ok", `GAD-7 of ${p}: ${sev} anxiety.`, { severidad: sev });
    },
    critico: () => false,
  },
  {
    id: "pvt", categoria: "mente", nombre: "Reaction test (PVT-B)", icono: "target", duracion: "3 min", legado: "reaccion", temporizador: true,
    resumen: "3 min tapping the screen as soon as the stimulus appears.", paraQue: "Measures your alertness; lapse = 355 ms or more.",
    fuente: "pvtb", metricas: ["sueno"], compara: { nombre: "PVT median", unidad: "ms" },
    pasos: [{ id: "pvt", tipo: "especial", componente: "pvt" }],
    calificar: (r, base = {}) => {
      const p = r.pvt || r;
      const med = num(p.mediana_ms);
      const lapsos = num(p.lapsos) || 0;
      const b = num(base.mediana);
      const pct = b && med != null ? Math.round(((med - b) / b) * 100) : null;
      let nivel = "ok";
      if (lapsos >= 4 && base.tareaCritica) nivel = "urgente";
      else if (lapsos >= 3 || (pct != null && pct > 30)) nivel = "moderado";
      return R(med, nivel, `Median ${med} ms · ${lapsos} ${lapsos === 1 ? "lapse" : "lapses"}${base.tareaCritica && lapsos >= 3 ? " before a critical task" : ""}.`, { lapsos, falsas: p.falsas, pct });
    },
    critico: () => false,
  },
  {
    id: "amt4", categoria: "mente", nombre: "Quick orientation (AMT-4)", icono: "user", duracion: "1 min", companero: true,
    resumen: "4 questions: age, date of birth, place and year.", paraQue: "A new error is new confusion (3 NEWS2 points).",
    fuente: "amt4,news2", metricas: ["conciencia"], compara: { nombre: "errors", unidad: "" },
    pasos: [
      opciones("edad", "Question: How old are you?", [["bien", "Answered correctly"], ["error", "Answered incorrectly"]]),
      opciones("nacimiento", "Question: What is your date of birth?", [["bien", "Answered correctly"], ["error", "Answered incorrectly"]]),
      opciones("lugar", "Question: Where are we now?", [["bien", "Answered correctly"], ["error", "Answered incorrectly"]]),
      opciones("anio", "Question: What year is it?", [["bien", "Answered correctly"], ["error", "Answered incorrectly"]]),
    ],
    calificar: (r, base = {}) => {
      const errores = ["edad", "nacimiento", "lugar", "anio"].filter((k) => r[k] === "error").length;
      const nuevo = errores > (num(base.erroresPrevios) || 0);
      return R(errores, nuevo ? "urgente" : "ok", nuevo ? `${errores} ${errores === 1 ? "error" : "errors"}: new confusion (3 NEWS2 points).` : errores ? `${errores} errors, same as before.` : "Oriented: no errors.", { confusion: nuevo });
    },
    critico: (r, base = {}) => {
      const errores = ["edad", "nacimiento", "lugar", "anio"].filter((k) => r[k] === "error").length;
      return errores > (num(base.erroresPrevios) || 0) && (num(base.news2) || 0) + 3 >= 7;
    },
  },
  {
    id: "cincinnati", categoria: "mente", nombre: "Cincinnati test", icono: "eye", duracion: "1 min", companero: true, temporizador: true,
    resumen: "Face, arms and speech. A crewmate scores it.", paraQue: "Any sudden-onset abnormality is critical.",
    fuente: "cincinnati1999,pronam", metricas: ["conciencia"], compara: { nombre: "abnormalities", unidad: "" },
    pasos: [
      info("sonrisa", "Ask your crewmate to smile showing their teeth."),
      sino("cara", "Does one side of the face droop or not move the same?"),
      info("brazos", "Have them raise both arms with eyes closed for 10 seconds.", { segundos: 10 }),
      sino("brazo", "Does one arm drift down or can they not raise it?"),
      info("frase", "Have them repeat: “The sky is blue above the Earth.”"),
      sino("habla", "Is their speech slurred, do they use the wrong words or can they not speak?"),
    ],
    calificar: (r) => {
      const a = ["cara", "brazo", "habla"].filter((k) => r[k] === "si");
      return R(a.length, a.length ? "critico" : "ok", a.length ? `Abnormality in ${a.map((x) => ({ cara: "the face", brazo: "an arm", habla: "speech" })[x]).join(", ")}: emergency.` : "No abnormalities.", { anomalias: a });
    },
    critico: (r) => ["cara", "brazo", "habla"].some((k) => r[k] === "si"),
  },
  {
    id: "kss", categoria: "mente", nombre: "Karolinska Sleepiness", icono: "moon", duracion: "10 s",
    resumen: "How awake are you right now? From 1 to 9.", paraQue: "7 or more before a critical task notifies mission planning.",
    fuente: "kss1990", metricas: ["sueno"], compara: { nombre: "KSS", unidad: "" },
    pasos: [escala("kss", "How awake are you right now?", 1, 9, { 1: "Very alert", 5: "Neither alert nor sleepy", 9: "Fighting to stay awake" }, { campo: "kss" })],
    calificar: (r, base = {}) => {
      const k = num(r.kss);
      if (k >= 7) return R(k, "info", base.tareaCritica ? `KSS ${k} before a critical task: notify mission planning.` : `KSS ${k}: high sleepiness.`, { avisoPlaneacion: !!base.tareaCritica });
      return R(k, "ok", `KSS ${k}: alert enough.`);
    },
    critico: () => false,
  },
  {
    id: "diario_sueno", categoria: "mente", nombre: "Sleep diary", icono: "bed", duracion: "1 min",
    resumen: "Hours, awakenings, quality and environment of your night.", paraQue: "Calculates hours and efficiency; separates environment from insomnia.",
    fuente: "diario2012,dsm5", metricas: ["sueno"], compara: { nombre: "hours slept", unidad: "h" },
    pasos: [
      { id: "acostarse", tipo: "hora", texto: "What time did you go to bed?" },
      { id: "levantarse", tipo: "hora", texto: "What time did you get up?" },
      numero("latencia", "How many minutes did it take you to fall asleep?", "minutos", "min"),
      numero("despertares", "How many times did you wake up?", "minutos", "times"),
      numero("despierto", "How many minutes were you awake during the night?", "minutos", "min"),
      escala("calidad", "How did you sleep?", 1, 5, { 1: "Very badly", 3: "Okay", 5: "Very well" }, { campo: "calidad" }),
      { id: "ambiente", tipo: "multi", texto: "Was any of this in your area?", opciones: [["ruido", "Noise"], ["luz", "Light"], ["calor", "Heat"]] },
      sino("somnifero", "Did you take a sleeping pill?"),
    ],
    calificar: (r) => {
      const h = (t) => { const [a, b] = String(t || "").split(":").map(Number); return Number.isFinite(a) ? a * 60 + (b || 0) : null; };
      const ini = h(r.acostarse), fin = h(r.levantarse);
      const cama = ini != null && fin != null ? ((fin - ini + 1440) % 1440) || 1440 : null;
      const dormido = cama != null ? Math.max(0, cama - (num(r.latencia) || 0) - (num(r.despierto) || 0)) : null;
      const horas = dormido != null ? Math.round((dormido / 60) * 10) / 10 : null;
      const ef = cama ? Math.round((dormido / cama) * 100) : null;
      const amb = Array.isArray(r.ambiente) ? r.ambiente : [];
      const nivel = horas != null && (horas < 6 || ef < 85) ? "moderado" : "ok";
      const causas = { sueno: amb.length ? { ambiente: 3 } : horas != null && horas < 7 && ef < 85 ? { insomnio: 1 } : {} };
      return R(horas, nivel, `You slept ${horas ?? "—"} h with ${ef ?? "—"} % efficiency${amb.length ? `; there was ${amb.map((x) => ({ ruido: "noise", luz: "light", calor: "heat" })[x] || x).join(", ")}` : ""}.`, { eficiencia: ef, ambiente: amb, somnifero: r.somnifero === "si" }, { causas });
    },
    critico: () => false,
  },
  {
    id: "msaq", categoria: "mente", nombre: "Space motion sickness scale (MSAQ)", icono: "sparkle", duracion: "1 min",
    resumen: "Stomach, head and sleepiness, from 1 to 9.", paraQue: "Separates space motion sickness from radiation nausea.",
    fuente: "msaq2001", metricas: ["conciencia", "radiacion"], compara: { nombre: "MSAQ", unidad: "%" },
    pasos: [
      escala("nausea", "Nausea", 1, 9, { 1: "Not at all", 9: "Severely" }, { campo: "msaq", grupo: "estomago" }),
      escala("vomitar", "Urge to vomit", 1, 9, { 1: "Not at all", 9: "Severely" }, { campo: "msaq", grupo: "estomago" }),
      escala("mareo", "Dizziness", 1, 9, { 1: "Not at all", 9: "Severely" }, { campo: "msaq", grupo: "cabeza" }),
      escala("giro", "Spinning sensation or heavy head", 1, 9, { 1: "Not at all", 9: "Severely" }, { campo: "msaq", grupo: "cabeza" }),
      escala("somnolencia", "Drowsiness", 1, 9, { 1: "Not at all", 9: "Severely" }, { campo: "msaq", grupo: "sueno" }),
      escala("cansancio", "Tiredness", 1, 9, { 1: "Not at all", 9: "Severely" }, { campo: "msaq", grupo: "sueno" }),
    ],
    calificar: (r) => {
      const v = (k) => num(r[k]) || 1;
      const est = (v("nausea") + v("vomitar")) / 2, cab = (v("mareo") + v("giro")) / 2, sue = (v("somnolencia") + v("cansancio")) / 2;
      const pct = Math.round(((v("nausea") + v("vomitar") + v("mareo") + v("giro") + v("somnolencia") + v("cansancio") - 6) / 48) * 100);
      const causas = {};
      if (cab >= 5 && cab >= est) { causas.conciencia = { mareo: 3 }; causas.radiacion = { mareo: 3 }; }
      else if (est >= 5) causas.radiacion = { radiacion: 2, estomago: 1 };
      return R(pct, pct >= 60 ? "urgente" : pct >= 40 ? "moderado" : "ok", `MSAQ ${pct} %: stomach ${f1(est)}, head ${f1(cab)}, sleepiness ${f1(sue)}.`, { estomago: est, cabeza: cab, sueno: sue }, { causas });
    },
    critico: () => false,
  },
  {
    id: "temperatura", categoria: "mente", nombre: "Properly taken temperature", icono: "thermo", duracion: "1 min",
    resumen: "15 min without exercise or food, always in the same spot.", paraQue: "Compared with your in-flight baseline, which rises about 1 °C.",
    fuente: "stahn2017,news2", metricas: ["temp"], compara: { nombre: "temperature", unidad: "°C" },
    pasos: [
      sino("espera", "Have you gone 15 minutes without exercise or food?"),
      info("esperar", "Wait 15 minutes without exercise or food.", { segundos: 900, si: (r) => r.espera === "no" }),
      opciones("sitio", "Where are you measuring?", [["oral", "Mouth"], ["oido", "Ear"], ["frente", "Forehead"], ["axila", "Armpit"]]),
      numero("temperatura", "Temperature", "temperatura", "°C", { paso: 0.1 }),
    ],
    calificar: (r, base = {}) => {
      const t = num(r.temperatura);
      const hi = base.rangoTemp?.[1];
      let nivel = t >= 39.1 ? "urgente" : t >= 38.1 ? "moderado" : t <= 35 ? "critico" : t <= 36 ? "moderado" : "ok";
      if (nivel === "ok" && hi != null && t >= hi + 1) nivel = "moderado";
      return R(t, nivel, `${f1(t)} °C${hi != null ? ` · your baseline reaches ${f1(hi)} °C` : ""}.`, { sitio: r.sitio });
    },
    critico: (r, base = {}) => { const t = num(r.temperatura); return t != null && (t <= 35 || (t >= 39.1 && (base.confusion || num(base.sistolica) <= 90))); },
    aVivo: (r) => ({ temperatura: num(r.temperatura) }),
  },
  {
    id: "dolor", categoria: "mente", nombre: "Pain scale", icono: "alert", duracion: "30 s",
    resumen: "Mark where it hurts and rate it from 0 to 10.", paraQue: "For bones, head and chest. Chest pain opens the danger signs.",
    fuente: "nrs", metricas: ["huesos", "vision"], compara: { nombre: "pain", unidad: "/10" },
    pasos: [{ id: "zonas", tipo: "especial", componente: "mapaDolor" }, escala("intensidad", "How strong is the pain?", 0, 10, { 0: "None", 5: "Moderate", 10: "The worst" }, { campo: "dolor" })],
    calificar: (r) => {
      const z = Array.isArray(r.zonas) ? r.zonas : [];
      const i = num(r.intensidad);
      const pecho = z.includes("pecho");
      const nivel = pecho || i >= 7 ? "urgente" : i >= 4 ? "moderado" : "ok";
      const causas = { huesos: { ...(z.includes("espalda") ? { espalda: 2 } : {}), ...(z.includes("costado") ? { rinon: 2 } : {}) } };
      return R(i, nivel, `${z.length ? z.join(", ") : "No area"} · ${i}/10.${pecho ? " Chest pain: check the danger signs." : ""}`, { zonas: z, peligro: pecho }, { causas });
    },
    critico: () => false,
  },
  {
    id: "amsler", categoria: "espacio", nombre: "Amsler grid", icono: "eye", duracion: "2 min", legado: "amsler",
    resumen: "One eye at a time; tap the wavy or missing areas.", paraQue: "Distorted lines or spots are urgent.",
    fuente: "amsler,nasa_sans", metricas: ["vision"], compara: { nombre: "marked areas", unidad: "" },
    pasos: [{ id: "amsler", tipo: "especial", componente: "amsler" }],
    calificar: (r) => {
      const a = r.amsler || {};
      const n = (a.od?.length || 0) + (a.oi?.length || 0);
      return R(n, n ? "urgente" : "ok", n ? `${n} ${n === 1 ? "marked area" : "marked areas"}${a.od?.length ? " in the right eye" : ""}${a.oi?.length ? " in the left eye" : ""}.` : "No distortion in either eye.", { od: a.od || [], oi: a.oi || [] }, { causas: n ? { vision: { sans: 3 } } : {} });
    },
    critico: () => false,
  },
  {
    id: "agudeza", categoria: "espacio", nombre: "Visual acuity", icono: "eye", duracion: "3 min",
    resumen: "Letters that get smaller, far and near, one eye at a time.", paraQue: "2 lines or more worse than your baseline is urgent.",
    fuente: "nasa_sans", metricas: ["vision"], compara: { nombre: "lines read", unidad: "" },
    pasos: [{ id: "agudeza", tipo: "especial", componente: "agudeza" }],
    calificar: (r, base = {}) => {
      const a = r.agudeza || {};
      const ant = base.anterior?.agudeza || base.anterior || null;
      const ojos = ["od", "oi", "cerca"];
      const perdida = ant ? Math.max(0, ...ojos.map((k) => (num(ant[k]) ?? 0) - (num(a[k]) ?? 0))) : 0;
      const nivel = perdida >= 2 ? "urgente" : perdida === 1 ? "moderado" : "ok";
      return R(Math.min(num(a.od) ?? 0, num(a.oi) ?? 0), nivel, `Right ${a.od ?? "—"} · left ${a.oi ?? "—"} · near ${a.cerca ?? "—"} lines${perdida ? `; ${perdida} ${perdida === 1 ? "line" : "lines"} worse than your baseline` : ""}.`, { perdida }, { causas: perdida >= 2 ? { vision: { sans: 3 } } : {} });
    },
    critico: () => false,
  },
  {
    id: "lentes", categoria: "espacio", nombre: "Anticipation glasses", icono: "eye", duracion: "2 min",
    resumen: "Read the card with each prescription and choose the one that is clearest.", paraQue: "If the prescription goes up, report possible SANS.",
    fuente: "nasa_sans", metricas: ["vision"], compara: { nombre: "prescription", unidad: "" },
    pasos: [opciones("graduacion", "With which prescription do you read the near card best?", GRADUACIONES)],
    calificar: (r, base = {}) => {
      const g = Number(r.graduacion || 0);
      const ant = base.anterior ? Number(base.anterior.graduacion || 0) : null;
      const sube = ant != null && g > ant;
      return R(g, sube ? "moderado" : "ok", sube ? `It went up from ${ant ? `+${ant.toFixed(2)}` : "0"} to +${g.toFixed(2)}: report possible SANS.` : `You read best with ${g ? `+${g.toFixed(2)}` : "no magnification"}.`, { sube }, { causas: sube ? { vision: { sans: 3 } } : {} });
    },
    critico: () => false,
  },
  {
    id: "tormenta_sintomas", categoria: "espacio", nombre: "Symptoms after a solar storm", icono: "rad", duracion: "1 min",
    resumen: "Nausea, vomiting, tiredness and skin; every 6 h for 2 days.", paraQue: "Separates radiation symptoms and records your dose.",
    fuente: "ochmo_tb020", metricas: ["radiacion"], compara: { nombre: "tiredness", unidad: "/10" },
    pasos: [
      sino("nausea", "Do you have nausea?"),
      sino("vomito", "Did you vomit?"),
      { id: "hora_vomito", tipo: "hora", texto: "What time was the first vomit?", si: (r) => r.vomito === "si" },
      escala("cansancio", "How tired are you?", 0, 10, { 0: "Not at all", 10: "Exhausted" }, { campo: "dolor" }),
      sino("piel", "Is your skin red or burning in an exposed area?"),
      numero("dosis", "Dosimeter reading", "msv", "mSv", { obligatorio: false, paso: 0.1 }),
    ],
    calificar: (r) => {
      const nivel = r.vomito === "si" ? "urgente" : r.nausea === "si" || r.piel === "si" || num(r.cansancio) >= 6 ? "moderado" : "ok";
      const causas = { radiacion: { ...(r.vomito === "si" || r.nausea === "si" ? { radiacion: 2 } : {}), ...(r.piel === "si" ? { radiacion: 3 } : {}) } };
      return R(num(r.cansancio), nivel, [r.nausea === "si" && "nausea", r.vomito === "si" && `vomiting${r.hora_vomito ? ` at ${r.hora_vomito}` : ""}`, r.piel === "si" && "red skin"].filter(Boolean).join(", ") || "No symptoms.", { dosis: num(r.dosis) }, { causas });
    },
    critico: () => false,
  },
  {
    id: "orina", categoria: "espacio", nombre: "Urine color", icono: "drop", duracion: "10 s",
    resumen: "Compare the color with the 8-shade chart.", paraQue: "6 to 8 indicates little water (risk of stones and low blood pressure).",
    fuente: "armstrong1994", metricas: ["huesos", "pa"], compara: { nombre: "urine shade", unidad: "" },
    pasos: [escala("color", "Which shade looks most like your urine?", 1, 8, { 1: "Very light", 8: "Very dark" }, { campo: "orina", colores: COLORES_ORINA })],
    calificar: (r) => {
      const c = num(r.color);
      const poca = c >= 6;
      return R(c, poca ? "moderado" : "ok", poca ? `Shade ${c}: little water. Drink more.` : `Shade ${c}: adequate hydration.`, { pocaAgua: poca }, { causas: poca ? { huesos: { deshidratacion: 3, rinon: 1 }, pa: { deshidratacion: 3 }, fc: { deshidratacion: 2 } } : {} });
    },
    critico: () => false,
  },
  {
    id: "ejercicio_registro", categoria: "espacio", nombre: "Exercise log", icono: "dumbbell", duracion: "30 s",
    resumen: "Minutes of treadmill, bike and resistance today.", paraQue: "Compared with your daily goal to protect bone and muscle.",
    fuente: "ochmo_tb030,nasa_osea", metricas: ["huesos"], compara: { nombre: "% of goal", unidad: "%" },
    pasos: [numero("cinta", "Treadmill (min)", "minutos", "min"), numero("bici", "Bike (min)", "minutos", "min"), numero("resistencia", "Resistance (min)", "minutos", "min")],
    calificar: (r, base = {}) => {
      const total = (num(r.cinta) || 0) + (num(r.bici) || 0) + (num(r.resistencia) || 0);
      const meta = num(base.ejercicioMeta) || 120;
      const pct = Math.round((total / meta) * 100);
      return R(pct, pct < 80 ? "moderado" : "ok", `${total} of ${meta} min (${pct} %).`, { total, meta }, { causas: pct < 80 ? { huesos: { condicion: 2 } } : {} });
    },
    critico: () => false,
    aVivo: (r, base = {}) => ({ ejercicio_pct: Math.round((((num(r.cinta) || 0) + (num(r.bici) || 0) + (num(r.resistencia) || 0)) / (num(base.ejercicioMeta) || 120)) * 100) }),
  },
  {
    id: "agarre", categoria: "espacio", nombre: "Grip strength", icono: "dumbbell", duracion: "2 min",
    resumen: "Dynamometer, 3 tries per hand; the best one counts.", paraQue: "A drop of more than 10 % signals loss of conditioning.",
    fuente: "nasa_osea", metricas: ["huesos"], compara: { nombre: "best grip", unidad: "kg" },
    pasos: [
      lectura("derecha", "Right hand: 3 tries", [1, 2, 3].map((i) => ({ id: `i${i}`, etiqueta: `Try ${i}`, unidad: "kg", rango: "kg" }))),
      lectura("izquierda", "Left hand: 3 tries", [1, 2, 3].map((i) => ({ id: `i${i}`, etiqueta: `Try ${i}`, unidad: "kg", rango: "kg" }))),
    ],
    calificar: (r, base = {}) => {
      const mejor = (m) => Math.max(0, ...Object.values(m || {}).map(num).filter((x) => x != null));
      const v = Math.max(mejor(r.derecha), mejor(r.izquierda));
      const b = num(base.mediana);
      const cambio = b ? Math.round(((v - b) / b) * 100) : null;
      return R(v, cambio != null && cambio < -10 ? "info" : "ok", `Best grip ${v} kg${cambio != null ? ` (${cambio > 0 ? "+" : ""}${cambio} % vs. your baseline)` : ""}.${cambio != null && cambio < -10 ? " Loss of conditioning." : ""}`, { cambio, derecha: mejor(r.derecha), izquierda: mejor(r.izquierda) }, { causas: cambio != null && cambio < -10 ? { huesos: { condicion: 2 } } : {} });
    },
    critico: () => false,
  },
  {
    id: "cabina_tripulacion", categoria: "espacio", nombre: "Cabin check", icono: "cabina", duracion: "2 min",
    resumen: "3 questions to each crew member together with CO₂, temperature and humidity.", paraQue: "If 2 or more have a headache, check the air.",
    fuente: "ochmo_co2,ochmo_tb002", metricas: ["cabina"], compara: { nombre: "with a headache", unidad: "" },
    pasos: [{ id: "tripulacion", tipo: "especial", componente: "cabinaTripulacion" }],
    calificar: (r) => {
      const t = r.tripulacion || {};
      const con = Object.entries(t).filter(([, x]) => x?.dolor).map(([id]) => Number(id));
      const cans = Object.values(t).filter((x) => x?.cansancio).length;
      return R(con.length, con.length >= 2 ? "urgente" : con.length || cans >= 2 ? "moderado" : "ok", con.length >= 2 ? `${con.length} crew members with a headache: check the cabin air.` : `${con.length} with a headache · ${cans} with tiredness.`, { conDolor: con });
    },
    critico: () => false,
  },
];

const LIBRE = { intervalo: { tipo: "libre" }, repetirSi: [] };
const MISION = { intervalo: { tipo: "mision", dias: [30, 90, "regreso-30"] }, repetirSi: [{ ficha: "vision" }, { dolorCabezaCo2: true }] };
export const INTERVALOS = {
  checkin: { intervalo: { tipo: "diaria", editable: true }, repetirSi: [] },
  who5: { intervalo: { tipo: "dias", valor: 7 }, repetirSi: [{ ficha: "animo" }] },
  phq9: { intervalo: { tipo: "dias", valor: 7 }, repetirSi: [{ ficha: "animo", niveles: ["urgente", "critico"] }] },
  gad7: { intervalo: { tipo: "dias", valor: 7 }, repetirSi: [{ ficha: "animo", niveles: ["urgente", "critico"] }] },
  diario_sueno: { intervalo: { tipo: "diaria", editable: true }, repetirSi: [] },
  pvt: { intervalo: { tipo: "horas", valor: 24 }, repetirSi: [{ tareaCritica: true }, { ficha: "sueno" }, { ficha: "conciencia" }] },
  kss: LIBRE,
  amsler: MISION, agudeza: MISION, lentes: MISION,
  ortostatica: { intervalo: { tipo: "gravedad" }, repetirSi: [{ ficha: "pa", rama: "baja" }] },
  agarre: { intervalo: { tipo: "dias", valor: 7 }, repetirSi: [{ ficha: "huesos" }] },
  ejercicio_registro: { intervalo: { tipo: "diaria", editable: true }, repetirSi: [] },
  tormenta_sintomas: { intervalo: { tipo: "tormenta", horas: 6, ventanaHoras: 48 }, repetirSi: [] },
  remedicion: LIBRE, presion_pronam: LIBRE, spo2_confirmacion: LIBRE, temperatura: LIBRE, dolor: LIBRE, borg: LIBRE, recuperacion_fc: LIBRE,
  llenado_capilar: LIBRE, amt4: { ...LIBRE, nuncaBloquear: true }, cincinnati: { ...LIBRE, nuncaBloquear: true }, msaq: LIBRE, orina: LIBRE, cabina_tripulacion: LIBRE,
};
export const SOLO_PANTALLA = ["amsler", "agudeza", "lentes", "pvt"];
for (const p of PRUEBAS_CATALOGO) Object.assign(p, INTERVALOS[p.id] || LIBRE, { soloPantalla: SOLO_PANTALLA.includes(p.id) });

export const PRUEBAS_POR_ID = Object.fromEntries(PRUEBAS_CATALOGO.map((p) => [p.id, p]));
export const LEGADO_A_PRUEBA = { checkin: "checkin", remedicion: "remedicion", ortostatica: "ortostatica", reaccion: "pvt", who5: "who5", phq9: "phq9", gad7: "gad7", amsler: "amsler", presion: "presion_pronam" };

export function pasosVisibles(prueba, respuestas = {}) {
  return prueba.pasos.filter((p) => !p.si || p.si(respuestas));
}

export function calificarPrueba(id, respuestas = {}, base = {}) {
  const p = PRUEBAS_POR_ID[id];
  if (!p) return null;
  const r = p.calificar(respuestas, base);
  return { ...r, critico: !!p.critico?.(respuestas, base), alcance: r.alcance || (p.critico?.(respuestas, base) ? "tripulacion" : null) };
}

const DIA = 864e5;

export function desdeLegado(p) {
  const id = LEGADO_A_PRUEBA[p.tipo];
  if (!id || p.resultado?.rp || String(p.id).startsWith("vivo-")) return null;
  const res = p.resultado || {};
  let respuestas = {};
  if (["who5", "phq9", "gad7"].includes(p.tipo)) respuestas = Object.fromEntries((res.respuestas || []).map((v, i) => [`i${i + 1}`, v]));
  else if (p.tipo === "reaccion") respuestas = { pvt: res };
  else if (p.tipo === "amsler") respuestas = { amsler: { od: res.celdas?.od || (res.od ? ["?"] : []), oi: res.celdas?.oi || (res.oi ? ["?"] : []) } };
  else if (p.tipo === "presion") respuestas = { l1: { sistolica: res.sistolica, diastolica: res.diastolica } };
  else if (p.tipo === "remedicion") respuestas = { remedicion: res };
  else respuestas = res;
  const c = calificarPrueba(id, respuestas, {});
  return { id: `legado-${p.id}`, astronaut_id: p.astronaut_id, prueba_id: id, valor: { respuestas, resultado: c }, nivel: c?.nivel || "ok", hecho_en: p.creada_en || `${p.fecha}T12:00:00`, desde_ficha: null, legado: true };
}

export function checkinComoResultado(c) {
  const r = calificarPrueba("checkin", { checkin: c }, {});
  return { id: `checkin-${c.astronaut_id}-${c.fecha}`, astronaut_id: c.astronaut_id, prueba_id: "checkin", valor: { respuestas: { checkin: c }, resultado: r }, nivel: r.nivel, hecho_en: `${c.fecha}T08:00:00`, desde_ficha: null, legado: true };
}

export function historialDe(resultados = [], pruebasLegado = [], checkins = []) {
  const out = [...resultados, ...pruebasLegado.map(desdeLegado).filter(Boolean), ...checkins.map(checkinComoResultado)];
  return out.sort((a, b) => String(a.hecho_en).localeCompare(String(b.hecho_en)));
}

export function baseDe(id, historial = [], extra = {}) {
  const prev = historial.filter((r) => r.prueba_id === id);
  const valores = prev.map((r) => num(r.valor?.resultado?.valor)).filter((x) => x != null);
  const ult = prev.at(-1) || null;
  const anterior = ult ? respuestasComoObjeto(ult.valor) : null;
  const erroresPrevios = id === "amt4" && ult ? num(ult.valor?.resultado?.valor) : 0;
  return { anteriores: prev, valores, mediana: valores.length ? mediana(valores) : null, ultimo: ult, anterior, erroresPrevios, ...extra };
}

export function baseParaPrueba(id, { data, analisis, historial = [], excluir = null } = {}) {
  if (!data || !analisis) return {};
  const porK = Object.fromEntries((analisis.tarjetas || []).map((t) => [t.k, t]));
  return baseDe(id, historial.filter((x) => !excluir || x.id !== excluir), {
    tareaCritica: !!data.enVivo?.tarea_critica, sistolica: analisis.hoy?.sistolica, news2: analisis.news2?.total, confusion: !!analisis.checkinHoy?.confusion,
    rangoTemp: porK.temp?.rangoPersonal, ejercicioMeta: Number(data.profile?.ejercicio_prescrito_min) || 120,
  });
}

export function comparar(id, valor, base = {}) {
  const p = PRUEBAS_POR_ID[id];
  const c = p?.compara || { nombre: "resultado", unidad: "" };
  if (!base.valores?.length) return "First time: this will be your baseline.";
  const u = c.unidad ? ` ${c.unidad}` : "";
  const m = base.mediana;
  const pct = m ? Math.round(((valor - m) / m) * 100) : null;
  const ult = num(base.ultimo?.valor?.resultado?.valor);
  const hace = base.ultimo ? Math.max(0, Math.round((Date.now() - Date.parse(base.ultimo.hecho_en)) / DIA)) : null;
  return `Your usual ${c.nombre} is ${f1(m)}${u}; today ${valor == null ? "—" : f1(valor)}${u}${pct != null && Number.isFinite(pct) && pct !== 0 ? ` (${pct > 0 ? "+" : ""}${pct} %)` : ""}.${ult != null ? ` Last time (${hace === 0 ? "today" : hace === 1 ? "yesterday" : `${hace} days ago`}): ${f1(ult)}${u}.` : ""}`;
}

const HORA = 36e5;
const inicioDia = (t) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
const enDias = (ms) => {
  const n = Math.max(1, Math.ceil(ms / DIA - 1e-9));
  return n === 1 ? "in 1 day" : `in ${n} days`;
};
const enHoras = (ms) => {
  const n = Math.max(1, Math.ceil(ms / HORA - 1e-9));
  return n === 1 ? "in 1 h" : `in ${n} h`;
};
const NOMBRE_FICHA = { pa: { baja: "Low blood pressure", alta: "High blood pressure" } };

export function diasFijos(intervalo, diaRegreso = 180) {
  return (intervalo?.dias || []).map((d) => (d === "regreso-30" ? diaRegreso - 30 : d)).filter((d) => Number.isFinite(d)).sort((a, b) => a - b);
}

export function razonContexto(prueba, ctx = {}) {
  const fichas = ctx.fichas || [];
  const conPeligro = fichas.find((f) => f.peligro && (PRUEBAS_RECOMENDADAS[f.clave] || []).includes(prueba.id));
  if (conPeligro) return `there is a danger sign on your ${TITULOS[conPeligro.clave]} card`;
  for (const r of prueba.repetirSi || []) {
    if (r.ficha) {
      const f = fichas.find((x) => x.clave === r.ficha && (!r.rama || x.rama === r.rama) && (!r.niveles || r.niveles.includes(x.nivel)));
      if (!f) continue;
      const nombre = NOMBRE_FICHA[f.clave]?.[f.rama] || TITULOS[f.clave];
      return r.niveles ? `your ${nombre} card is ${ETIQUETA_NIVEL[f.nivel].toLowerCase()}` : `your ${nombre} card is open`;
    }
    if (r.tareaCritica && ctx.tareaCritica) return "there is a critical task in the next 2 h";
    if (r.dolorCabezaCo2 && ctx.dolorCabezaCo2) return "there was a headache with high CO₂";
  }
  return null;
}

function bloqueoDe(prueba, ctx) {
  const iv = prueba.intervalo || { tipo: "libre" };
  const ahora = ctx.ahora ?? Date.now();
  const previos = (ctx.historial || []).filter((r) => r.prueba_id === prueba.id).sort((a, b) => String(a.hecho_en).localeCompare(String(b.hecho_en)));
  const ult = previos.at(-1) || null;
  const t = ult ? Date.parse(ult.hecho_en) : null;
  if (iv.tipo === "diaria") return { bloqueo: null, editar: t != null && t >= inicioDia(ahora) ? ult : null };
  if (iv.tipo === "dias" && t != null && ahora - t < iv.valor * DIA) {
    const espera = t + iv.valor * DIA - ahora;
    return { bloqueo: { espera, texto: `Available ${enDias(espera)} · done ${iv.valor === 7 ? "every week" : `every ${iv.valor} days`}` } };
  }
  if (iv.tipo === "horas" && t != null && ahora - t < iv.valor * HORA) {
    const espera = t + iv.valor * HORA - ahora;
    return { bloqueo: { espera, texto: `Available ${enHoras(espera)} · done every ${iv.valor} h` } };
  }
  if (iv.tipo === "mision") {
    const dia = Number(ctx.diaMision);
    if (!Number.isFinite(dia)) return { bloqueo: null };
    const fijos = diasFijos(iv, ctx.diaRegreso ?? 180);
    const pasado = fijos.filter((d) => d <= dia).at(-1);
    if (pasado != null) {
      const desde = inicioDia(ahora - (dia - pasado) * DIA);
      if (t == null || t < desde) return { bloqueo: null };
    }
    const sig = fijos.find((d) => d > dia);
    if (sig == null) return { bloqueo: { espera: Infinity, texto: "You already did the checks for this mission · done on fixed mission days" } };
    return { bloqueo: { espera: (sig - dia) * DIA, texto: `Available ${enDias((sig - dia) * DIA)} · done on fixed mission days (day ${sig})` } };
  }
  if (iv.tipo === "gravedad") {
    if (!["luna", "marte", "regreso"].includes(ctx.fase)) return { bloqueo: { espera: Infinity, texto: "In orbit only with the Low blood pressure card open" } };
    if (t != null && t >= inicioDia(ahora)) return { bloqueo: { espera: inicioDia(ahora) + DIA - ahora, texto: "Available tomorrow · done once a day under gravity" } };
    return { bloqueo: null };
  }
  if (iv.tipo === "tormenta") {
    const fin = (ctx.eventosRadiacion || []).map((e) => (e.fin ? Date.parse(e.fin) : ahora)).filter((x) => x <= ahora + 1 && ahora - x <= iv.ventanaHoras * HORA).sort((a, b) => b - a)[0];
    const activa = (ctx.eventosRadiacion || []).some((e) => !e.fin);
    if (fin == null && !activa) return { bloqueo: { espera: Infinity, texto: "Only in the 2 days after a solar storm" } };
    if (t != null && ahora - t < iv.horas * HORA) {
      const espera = t + iv.horas * HORA - ahora;
      return { bloqueo: { espera, texto: `Available ${enHoras(espera)} · done every ${iv.horas} h after the storm` } };
    }
    return { bloqueo: null };
  }
  return { bloqueo: null };
}

export function disponibilidad(prueba, ctx = {}) {
  const base = { permitido: true, motivo: null, texto: null, editar: null, espera: 0 };
  if (!prueba) return { ...base, permitido: false, texto: "Unknown test" };
  if (prueba.nuncaBloquear || (prueba.intervalo?.tipo || "libre") === "libre") return base;
  const { bloqueo, editar } = bloqueoDe(prueba, ctx);
  if (!bloqueo) return { ...base, editar: editar || null, texto: editar ? "You already did it today · you can edit it" : null };
  if (ctx.ignorarIntervalo && ctx.origen === "control") return { ...base, motivo: "Interval ignored (presentation)", texto: bloqueo.texto };
  const razon = razonContexto(prueba, ctx);
  if (razon) return { ...base, motivo: `You can do it now: ${razon}`, texto: bloqueo.texto };
  return { ...base, permitido: false, texto: bloqueo.texto, espera: bloqueo.espera };
}

export function contextoDisponibilidad({ data, analisis, eventosFicha = [], historial = [], origen = "laptop", ignorarIntervalo = false, ahora = Date.now() } = {}) {
  const ev = data?.enVivo || {};
  const ci = analisis?.checkinHoy || {};
  const co2 = Number(analisis?.tarjetas?.find((t) => t.k === "cabina")?.valor);
  return {
    historial, ahora, origen, ignorarIntervalo,
    diaMision: data?.astronaut?.dia_mision ?? null, diaRegreso: Number(data?.astronaut?.dia_regreso) || 180,
    fase: ev.fase_mision || "orbita", tareaCritica: !!ev.tarea_critica,
    dolorCabezaCo2: !!(ci.dolor_cabeza || ci.vision_cefalea) && Number.isFinite(co2) && co2 >= UMBRALES.cabina.co2AtencionPpm,
    eventosRadiacion: data?.eventos || [],
    fichas: (eventosFicha || []).filter((e) => !e.cerrado_en).map((e) => ({ clave: e.clave, nivel: e.nivel, rama: e.respuestas?._m?.rama || null, peligro: !!e.respuestas?._m?.peligroActivo })),
  };
}

export function puedeCargarDesdeControl(id) {
  return !!PRUEBAS_POR_ID[id] && !SOLO_PANTALLA.includes(id);
}

export const CAMPOS_CHECKIN = {
  animo: "Mood (1 to 5)", estres: "Stress (1 to 5)", fatiga: "Fatigue (1 to 5)", tripulacion: "Relationship with the crew (1 to 5)",
  confusion: "Do you feel confused or disoriented?", mareo_de_pie: "Are you dizzy?", vision_borrosa: "Blurred vision?", dolor_cabeza: "Headache?",
  sintomas: "Signs of infection", tiempo_reaccion_ms: "Quick reaction (ms)",
};
const ESPECIALES = { remedicion: ["remedicion", "Readings before and after rest"], pvt: ["pvt", "Reaction times"], amsler: ["amsler", "Areas marked on the grid"], agudeza: ["agudeza", "Lines read per eye"], mapaDolor: ["zonas", "Where does it hurt?"], cabinaTripulacion: ["tripulacion", "Symptoms of each crew member"] };

export function listaRespuestas(prueba, r = {}, horas = {}, ahora = new Date().toISOString()) {
  const out = [];
  const h = (id) => horas[id] || ahora;
  for (const p of pasosVisibles(prueba, r)) {
    if (p.tipo === "info") continue;
    if (p.tipo === "especial") {
      if (p.componente === "checkin") {
        for (const [k, et] of Object.entries(CAMPOS_CHECKIN)) if (r.checkin?.[k] !== undefined && r.checkin?.[k] !== null) out.push({ id: `checkin.${k}`, pregunta: et, respuesta: r.checkin[k], hora: h("checkin") });
        continue;
      }
      const m = ESPECIALES[p.componente];
      if (m && r[m[0]] !== undefined) out.push({ id: m[0], pregunta: m[1], respuesta: r[m[0]], hora: h(m[0]) });
      continue;
    }
    if (r[p.id] === undefined || r[p.id] === "") continue;
    out.push({ id: p.id, pregunta: p.texto, respuesta: r[p.id], hora: h(p.id), ...(p.minuto != null ? { minuto: p.minuto } : {}) });
  }
  return out;
}

export function construirValor({ prueba, respuestas = {}, horas = {}, base = {}, resultado, origen = "laptop", ahora = new Date().toISOString() }) {
  const { causas, ...res } = resultado || {};
  return {
    respuestas: listaRespuestas(prueba, respuestas, horas, ahora),
    resultado: res,
    base: { mediana: base.mediana ?? null, ultimo: num(base.ultimo?.valor?.resultado?.valor), veces: base.valores?.length || 0 },
    comparacion: comparar(prueba.id, res.valor, base),
    origen,
    causas: causas || {},
  };
}

export function respuestasDeResultado(fila) {
  const prueba = PRUEBAS_POR_ID[fila?.prueba_id];
  const r = fila?.valor?.respuestas;
  if (Array.isArray(r)) return r;
  if (!prueba || !r) return [];
  return listaRespuestas(prueba, r, {}, fila.hecho_en);
}

export function errorDePaso(paso, r = {}) {
  if (paso.tipo === "numero") {
    if (r[paso.id] == null || r[paso.id] === "") return paso.obligatorio ? "This value is missing." : null;
    const v = validarLectura({ [paso.campo]: r[paso.id] });
    if (LIMITES[paso.campo] && !v.ok) return v.errores[0].texto;
    return validarCampo(paso.campo, r[paso.id], { obligatorio: paso.obligatorio });
  }
  if (paso.tipo === "lectura") {
    const val = r[paso.id] || {};
    for (const c of paso.campos) {
      const e = validarCampo(c.rango, val[c.id]);
      if (e) return `${c.etiqueta}: ${e}`;
    }
    const v = validarLectura(val);
    return v.ok ? null : v.errores[0].texto;
  }
  if (paso.tipo === "escala") return validarCampo(paso.campo || "dolor", r[paso.id]) ? "Choose an option." : null;
  if (["opciones", "sino", "hora"].includes(paso.tipo)) return r[paso.id] == null || r[paso.id] === "" ? "Choose an option." : null;
  if (paso.tipo === "especial" && paso.componente === "agudeza") return r.agudeza?.od == null || r.agudeza?.oi == null || r.agudeza?.cerca == null ? "Mark all three: right eye, left eye and near." : null;
  return null;
}

export function nivelResultado(r) {
  return r?.nivel in RANGO_NIVEL ? r.nivel : "ok";
}

export function peorNivel(lista = []) {
  return mayorNivel(...lista);
}

export const PESTANAS_PRUEBAS = ["alertas", ...ORDEN_CATEGORIAS, "completo"];
export const CORTO_PRUEBA = {
  checkin: "Check-in", remedicion: "Re-measure", ortostatica: "Orthostatic", presion_pronam: "Pressure", recuperacion_fc: "HR recovery", spo2_confirmacion: "Finger SpO₂",
  borg: "Borg", llenado_capilar: "Capillary refill", who5: "WHO-5", phq9: "PHQ-9", gad7: "GAD-7", pvt: "PVT-B", amt4: "AMT-4", cincinnati: "Cincinnati", kss: "KSS",
  diario_sueno: "Sleep diary", msaq: "MSAQ", temperatura: "Temperature", dolor: "Pain", amsler: "Amsler", agudeza: "Acuity", lentes: "Glasses",
  tormenta_sintomas: "Storm", orina: "Urine", ejercicio_registro: "Exercise", agarre: "Grip", cabina_tripulacion: "Cabin",
};

export function recomendadasPorFichas(eventos = []) {
  const m = new Map();
  for (const e of (eventos || []).filter((x) => !x.cerrado_en)) {
    for (const id of PRUEBAS_RECOMENDADAS[e.clave] || []) m.set(id, [...(m.get(id) || []), { clave: e.clave, nivel: e.nivel }]);
  }
  return m;
}

export function idsDePestana(tab, recomendadas = new Map()) {
  if (tab === "alertas") return PRUEBAS_CATALOGO.filter((p) => recomendadas.has(p.id)).map((p) => p.id);
  if (tab === "completo") return ORDEN_CATEGORIAS.flatMap((c) => PRUEBAS_CATALOGO.filter((p) => p.categoria === c).map((p) => p.id));
  return PRUEBAS_CATALOGO.filter((p) => p.categoria === tab).map((p) => p.id);
}

export function conteoPestanas(recomendadas = new Map()) {
  const nivel = (ids) => mayorNivel(...ids.flatMap((id) => (recomendadas.get(id) || []).map((f) => f.nivel)));
  const out = { alertas: { n: recomendadas.size, nivel: nivel([...recomendadas.keys()]) } };
  for (const c of ORDEN_CATEGORIAS) {
    const ids = PRUEBAS_CATALOGO.filter((p) => p.categoria === c && recomendadas.has(p.id)).map((p) => p.id);
    out[c] = { n: ids.length, nivel: nivel(ids) };
  }
  return out;
}

export function pestanaInicial(cat, recomendadas = new Map()) {
  if (PESTANAS_PRUEBAS.includes(cat)) return cat;
  return recomendadas.size ? "alertas" : "diario";
}

export function seleccionInicial(ids = [], recomendadas = new Map(), actual = null) {
  if (actual && ids.includes(actual)) return actual;
  return ids.find((id) => recomendadas.has(id)) || ids[0] || null;
}

export function resumenUltimo(prueba, fila) {
  if (!fila) return { valor: "Never", unidad: "" };
  const v = num(fila.valor?.resultado?.valor);
  if (prueba.id === "amsler") return { valor: v ? `${v} ${v === 1 ? "zona" : "zonas"}` : "no changes", unidad: "" };
  if (prueba.id === "cincinnati") return { valor: v ? "abnormality" : "no abnormalities", unidad: "" };
  if (prueba.id === "checkin") return { valor: v ? `${v} ${v === 1 ? "symptom" : "symptoms"}` : "no symptoms", unidad: "" };
  if (prueba.id === "lentes") return { valor: v ? `+${v.toFixed(2)}` : "no magnification", unidad: "" };
  if (v == null) return { valor: "—", unidad: "" };
  return { valor: f1(v), unidad: prueba.compara?.unidad || "" };
}

export function cuandoToca(disp) {
  if (!disp || disp.permitido) return null;
  const m = /Available (in \d+ (?:days|day|h)|tomorrow)/.exec(disp.texto || "");
  return m ? m[1] : "not due";
}

