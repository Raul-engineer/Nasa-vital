import { calcularNews2, evaluarOrtostatica, mediana, UMBRALES } from "./analysis.js";
import { ETIQUETA_NIVEL, mayorNivel, PRUEBAS_RECOMENDADAS, RANGO_NIVEL, TITULOS } from "./fichas.js";
import { respuestasComoObjeto } from "./respuestas.js";
import { LIMITES, validarCampo, validarLectura } from "./validar.js";

export const CATEGORIAS_PRUEBA = {
  diario: { nombre: "Diario", corto: "Diario" },
  corazon: { nombre: "Corazón y respiración", corto: "Corazón" },
  mente: { nombre: "Mente y defensas", corto: "Mente" },
  espacio: { nombre: "Efectos del espacio", corto: "Espacio" },
};
export const ORDEN_CATEGORIAS = ["diario", "corazon", "mente", "espacio"];

const num = (x) => (x == null || x === "" || Number.isNaN(Number(x)) ? null : Number(x));
const f1 = (x) => Number(x).toLocaleString("es-MX", { maximumFractionDigits: 1 });
const R = (valor, nivel, texto, detalles = {}, extra = {}) => ({ valor, nivel, texto, detalles, ...extra });
const sino = (id, texto, extra = {}) => ({ id, tipo: "sino", texto, ...extra });
const info = (id, texto, extra = {}) => ({ id, tipo: "info", texto, ...extra });
const numero = (id, texto, campo, unidad, extra = {}) => ({ id, tipo: "numero", texto, campo, unidad, obligatorio: true, ...extra });
const lectura = (id, texto, campos, extra = {}) => ({ id, tipo: "lectura", texto, campos, ...extra });
const escala = (id, texto, min, max, etiquetas = {}, extra = {}) => ({ id, tipo: "escala", texto, min, max, etiquetas, ...extra });
const opciones = (id, texto, ops, extra = {}) => ({ id, tipo: "opciones", texto, opciones: ops, ...extra });
const PA_CAMPOS = [{ id: "sistolica", etiqueta: "Sistólica", unidad: "mmHg", rango: "sistolica" }, { id: "diastolica", etiqueta: "Diastólica", unidad: "mmHg", rango: "diastolica" }];
const PA_FC_CAMPOS = [...PA_CAMPOS, { id: "fc", etiqueta: "FC", unidad: "lpm", rango: "fc" }];

const OPC_WHO5 = [[5, "Todo el tiempo"], [4, "La mayor parte del tiempo"], [3, "Más de la mitad del tiempo"], [2, "Menos de la mitad del tiempo"], [1, "De vez en cuando"], [0, "Nunca"]];
const OPC_PHQ = [[0, "Ningún día"], [1, "Varios días"], [2, "Más de la mitad de los días"], [3, "Casi todos los días"]];
export const ITEMS = {
  who5: ["Me he sentido alegre y de buen ánimo", "Me he sentido tranquilo(a) y relajado(a)", "Me he sentido activo(a) y con energía", "Me he despertado sintiéndome fresco(a) y descansado(a)", "Mi vida diaria ha estado llena de cosas que me interesan"],
  phq9: ["Poco interés o placer en hacer las cosas", "Sentirte decaído(a), deprimido(a) o sin esperanza", "Dificultad para dormir o permanecer dormido(a), o dormir demasiado", "Sentirte cansado(a) o con poca energía", "Poco apetito o comer en exceso", "Sentirte mal contigo mismo(a), o que eres un fracaso o que has quedado mal contigo o con tu familia", "Dificultad para concentrarte en cosas como leer o ver videos", "Moverte o hablar tan lento que otros lo notan, o estar tan inquieto(a) que te mueves mucho más de lo normal", "Pensamientos de que estarías mejor muerto(a) o de lastimarte de alguna manera"],
  gad7: ["Sentirte nervioso(a), ansioso(a) o con los nervios de punta", "No poder dejar de preocuparte o no poder controlar la preocupación", "Preocuparte demasiado por diferentes cosas", "Dificultad para relajarte", "Estar tan inquieto(a) que es difícil quedarte quieto(a)", "Molestarte o irritarte fácilmente", "Sentir miedo, como si algo terrible fuera a pasar"],
};
const itemsDe = (tipo, intro) => ITEMS[tipo].map((t, i) => opciones(`i${i + 1}`, t, tipo === "who5" ? OPC_WHO5 : OPC_PHQ, { intro }));
const sumaItems = (r, n) => Array.from({ length: n }, (_, i) => num(r[`i${i + 1}`]) || 0).reduce((a, b) => a + b, 0);

export function clasificarPronam(s, d) {
  if (s == null || d == null) return { grado: "Sin dato", nivel: "ok" };
  if (s >= 180 || d >= 110) return { grado: "Grado 3", nivel: "urgente" };
  if (s >= 160 || d >= 100) return { grado: "Grado 2", nivel: "urgente" };
  if (s >= 140 || d >= 90) return { grado: "Grado 1", nivel: "moderado" };
  if (s <= 90) return { grado: "Presión baja", nivel: "urgente" };
  if (s <= 100) return { grado: "Presión baja", nivel: "moderado" };
  if (s >= 130 || d >= 85) return { grado: "Elevada", nivel: "moderado" };
  if (s >= 120 || d >= 80) return { grado: "Elevada", nivel: "ok" };
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
export const GRADUACIONES = [["0", "Sin aumento"], ["+0.75", "+0.75"], ["+1.50", "+1.50"], ["+2.25", "+2.25"], ["+3.00", "+3.00"]];
export const ZONAS_DOLOR = [["cabeza", "Cabeza"], ["pecho", "Pecho"], ["abdomen", "Abdomen"], ["espalda", "Espalda baja"], ["costado", "Costado"], ["brazos", "Brazos"], ["piernas", "Piernas"]];

export const PRUEBAS_CATALOGO = [
  {
    id: "checkin", categoria: "diario", nombre: "Check-in diario", icono: "clipboard", duracion: "30 s", legado: "checkin",
    resumen: "Ánimo, estrés, fatiga, tripulación y síntomas del día.", paraQue: "Detecta lo que los sensores no ven. Recalcula tus 12 tarjetas.",
    fuente: "Auto-reporte del check-in", metricas: ["animo", "conciencia", "vision", "temp"],
    pasos: [{ id: "checkin", tipo: "especial", componente: "checkin" }],
    calificar: (r) => {
      const c = r.checkin || {};
      const sint = [c.confusion && "confusión", c.mareo_de_pie && "mareo", c.vision_borrosa && "visión borrosa", c.dolor_cabeza && "dolor de cabeza", ...(c.sintomas || [])].filter(Boolean);
      return R(sint.length, c.confusion ? "urgente" : sint.length ? "moderado" : "ok", sint.length ? `Reportaste ${sint.join(", ")}.` : "Sin síntomas hoy.", { animo: c.animo, estres: c.estres, fatiga: c.fatiga });
    },
    critico: () => false,
  },
  {
    id: "remedicion", categoria: "corazon", nombre: "Remedición en reposo", icono: "heart", duracion: "5 min", legado: "remedicion",
    resumen: "5 min sentado y en silencio; luego FC, SpO₂ y presión.", paraQue: "Confirma si un valor alterado fue pasajero.",
    fuente: "news2", metricas: ["fc", "spo2", "pa"], compara: { nombre: "puntos NEWS2", unidad: "" },
    pasos: [{ id: "remedicion", tipo: "especial", componente: "remedicion" }],
    calificar: (r) => {
      const d = r.remedicion?.despues || r.despues || {};
      const n = calcularNews2(d, {}).total;
      return R(n, n >= 7 ? "critico" : n >= 5 ? "urgente" : n >= 1 ? "moderado" : "ok", `NEWS2 de estos signos en reposo: ${n}.`, { despues: d });
    },
    critico: (r) => calcularNews2(r.remedicion?.despues || r.despues || {}, {}).total >= 7,
  },
  {
    id: "ortostatica", categoria: "corazon", nombre: "Prueba ortostática", icono: "standing", duracion: "4 min", legado: "ortostatica",
    resumen: "Presión y pulso acostado, al minuto y a los 3 minutos de pie.", paraQue: "Detecta caída de presión al pararte (≥ 20/10 mmHg).",
    fuente: "ortostatica,pronam", metricas: ["pa", "conciencia"], compara: { nombre: "caída sistólica", unidad: "mmHg" }, temporizador: true,
    pasos: [
      info("p0", "Acuéstate boca arriba 5 minutos.", { segundos: 300 }),
      lectura("acostado", "Mide acostado.", PA_FC_CAMPOS, { minuto: 0 }),
      info("p1", "Ponte de pie y espera 1 minuto.", { segundos: 60 }),
      lectura("min1", "Mide al minuto de pie.", PA_FC_CAMPOS, { minuto: 1 }),
      info("p3", "Sigue de pie 2 minutos más.", { segundos: 120 }),
      lectura("min3", "Mide a los 3 minutos de pie.", PA_FC_CAMPOS, { minuto: 3 }),
      sino("sintomas", "¿Sentiste que te ibas a desmayar?"),
    ],
    calificar: (r) => {
      const e = evaluarOrtostatica(r);
      const caida = Math.max(0, ...e.caidas.map((c) => c.sis || 0));
      const caidaD = Math.max(0, ...e.caidas.map((c) => c.dia || 0));
      if (!e.positiva) return R(caida, "ok", `Negativa: la presión cayó ${caida}/${caidaD} mmHg.`, { positiva: false }, { causas: { pa: { ortostatica: -2 }, conciencia: {} } });
      return R(caida, r.sintomas === "si" ? "urgente" : "moderado", `Positiva: cayó ${caida}/${caidaD} mmHg a los ${e.momento} de pie.`, { positiva: true }, { causas: { pa: { ortostatica: 4 }, conciencia: { presion: 2 } } });
    },
    critico: () => false,
  },
  {
    id: "presion_pronam", categoria: "corazon", nombre: "Presión bien medida", icono: "bp", duracion: "9 min",
    resumen: "5 min sentado, 3 lecturas con 1 a 2 min entre cada una.", paraQue: "Mide tu presión como pide PRONAM y la clasifica.",
    fuente: "pronam", metricas: ["pa"], compara: { nombre: "sistólica promedio", unidad: "mmHg" }, temporizador: true,
    pasos: [
      info("p0", "Siéntate con la espalda apoyada, pies en el piso y el brazo a la altura del corazón. 5 min sin hablar.", { segundos: 300 }),
      lectura("l1", "Primera lectura.", PA_CAMPOS),
      info("e1", "Espera 1 minuto.", { segundos: 60 }),
      lectura("l2", "Segunda lectura.", PA_CAMPOS),
      info("e2", "Espera 1 minuto.", { segundos: 60 }),
      lectura("l3", "Tercera lectura.", PA_CAMPOS),
      lectura("l4", "Las dos últimas difieren más de 10 mmHg. Toma otra lectura.", PA_CAMPOS, { si: (r) => necesitaOtraLectura([r.l2, r.l3]) }),
    ],
    calificar: (r, base = {}) => {
      const p = promedioPronam(r);
      if (!p) return R(null, "ok", "Sin lecturas.");
      const c = clasificarPronam(p.sistolica, p.diastolica);
      const causas = { pa: {} };
      if (p.sistolica < 130 && p.diastolica < 85) causas.pa = { medicion: 4, hipertension: -1 };
      else if (p.sistolica >= 140 || p.diastolica >= 90) causas.pa = { hipertension: 3, medicion: -2 };
      return R(p.sistolica, c.nivel, `Promedio de las 2 últimas: ${p.sistolica}/${p.diastolica} mmHg · ${c.grado} (PRONAM).`, { promedio: { sistolica: p.sistolica, diastolica: p.diastolica }, grado: c.grado, lecturas: p.lecturas.length }, { causas });
    },
    critico: () => false,
  },
  {
    id: "recuperacion_fc", categoria: "corazon", nombre: "Recuperación de la FC", icono: "trend", duracion: "2 min",
    resumen: "FC al terminar el ejercicio y al minuto.", paraQue: "Si baja menos de 12 lpm en 1 minuto, es anormal.",
    fuente: "cole1999", metricas: ["fc"], compara: { nombre: "recuperación", unidad: "lpm" }, temporizador: true,
    pasos: [
      numero("fin", "FC al terminar el ejercicio", "fc", "lpm"),
      info("espera", "Quédate quieto 1 minuto.", { segundos: 60 }),
      numero("min1", "FC al minuto", "fc", "lpm"),
      sino("sintomas", "¿Tienes dolor de pecho, mareo o falta de aire?"),
    ],
    calificar: (r) => {
      const d = (num(r.fin) ?? 0) - (num(r.min1) ?? 0);
      const anormal = d < 12;
      return R(d, anormal ? (r.sintomas === "si" ? "urgente" : "moderado") : "ok", anormal ? `Bajó ${d} lpm en 1 minuto: menos de 12, anormal.` : `Bajó ${d} lpm en 1 minuto: normal.`, { anormal });
    },
    critico: () => false,
  },
  {
    id: "spo2_confirmacion", categoria: "corazon", nombre: "Confirmación de SpO₂", icono: "o2", duracion: "2 min",
    resumen: "Manos tibias, 1 min quieto y oxímetro de dedo.", paraQue: "Confirma o descarta una SpO₂ baja del reloj.",
    fuente: "oms_oximetria,hearn2023", metricas: ["spo2"], compara: { nombre: "SpO₂ de dedo", unidad: "%" }, temporizador: true,
    pasos: [
      info("manos", "Calienta tus manos frotándolas 30 segundos.", { segundos: 30 }),
      info("quieto", "Quédate quieto 1 minuto.", { segundos: 60 }),
      numero("oximetro", "SpO₂ del oxímetro de dedo", "spo2", "%"),
      numero("reloj", "SpO₂ del reloj ahora", "spo2", "%", { obligatorio: false }),
    ],
    calificar: (r) => {
      const o = num(r.oximetro), w = num(r.reloj);
      const nivel = o < 90 ? "critico" : o < 94 ? "urgente" : o < 95 ? "moderado" : "ok";
      const dif = w != null ? Math.abs(o - w) : null;
      return R(o, nivel, `Oxímetro de dedo: ${o} %${dif != null ? `; el reloj marca ${w} % (${dif} puntos de diferencia)` : ""}.`, { diferencia: dif }, { causas: { spo2: o >= 95 ? { falsa: 5 } : o < 90 ? { falsa: -4 } : {} } });
    },
    critico: (r) => num(r.oximetro) < 90,
  },
  {
    id: "borg", categoria: "corazon", nombre: "Falta de aire (Borg CR10)", icono: "lungs", duracion: "1 min",
    resumen: "Califica tu falta de aire de 0 a 10, en reposo y tras esfuerzo.", paraQue: "5 o más en reposo es urgente.",
    fuente: "borg1982", metricas: ["fr", "spo2"], compara: { nombre: "Borg en reposo", unidad: "" },
    pasos: [
      escala("reposo", "En reposo, ¿cuánta falta de aire tienes?", 0, 10, { 0: "Nada", 5: "Fuerte", 10: "Máxima" }, { campo: "borg" }),
      escala("esfuerzo", "Después de un esfuerzo, ¿cuánta?", 0, 10, { 0: "Nada", 5: "Fuerte", 10: "Máxima" }, { campo: "borg" }),
    ],
    calificar: (r) => {
      const a = num(r.reposo), b = num(r.esfuerzo);
      const nivel = a >= 5 ? "urgente" : a >= 3 || b >= 7 ? "moderado" : "ok";
      return R(a, nivel, `Reposo ${a}/10 · esfuerzo ${b}/10.`, {}, { causas: { fr: a <= 2 && b >= 5 ? { ejercicio: 2 } : a >= 3 ? { broncoespasmo: 1, infeccion: 1 } : {} } });
    },
    critico: () => false,
  },
  {
    id: "llenado_capilar", categoria: "corazon", nombre: "Llenado capilar", icono: "drop", duracion: "1 min", companero: true,
    resumen: "Aprieta la yema del dedo 5 s y cuenta cuánto tarda en volver el color.", paraQue: "Normal en menos de 2 s; lento con presión baja es urgente.",
    fuente: "abcde", metricas: ["pa"], compara: { nombre: "llenado", unidad: "s" }, temporizador: true,
    pasos: [
      info("apretar", "Aprieta la yema del dedo de tu compañero 5 segundos y suelta.", { segundos: 5 }),
      numero("segundos", "¿Cuántos segundos tardó en volver el color?", "segundos", "s", { paso: 0.5 }),
    ],
    calificar: (r, base = {}) => {
      const s = num(r.segundos);
      const baja = num(base.sistolica) != null && base.sistolica <= 100;
      const nivel = s > 3 && baja ? "urgente" : s >= 2 ? "moderado" : "ok";
      return R(s, nivel, s < 2 ? `${f1(s)} s: normal.` : `${f1(s)} s: lento${baja ? " con presión baja" : ""}.`, { presionBaja: baja });
    },
    critico: () => false,
  },
  {
    id: "who5", categoria: "mente", nombre: "Bienestar WHO-5", icono: "smile", duracion: "1 min", legado: "who5",
    resumen: "5 preguntas sobre las últimas 2 semanas.", paraQue: "52 % o menos es bienestar bajo. Tamizaje, no diagnóstico.",
    fuente: "who5", metricas: ["animo"], compara: { nombre: "WHO-5", unidad: "%" },
    pasos: itemsDe("who5", "En las últimas dos semanas…"),
    calificar: (r) => {
      const bruto = sumaItems(r, 5);
      const pct = bruto * 4;
      return R(pct, pct <= 28 ? "urgente" : pct <= 52 ? "moderado" : "ok", pct <= 52 ? `WHO-5 de ${pct} %: bienestar bajo.` : `WHO-5 de ${pct} %: bienestar adecuado.`, { bruto }, { causas: {} });
    },
    critico: () => false,
  },
  {
    id: "phq9", categoria: "mente", nombre: "Tamizaje PHQ-9", icono: "brain", duracion: "3 min", legado: "phq9",
    resumen: "9 preguntas sobre ánimo en las últimas 2 semanas.", paraQue: "10 o más avisa al médico. Tamizaje, no diagnóstico.",
    fuente: "phq9", metricas: ["animo"], compara: { nombre: "PHQ-9", unidad: "" },
    pasos: itemsDe("phq9", "En las últimas dos semanas, ¿qué tan seguido te ha pasado esto?"),
    calificar: (r) => {
      const p = sumaItems(r, 9);
      const item9 = num(r.i9) || 0;
      const sev = p >= 20 ? "severo" : p >= 15 ? "moderadamente severo" : p >= 10 ? "moderado" : p >= 5 ? "leve" : "mínimo";
      const nivel = item9 > 0 ? "critico" : p >= 15 ? "urgente" : p >= 10 ? "moderado" : "ok";
      return R(p, nivel, `PHQ-9 de ${p}: ${sev}.${item9 > 0 ? " Aviso inmediato al oficial médico." : ""}`, { severidad: sev, item9 }, { alcance: item9 > 0 ? "oficial" : null });
    },
    critico: (r) => (num(r.i9) || 0) > 0,
  },
  {
    id: "gad7", categoria: "mente", nombre: "Tamizaje GAD-7", icono: "bolt", duracion: "2 min", legado: "gad7",
    resumen: "7 preguntas sobre ansiedad en las últimas 2 semanas.", paraQue: "10 o más avisa al médico. Tamizaje, no diagnóstico.",
    fuente: "gad7", metricas: ["animo"], compara: { nombre: "GAD-7", unidad: "" },
    pasos: itemsDe("gad7", "En las últimas dos semanas, ¿qué tan seguido te ha pasado esto?"),
    calificar: (r) => {
      const p = sumaItems(r, 7);
      const sev = p >= 15 ? "severa" : p >= 10 ? "moderada" : p >= 5 ? "leve" : "mínima";
      return R(p, p >= 15 ? "urgente" : p >= 10 ? "moderado" : "ok", `GAD-7 de ${p}: ansiedad ${sev}.`, { severidad: sev });
    },
    critico: () => false,
  },
  {
    id: "pvt", categoria: "mente", nombre: "Prueba de reacción (PVT-B)", icono: "target", duracion: "3 min", legado: "reaccion", temporizador: true,
    resumen: "3 min tocando la pantalla en cuanto aparece el estímulo.", paraQue: "Mide tu alerta; lapso = 355 ms o más.",
    fuente: "pvtb", metricas: ["sueno"], compara: { nombre: "mediana del PVT", unidad: "ms" },
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
      return R(med, nivel, `Mediana ${med} ms · ${lapsos} ${lapsos === 1 ? "lapso" : "lapsos"}${base.tareaCritica && lapsos >= 3 ? " antes de una tarea crítica" : ""}.`, { lapsos, falsas: p.falsas, pct });
    },
    critico: () => false,
  },
  {
    id: "amt4", categoria: "mente", nombre: "Orientación rápida (AMT-4)", icono: "user", duracion: "1 min", companero: true,
    resumen: "4 preguntas: edad, fecha de nacimiento, lugar y año.", paraQue: "Un error nuevo es confusión nueva (3 puntos NEWS2).",
    fuente: "amt4,news2", metricas: ["conciencia"], compara: { nombre: "errores", unidad: "" },
    pasos: [
      opciones("edad", "Pregunta: ¿Qué edad tienes?", [["bien", "Contestó bien"], ["error", "Contestó mal"]]),
      opciones("nacimiento", "Pregunta: ¿Cuál es tu fecha de nacimiento?", [["bien", "Contestó bien"], ["error", "Contestó mal"]]),
      opciones("lugar", "Pregunta: ¿Dónde estamos ahora?", [["bien", "Contestó bien"], ["error", "Contestó mal"]]),
      opciones("anio", "Pregunta: ¿En qué año estamos?", [["bien", "Contestó bien"], ["error", "Contestó mal"]]),
    ],
    calificar: (r, base = {}) => {
      const errores = ["edad", "nacimiento", "lugar", "anio"].filter((k) => r[k] === "error").length;
      const nuevo = errores > (num(base.erroresPrevios) || 0);
      return R(errores, nuevo ? "urgente" : "ok", nuevo ? `${errores} ${errores === 1 ? "error" : "errores"}: confusión nueva (3 puntos NEWS2).` : errores ? `${errores} errores, igual que antes.` : "Orientado: sin errores.", { confusion: nuevo });
    },
    critico: (r, base = {}) => {
      const errores = ["edad", "nacimiento", "lugar", "anio"].filter((k) => r[k] === "error").length;
      return errores > (num(base.erroresPrevios) || 0) && (num(base.news2) || 0) + 3 >= 7;
    },
  },
  {
    id: "cincinnati", categoria: "mente", nombre: "Prueba de Cincinnati", icono: "eye", duracion: "1 min", companero: true, temporizador: true,
    resumen: "Cara, brazos y habla. La marca un compañero.", paraQue: "Cualquier anomalía de inicio súbito es crítica.",
    fuente: "cincinnati1999,pronam", metricas: ["conciencia"], compara: { nombre: "anomalías", unidad: "" },
    pasos: [
      info("sonrisa", "Pide a tu compañero que sonría mostrando los dientes."),
      sino("cara", "¿Un lado de la cara se ve caído o no se mueve igual?"),
      info("brazos", "Que levante los dos brazos con los ojos cerrados 10 segundos.", { segundos: 10 }),
      sino("brazo", "¿Un brazo cae o no lo puede levantar?"),
      info("frase", "Que repita: «El cielo es azul sobre la Tierra»."),
      sino("habla", "¿Habla arrastrado, usa palabras equivocadas o no puede hablar?"),
    ],
    calificar: (r) => {
      const a = ["cara", "brazo", "habla"].filter((k) => r[k] === "si");
      return R(a.length, a.length ? "critico" : "ok", a.length ? `Anomalía en ${a.map((x) => ({ cara: "la cara", brazo: "un brazo", habla: "el habla" })[x]).join(", ")}: emergencia.` : "Sin anomalías.", { anomalias: a });
    },
    critico: (r) => ["cara", "brazo", "habla"].some((k) => r[k] === "si"),
  },
  {
    id: "kss", categoria: "mente", nombre: "Somnolencia de Karolinska", icono: "moon", duracion: "10 s",
    resumen: "¿Qué tan despierto estás ahora? De 1 a 9.", paraQue: "7 o más antes de una tarea crítica avisa a quien planea la misión.",
    fuente: "kss1990", metricas: ["sueno"], compara: { nombre: "KSS", unidad: "" },
    pasos: [escala("kss", "¿Qué tan despierto estás ahora?", 1, 9, { 1: "Muy despierto", 5: "Ni alerta ni con sueño", 9: "Lucho por no dormirme" }, { campo: "kss" })],
    calificar: (r, base = {}) => {
      const k = num(r.kss);
      if (k >= 7) return R(k, "info", base.tareaCritica ? `KSS ${k} antes de una tarea crítica: avisa a quien planea la misión.` : `KSS ${k}: somnolencia alta.`, { avisoPlaneacion: !!base.tareaCritica });
      return R(k, "ok", `KSS ${k}: alerta suficiente.`);
    },
    critico: () => false,
  },
  {
    id: "diario_sueno", categoria: "mente", nombre: "Diario de sueño", icono: "bed", duracion: "1 min",
    resumen: "Horas, despertares, calidad y ambiente de tu noche.", paraQue: "Calcula horas y eficiencia; separa ambiente de insomnio.",
    fuente: "diario2012,dsm5", metricas: ["sueno"], compara: { nombre: "horas dormidas", unidad: "h" },
    pasos: [
      { id: "acostarse", tipo: "hora", texto: "¿A qué hora te acostaste?" },
      { id: "levantarse", tipo: "hora", texto: "¿A qué hora te levantaste?" },
      numero("latencia", "¿Cuántos minutos tardaste en dormirte?", "minutos", "min"),
      numero("despertares", "¿Cuántas veces despertaste?", "minutos", "veces"),
      numero("despierto", "¿Cuántos minutos estuviste despierto en la noche?", "minutos", "min"),
      escala("calidad", "¿Cómo dormiste?", 1, 5, { 1: "Muy mal", 3: "Regular", 5: "Muy bien" }, { campo: "calidad" }),
      { id: "ambiente", tipo: "multi", texto: "¿Hubo algo de esto en tu zona?", opciones: [["ruido", "Ruido"], ["luz", "Luz"], ["calor", "Calor"]] },
      sino("somnifero", "¿Tomaste somnífero?"),
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
      return R(horas, nivel, `Dormiste ${horas ?? "—"} h con eficiencia de ${ef ?? "—"} %${amb.length ? `; hubo ${amb.join(", ")}` : ""}.`, { eficiencia: ef, ambiente: amb, somnifero: r.somnifero === "si" }, { causas });
    },
    critico: () => false,
  },
  {
    id: "msaq", categoria: "mente", nombre: "Escala de mareo espacial (MSAQ)", icono: "sparkle", duracion: "1 min",
    resumen: "Estómago, cabeza y sueño, del 1 al 9.", paraQue: "Separa mareo espacial de náusea por radiación.",
    fuente: "msaq2001", metricas: ["conciencia", "radiacion"], compara: { nombre: "MSAQ", unidad: "%" },
    pasos: [
      escala("nausea", "Náusea", 1, 9, { 1: "Nada", 9: "Muchísimo" }, { campo: "msaq", grupo: "estomago" }),
      escala("vomitar", "Ganas de vomitar", 1, 9, { 1: "Nada", 9: "Muchísimo" }, { campo: "msaq", grupo: "estomago" }),
      escala("mareo", "Mareo", 1, 9, { 1: "Nada", 9: "Muchísimo" }, { campo: "msaq", grupo: "cabeza" }),
      escala("giro", "Sensación de giro o cabeza pesada", 1, 9, { 1: "Nada", 9: "Muchísimo" }, { campo: "msaq", grupo: "cabeza" }),
      escala("somnolencia", "Somnolencia", 1, 9, { 1: "Nada", 9: "Muchísimo" }, { campo: "msaq", grupo: "sueno" }),
      escala("cansancio", "Cansancio", 1, 9, { 1: "Nada", 9: "Muchísimo" }, { campo: "msaq", grupo: "sueno" }),
    ],
    calificar: (r) => {
      const v = (k) => num(r[k]) || 1;
      const est = (v("nausea") + v("vomitar")) / 2, cab = (v("mareo") + v("giro")) / 2, sue = (v("somnolencia") + v("cansancio")) / 2;
      const pct = Math.round(((v("nausea") + v("vomitar") + v("mareo") + v("giro") + v("somnolencia") + v("cansancio") - 6) / 48) * 100);
      const causas = {};
      if (cab >= 5 && cab >= est) { causas.conciencia = { mareo: 3 }; causas.radiacion = { mareo: 3 }; }
      else if (est >= 5) causas.radiacion = { radiacion: 2, estomago: 1 };
      return R(pct, pct >= 60 ? "urgente" : pct >= 40 ? "moderado" : "ok", `MSAQ ${pct} %: estómago ${f1(est)}, cabeza ${f1(cab)}, sueño ${f1(sue)}.`, { estomago: est, cabeza: cab, sueno: sue }, { causas });
    },
    critico: () => false,
  },
  {
    id: "temperatura", categoria: "mente", nombre: "Temperatura bien tomada", icono: "thermo", duracion: "1 min",
    resumen: "15 min sin ejercicio ni comida, siempre en el mismo sitio.", paraQue: "Compara con tu base en vuelo, que sube cerca de 1 °C.",
    fuente: "stahn2017,news2", metricas: ["temp"], compara: { nombre: "temperatura", unidad: "°C" },
    pasos: [
      sino("espera", "¿Llevas 15 minutos sin ejercicio ni comida?"),
      info("esperar", "Espera 15 minutos sin ejercicio ni comida.", { segundos: 900, si: (r) => r.espera === "no" }),
      opciones("sitio", "¿Dónde mides?", [["oral", "Boca"], ["oido", "Oído"], ["frente", "Frente"], ["axila", "Axila"]]),
      numero("temperatura", "Temperatura", "temperatura", "°C", { paso: 0.1 }),
    ],
    calificar: (r, base = {}) => {
      const t = num(r.temperatura);
      const hi = base.rangoTemp?.[1];
      let nivel = t >= 39.1 ? "urgente" : t >= 38.1 ? "moderado" : t <= 35 ? "critico" : t <= 36 ? "moderado" : "ok";
      if (nivel === "ok" && hi != null && t >= hi + 1) nivel = "moderado";
      return R(t, nivel, `${f1(t)} °C${hi != null ? ` · tu base llega a ${f1(hi)} °C` : ""}.`, { sitio: r.sitio });
    },
    critico: (r, base = {}) => { const t = num(r.temperatura); return t != null && (t <= 35 || (t >= 39.1 && (base.confusion || num(base.sistolica) <= 90))); },
    aVivo: (r) => ({ temperatura: num(r.temperatura) }),
  },
  {
    id: "dolor", categoria: "mente", nombre: "Escala de dolor", icono: "alert", duracion: "30 s",
    resumen: "Marca dónde duele y califica de 0 a 10.", paraQue: "Para huesos, cabeza y pecho. El dolor de pecho abre las señales de peligro.",
    fuente: "nrs", metricas: ["huesos", "vision"], compara: { nombre: "dolor", unidad: "/10" },
    pasos: [{ id: "zonas", tipo: "especial", componente: "mapaDolor" }, escala("intensidad", "¿Qué tan fuerte es el dolor?", 0, 10, { 0: "Nada", 5: "Moderado", 10: "El peor" }, { campo: "dolor" })],
    calificar: (r) => {
      const z = Array.isArray(r.zonas) ? r.zonas : [];
      const i = num(r.intensidad);
      const pecho = z.includes("pecho");
      const nivel = pecho || i >= 7 ? "urgente" : i >= 4 ? "moderado" : "ok";
      const causas = { huesos: { ...(z.includes("espalda") ? { espalda: 2 } : {}), ...(z.includes("costado") ? { rinon: 2 } : {}) } };
      return R(i, nivel, `${z.length ? z.join(", ") : "Sin zona"} · ${i}/10.${pecho ? " Dolor de pecho: revisa las señales de peligro." : ""}`, { zonas: z, peligro: pecho }, { causas });
    },
    critico: () => false,
  },
  {
    id: "amsler", categoria: "espacio", nombre: "Rejilla de Amsler", icono: "eye", duracion: "2 min", legado: "amsler",
    resumen: "Un ojo a la vez; toca las zonas onduladas o faltantes.", paraQue: "Líneas torcidas o manchas son urgentes.",
    fuente: "amsler,nasa_sans", metricas: ["vision"], compara: { nombre: "zonas marcadas", unidad: "" },
    pasos: [{ id: "amsler", tipo: "especial", componente: "amsler" }],
    calificar: (r) => {
      const a = r.amsler || {};
      const n = (a.od?.length || 0) + (a.oi?.length || 0);
      return R(n, n ? "urgente" : "ok", n ? `${n} ${n === 1 ? "zona marcada" : "zonas marcadas"}${a.od?.length ? " en el ojo derecho" : ""}${a.oi?.length ? " en el ojo izquierdo" : ""}.` : "Sin distorsión en ninguno de los dos ojos.", { od: a.od || [], oi: a.oi || [] }, { causas: n ? { vision: { sans: 3 } } : {} });
    },
    critico: () => false,
  },
  {
    id: "agudeza", categoria: "espacio", nombre: "Agudeza visual", icono: "eye", duracion: "3 min",
    resumen: "Letras que se hacen más chicas, de lejos y de cerca, un ojo a la vez.", paraQue: "2 líneas o más peor que tu base es urgente.",
    fuente: "nasa_sans", metricas: ["vision"], compara: { nombre: "líneas leídas", unidad: "" },
    pasos: [{ id: "agudeza", tipo: "especial", componente: "agudeza" }],
    calificar: (r, base = {}) => {
      const a = r.agudeza || {};
      const ant = base.anterior?.agudeza || base.anterior || null;
      const ojos = ["od", "oi", "cerca"];
      const perdida = ant ? Math.max(0, ...ojos.map((k) => (num(ant[k]) ?? 0) - (num(a[k]) ?? 0))) : 0;
      const nivel = perdida >= 2 ? "urgente" : perdida === 1 ? "moderado" : "ok";
      return R(Math.min(num(a.od) ?? 0, num(a.oi) ?? 0), nivel, `Derecho ${a.od ?? "—"} · izquierdo ${a.oi ?? "—"} · cerca ${a.cerca ?? "—"} líneas${perdida ? `; ${perdida} ${perdida === 1 ? "línea" : "líneas"} peor que tu base` : ""}.`, { perdida }, { causas: perdida >= 2 ? { vision: { sans: 3 } } : {} });
    },
    critico: () => false,
  },
  {
    id: "lentes", categoria: "espacio", nombre: "Lentes de anticipación", icono: "eye", duracion: "2 min",
    resumen: "Lee la tarjeta con cada graduación y elige la que aclara.", paraQue: "Si sube la graduación, reporta posible SANS.",
    fuente: "nasa_sans", metricas: ["vision"], compara: { nombre: "graduación", unidad: "" },
    pasos: [opciones("graduacion", "¿Con cuál graduación lees mejor la tarjeta de cerca?", GRADUACIONES)],
    calificar: (r, base = {}) => {
      const g = Number(r.graduacion || 0);
      const ant = base.anterior ? Number(base.anterior.graduacion || 0) : null;
      const sube = ant != null && g > ant;
      return R(g, sube ? "moderado" : "ok", sube ? `Subió de ${ant ? `+${ant.toFixed(2)}` : "0"} a +${g.toFixed(2)}: reporta posible SANS.` : `Lees mejor con ${g ? `+${g.toFixed(2)}` : "sin aumento"}.`, { sube }, { causas: sube ? { vision: { sans: 3 } } : {} });
    },
    critico: () => false,
  },
  {
    id: "tormenta_sintomas", categoria: "espacio", nombre: "Síntomas tras tormenta solar", icono: "rad", duracion: "1 min",
    resumen: "Náusea, vómito, cansancio y piel; cada 6 h por 2 días.", paraQue: "Separa síntomas de radiación y anota tu dosis.",
    fuente: "ochmo_tb020", metricas: ["radiacion"], compara: { nombre: "cansancio", unidad: "/10" },
    pasos: [
      sino("nausea", "¿Tienes náusea?"),
      sino("vomito", "¿Vomitaste?"),
      { id: "hora_vomito", tipo: "hora", texto: "¿A qué hora fue el primer vómito?", si: (r) => r.vomito === "si" },
      escala("cansancio", "¿Qué tan cansado estás?", 0, 10, { 0: "Nada", 10: "Agotado" }, { campo: "dolor" }),
      sino("piel", "¿Tienes la piel roja o con ardor en una zona expuesta?"),
      numero("dosis", "Lectura del dosímetro", "msv", "mSv", { obligatorio: false, paso: 0.1 }),
    ],
    calificar: (r) => {
      const nivel = r.vomito === "si" ? "urgente" : r.nausea === "si" || r.piel === "si" || num(r.cansancio) >= 6 ? "moderado" : "ok";
      const causas = { radiacion: { ...(r.vomito === "si" || r.nausea === "si" ? { radiacion: 2 } : {}), ...(r.piel === "si" ? { radiacion: 3 } : {}) } };
      return R(num(r.cansancio), nivel, [r.nausea === "si" && "náusea", r.vomito === "si" && `vómito${r.hora_vomito ? ` a las ${r.hora_vomito}` : ""}`, r.piel === "si" && "piel roja"].filter(Boolean).join(", ") || "Sin síntomas.", { dosis: num(r.dosis) }, { causas });
    },
    critico: () => false,
  },
  {
    id: "orina", categoria: "espacio", nombre: "Color de orina", icono: "drop", duracion: "10 s",
    resumen: "Compara el color con la escala de 8 tonos.", paraQue: "Del 6 al 8 indica poca agua (riesgo de piedras y presión baja).",
    fuente: "armstrong1994", metricas: ["huesos", "pa"], compara: { nombre: "color", unidad: "" },
    pasos: [escala("color", "¿Qué tono se parece más al de tu orina?", 1, 8, { 1: "Muy clara", 8: "Muy oscura" }, { campo: "orina", colores: COLORES_ORINA })],
    calificar: (r) => {
      const c = num(r.color);
      const poca = c >= 6;
      return R(c, poca ? "moderado" : "ok", poca ? `Tono ${c}: poca agua. Toma más.` : `Tono ${c}: hidratación adecuada.`, { pocaAgua: poca }, { causas: poca ? { huesos: { deshidratacion: 3, rinon: 1 }, pa: { deshidratacion: 3 }, fc: { deshidratacion: 2 } } : {} });
    },
    critico: () => false,
  },
  {
    id: "ejercicio_registro", categoria: "espacio", nombre: "Registro de ejercicio", icono: "dumbbell", duracion: "30 s",
    resumen: "Minutos de cinta, bici y resistencia de hoy.", paraQue: "Compara con tu meta diaria para cuidar hueso y músculo.",
    fuente: "ochmo_tb030,nasa_osea", metricas: ["huesos"], compara: { nombre: "% de la meta", unidad: "%" },
    pasos: [numero("cinta", "Cinta (min)", "minutos", "min"), numero("bici", "Bici (min)", "minutos", "min"), numero("resistencia", "Resistencia (min)", "minutos", "min")],
    calificar: (r, base = {}) => {
      const total = (num(r.cinta) || 0) + (num(r.bici) || 0) + (num(r.resistencia) || 0);
      const meta = num(base.ejercicioMeta) || 120;
      const pct = Math.round((total / meta) * 100);
      return R(pct, pct < 80 ? "moderado" : "ok", `${total} de ${meta} min (${pct} %).`, { total, meta }, { causas: pct < 80 ? { huesos: { condicion: 2 } } : {} });
    },
    critico: () => false,
    aVivo: (r, base = {}) => ({ ejercicio_pct: Math.round((((num(r.cinta) || 0) + (num(r.bici) || 0) + (num(r.resistencia) || 0)) / (num(base.ejercicioMeta) || 120)) * 100) }),
  },
  {
    id: "agarre", categoria: "espacio", nombre: "Fuerza de agarre", icono: "dumbbell", duracion: "2 min",
    resumen: "Dinamómetro, 3 intentos por mano; cuenta el mejor.", paraQue: "Una caída de más del 10 % avisa pérdida de condición.",
    fuente: "nasa_osea", metricas: ["huesos"], compara: { nombre: "mejor agarre", unidad: "kg" },
    pasos: [
      lectura("derecha", "Mano derecha: 3 intentos", [1, 2, 3].map((i) => ({ id: `i${i}`, etiqueta: `Intento ${i}`, unidad: "kg", rango: "kg" }))),
      lectura("izquierda", "Mano izquierda: 3 intentos", [1, 2, 3].map((i) => ({ id: `i${i}`, etiqueta: `Intento ${i}`, unidad: "kg", rango: "kg" }))),
    ],
    calificar: (r, base = {}) => {
      const mejor = (m) => Math.max(0, ...Object.values(m || {}).map(num).filter((x) => x != null));
      const v = Math.max(mejor(r.derecha), mejor(r.izquierda));
      const b = num(base.mediana);
      const cambio = b ? Math.round(((v - b) / b) * 100) : null;
      return R(v, cambio != null && cambio < -10 ? "info" : "ok", `Mejor agarre ${v} kg${cambio != null ? ` (${cambio > 0 ? "+" : ""}${cambio} % contra tu base)` : ""}.${cambio != null && cambio < -10 ? " Pérdida de condición." : ""}`, { cambio, derecha: mejor(r.derecha), izquierda: mejor(r.izquierda) }, { causas: cambio != null && cambio < -10 ? { huesos: { condicion: 2 } } : {} });
    },
    critico: () => false,
  },
  {
    id: "cabina_tripulacion", categoria: "espacio", nombre: "Revisión de cabina", icono: "cabina", duracion: "2 min",
    resumen: "3 preguntas a cada tripulante junto con CO₂, temperatura y humedad.", paraQue: "Si 2 o más tienen dolor de cabeza, revisa el aire.",
    fuente: "ochmo_co2,ochmo_tb002", metricas: ["cabina"], compara: { nombre: "con dolor de cabeza", unidad: "" },
    pasos: [{ id: "tripulacion", tipo: "especial", componente: "cabinaTripulacion" }],
    calificar: (r) => {
      const t = r.tripulacion || {};
      const con = Object.entries(t).filter(([, x]) => x?.dolor).map(([id]) => Number(id));
      const cans = Object.values(t).filter((x) => x?.cansancio).length;
      return R(con.length, con.length >= 2 ? "urgente" : con.length || cans >= 2 ? "moderado" : "ok", con.length >= 2 ? `${con.length} tripulantes con dolor de cabeza: revisa el aire de la cabina.` : `${con.length} con dolor de cabeza · ${cans} con cansancio.`, { conDolor: con });
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
  if (!base.valores?.length) return "Primera vez: esta será tu base.";
  const u = c.unidad ? ` ${c.unidad}` : "";
  const m = base.mediana;
  const pct = m ? Math.round(((valor - m) / m) * 100) : null;
  const ult = num(base.ultimo?.valor?.resultado?.valor);
  const hace = base.ultimo ? Math.max(0, Math.round((Date.now() - Date.parse(base.ultimo.hecho_en)) / DIA)) : null;
  return `Tu ${c.nombre} habitual es ${f1(m)}${u}; hoy ${valor == null ? "—" : f1(valor)}${u}${pct != null && Number.isFinite(pct) && pct !== 0 ? ` (${pct > 0 ? "+" : ""}${pct} %)` : ""}.${ult != null ? ` La última vez (${hace === 0 ? "hoy" : hace === 1 ? "ayer" : `hace ${hace} días`}): ${f1(ult)}${u}.` : ""}`;
}

const HORA = 36e5;
const inicioDia = (t) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
const enDias = (ms) => {
  const n = Math.max(1, Math.ceil(ms / DIA - 1e-9));
  return n === 1 ? "en 1 día" : `en ${n} días`;
};
const enHoras = (ms) => {
  const n = Math.max(1, Math.ceil(ms / HORA - 1e-9));
  return n === 1 ? "en 1 h" : `en ${n} h`;
};
const NOMBRE_FICHA = { pa: { baja: "Presión baja", alta: "Presión alta" } };

export function diasFijos(intervalo, diaRegreso = 180) {
  return (intervalo?.dias || []).map((d) => (d === "regreso-30" ? diaRegreso - 30 : d)).filter((d) => Number.isFinite(d)).sort((a, b) => a - b);
}

export function razonContexto(prueba, ctx = {}) {
  const fichas = ctx.fichas || [];
  const conPeligro = fichas.find((f) => f.peligro && (PRUEBAS_RECOMENDADAS[f.clave] || []).includes(prueba.id));
  if (conPeligro) return `hay una señal de peligro en tu ficha de ${TITULOS[conPeligro.clave]}`;
  for (const r of prueba.repetirSi || []) {
    if (r.ficha) {
      const f = fichas.find((x) => x.clave === r.ficha && (!r.rama || x.rama === r.rama) && (!r.niveles || r.niveles.includes(x.nivel)));
      if (!f) continue;
      const nombre = NOMBRE_FICHA[f.clave]?.[f.rama] || TITULOS[f.clave];
      return r.niveles ? `tu ficha de ${nombre} está en ${ETIQUETA_NIVEL[f.nivel].toLowerCase()}` : `tu ficha de ${nombre} está abierta`;
    }
    if (r.tareaCritica && ctx.tareaCritica) return "hay una tarea crítica en las próximas 2 h";
    if (r.dolorCabezaCo2 && ctx.dolorCabezaCo2) return "hubo dolor de cabeza con CO₂ alto";
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
    return { bloqueo: { espera, texto: `Disponible ${enDias(espera)} · se hace ${iv.valor === 7 ? "cada semana" : `cada ${iv.valor} días`}` } };
  }
  if (iv.tipo === "horas" && t != null && ahora - t < iv.valor * HORA) {
    const espera = t + iv.valor * HORA - ahora;
    return { bloqueo: { espera, texto: `Disponible ${enHoras(espera)} · se hace cada ${iv.valor} h` } };
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
    if (sig == null) return { bloqueo: { espera: Infinity, texto: "Ya hiciste las revisiones de esta misión · se hace en días fijos de misión" } };
    return { bloqueo: { espera: (sig - dia) * DIA, texto: `Disponible ${enDias((sig - dia) * DIA)} · se hace en días fijos de misión (día ${sig})` } };
  }
  if (iv.tipo === "gravedad") {
    if (!["luna", "marte", "regreso"].includes(ctx.fase)) return { bloqueo: { espera: Infinity, texto: "En órbita solo con la ficha de Presión baja abierta" } };
    if (t != null && t >= inicioDia(ahora)) return { bloqueo: { espera: inicioDia(ahora) + DIA - ahora, texto: "Disponible mañana · se hace una vez al día en gravedad" } };
    return { bloqueo: null };
  }
  if (iv.tipo === "tormenta") {
    const fin = (ctx.eventosRadiacion || []).map((e) => (e.fin ? Date.parse(e.fin) : ahora)).filter((x) => x <= ahora + 1 && ahora - x <= iv.ventanaHoras * HORA).sort((a, b) => b - a)[0];
    const activa = (ctx.eventosRadiacion || []).some((e) => !e.fin);
    if (fin == null && !activa) return { bloqueo: { espera: Infinity, texto: "Solo en los 2 días después de una tormenta solar" } };
    if (t != null && ahora - t < iv.horas * HORA) {
      const espera = t + iv.horas * HORA - ahora;
      return { bloqueo: { espera, texto: `Disponible ${enHoras(espera)} · se hace cada ${iv.horas} h tras la tormenta` } };
    }
    return { bloqueo: null };
  }
  return { bloqueo: null };
}

export function disponibilidad(prueba, ctx = {}) {
  const base = { permitido: true, motivo: null, texto: null, editar: null, espera: 0 };
  if (!prueba) return { ...base, permitido: false, texto: "Prueba desconocida" };
  if (prueba.nuncaBloquear || (prueba.intervalo?.tipo || "libre") === "libre") return base;
  const { bloqueo, editar } = bloqueoDe(prueba, ctx);
  if (!bloqueo) return { ...base, editar: editar || null, texto: editar ? "Ya la hiciste hoy · puedes editarla" : null };
  if (ctx.ignorarIntervalo && ctx.origen === "control") return { ...base, motivo: "Intervalo ignorado (presentación)", texto: bloqueo.texto };
  const razon = razonContexto(prueba, ctx);
  if (razon) return { ...base, motivo: `Puedes hacerla ahora: ${razon}`, texto: bloqueo.texto };
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
  animo: "Ánimo (1 a 5)", estres: "Estrés (1 a 5)", fatiga: "Fatiga (1 a 5)", tripulacion: "Relación con la tripulación (1 a 5)",
  confusion: "¿Te sientes confundido o desorientado?", mareo_de_pie: "¿Tienes mareo?", vision_borrosa: "¿Visión borrosa?", dolor_cabeza: "¿Dolor de cabeza?",
  sintomas: "Síntomas de infección", tiempo_reaccion_ms: "Reacción rápida (ms)",
};
const ESPECIALES = { remedicion: ["remedicion", "Lecturas antes y después del reposo"], pvt: ["pvt", "Tiempos de reacción"], amsler: ["amsler", "Zonas marcadas en la rejilla"], agudeza: ["agudeza", "Líneas leídas por ojo"], mapaDolor: ["zonas", "¿Dónde te duele?"], cabinaTripulacion: ["tripulacion", "Síntomas de cada tripulante"] };

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
    if (r[paso.id] == null || r[paso.id] === "") return paso.obligatorio ? "Falta este dato." : null;
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
  if (paso.tipo === "escala") return validarCampo(paso.campo || "dolor", r[paso.id]) ? "Elige una opción." : null;
  if (["opciones", "sino", "hora"].includes(paso.tipo)) return r[paso.id] == null || r[paso.id] === "" ? "Elige una opción." : null;
  if (paso.tipo === "especial" && paso.componente === "agudeza") return r.agudeza?.od == null || r.agudeza?.oi == null || r.agudeza?.cerca == null ? "Marca los tres: ojo derecho, izquierdo y cerca." : null;
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
  checkin: "Check-in", remedicion: "Remedición", ortostatica: "Ortostática", presion_pronam: "Presión", recuperacion_fc: "Recuperación FC", spo2_confirmacion: "SpO₂ dedo",
  borg: "Borg", llenado_capilar: "Llenado capilar", who5: "WHO-5", phq9: "PHQ-9", gad7: "GAD-7", pvt: "PVT-B", amt4: "AMT-4", cincinnati: "Cincinnati", kss: "KSS",
  diario_sueno: "Diario de sueño", msaq: "MSAQ", temperatura: "Temperatura", dolor: "Dolor", amsler: "Amsler", agudeza: "Agudeza", lentes: "Lentes",
  tormenta_sintomas: "Tormenta", orina: "Orina", ejercicio_registro: "Ejercicio", agarre: "Agarre", cabina_tripulacion: "Cabina",
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
  if (!fila) return { valor: "Nunca", unidad: "" };
  const v = num(fila.valor?.resultado?.valor);
  if (prueba.id === "amsler") return { valor: v ? `${v} ${v === 1 ? "zona" : "zonas"}` : "sin cambios", unidad: "" };
  if (prueba.id === "cincinnati") return { valor: v ? "anomalía" : "sin anomalías", unidad: "" };
  if (prueba.id === "checkin") return { valor: v ? `${v} ${v === 1 ? "síntoma" : "síntomas"}` : "sin síntomas", unidad: "" };
  if (prueba.id === "lentes") return { valor: v ? `+${v.toFixed(2)}` : "sin aumento", unidad: "" };
  if (v == null) return { valor: "—", unidad: "" };
  return { valor: f1(v), unidad: prueba.compara?.unidad || "" };
}

export function cuandoToca(disp) {
  if (!disp || disp.permitido) return null;
  const m = /Disponible (en \d+ (?:días|día|h)|mañana)/.exec(disp.texto || "");
  return m ? m[1] : "no toca";
}

