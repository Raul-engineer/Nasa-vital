import { baseDe, calificarPrueba } from "./pruebas.js";

export const DIAS = 90;

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (n, d = 0) => Math.round(n * 10 ** d) / 10 ** d;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export function isoDate(daysAgo) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

export function isoDateTime(daysAgo, h, m = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export const ASTRONAUTS = [
  { id: 1, nombre: "Cmdr. A. Reyes", rol: "Comandante", dia_mision: 142 },
  { id: 2, nombre: "Dra. L. Garza", rol: "Médica de tripulación", dia_mision: 142 },
  { id: 3, nombre: "Ing. M. Torres", rol: "Ingeniero de vuelo", dia_mision: 142 },
];

export const EVENTOS = {
  malSuenoDesde: DIAS - 8,
  tormentaDesde: DIAS - 20,
  tormentaHasta: DIAS - 18,
  sinEjercicioDesde: DIAS - 25,
};

export const FACTOR_DOSIS = { 1: 1.0, 2: 0.9, 3: 1.15 };
const PESO_BASE = { 1: 64, 2: 58, 3: 82 };

export const PROFILES = [
  {
    astronaut_id: 1, edad: 46, sexo: "Femenino", peso_kg: 64, estatura_cm: 168, tipo_sangre: "O+",
    alergias: [{ sustancia: "Látex", reaccion: "Dermatitis de contacto", riesgo: "moderado" }],
    medicamentos: ["Lágrimas artificiales según necesidad"],
    condiciones_cronicas: ["Miopía leve"],
    fc_basal: 62, pa_basal: "112/72", spo2_basal: 98,
    dosis_carrera_previa_msv: 180, misiones_previas: 2, dias_espacio_previos: 365, usa_lentes: true, ejercicio_prescrito_min: 120,
    contacto_emergencia: { nombre: "J. Reyes", relacion: "Esposo", telefono: "+52 81 5555 0101" },
  },
  {
    astronaut_id: 2, edad: 39, sexo: "Femenino", peso_kg: 58, estatura_cm: 162, tipo_sangre: "A+",
    alergias: [{ sustancia: "Ibuprofeno (AINE)", reaccion: "Urticaria", riesgo: "moderado" }],
    medicamentos: [],
    condiciones_cronicas: [],
    fc_basal: 60, pa_basal: "108/70", spo2_basal: 99,
    dosis_carrera_previa_msv: 60, misiones_previas: 1, dias_espacio_previos: 120, usa_lentes: false, ejercicio_prescrito_min: 120,
    contacto_emergencia: { nombre: "R. Garza", relacion: "Hermana", telefono: "+52 81 5555 0102" },
  },
  {
    astronaut_id: 3, edad: 42, sexo: "Masculino", peso_kg: 82, estatura_cm: 178, tipo_sangre: "B+",
    alergias: [
      { sustancia: "Penicilina", reaccion: "Anafilaxia", riesgo: "alto" },
      { sustancia: "Mariscos", reaccion: "Urticaria leve", riesgo: "bajo" },
    ],
    medicamentos: ["Vitamina D 1000 UI al día"],
    condiciones_cronicas: ["Hipercolesterolemia leve controlada con dieta"],
    fc_basal: 64, pa_basal: "118/76", spo2_basal: 98,
    dosis_carrera_previa_msv: 0, misiones_previas: 0, dias_espacio_previos: 0, usa_lentes: false, ejercicio_prescrito_min: 120,
    contacto_emergencia: { nombre: "P. Torres", relacion: "Madre", telefono: "+52 81 5555 0103" },
  },
];

export const HISTORIAS = [
  {
    astronaut_id: 1,
    heredofamiliares: { diabetes: "Padre (tipo 2)", hipertension: "Madre", cardiopatia: "Ninguno", cancer: "Ninguno", otros: "" },
    personales_patologicos: {
      asma: "Negado", alergias: "Látex (dermatitis de contacto)", cirugias: "Apendicectomía a los 19 años", fracturas: "Radio distal izquierdo (2009)",
      cronicas: "Miopía leve", hospitalizaciones: "Solo por la apendicectomía", tabaco: "Nunca", alcohol: "Ocasional, suspendido en misión",
    },
    no_patologicos: {
      actividad_fisica: "Carrera y fuerza 6 días por semana antes del vuelo", alimentacion: "Menú de misión balanceado",
      sueno: "7 h habituales; insomnio ocasional en misión", vacunas: "Esquema completo, influenza y COVID-19 al día",
    },
    padecimiento_actual: "Dificultad para dormir desde hace 8 noches por carga de trabajo; refiere cansancio por las tardes.",
    interrogatorio_sistemas: {
      respiratorio: "Sin síntomas", cardiovascular: "Sin palpitaciones ni dolor torácico", digestivo: "Sin síntomas",
      neurologico: "Cefalea leve ocasional por las tardes", vision: "Sin cambios desde el inicio de la misión",
      musculo_esqueletico: "Sin dolor", piel: "Sin lesiones", animo: "Irritable por el cansancio",
    },
    espacial: { mareo_espacial_previo: "Sí, leve los primeros 2 días de sus misiones anteriores", sans_previo: "No" },
  },
  {
    astronaut_id: 2,
    heredofamiliares: { diabetes: "Ninguno", hipertension: "Padre", cardiopatia: "Abuelo paterno (infarto a los 70)", cancer: "Ninguno", otros: "" },
    personales_patologicos: {
      asma: "Negado", alergias: "Ibuprofeno (urticaria)", cirugias: "Ninguna", fracturas: "Ninguna",
      cronicas: "Ninguna", hospitalizaciones: "Ninguna", tabaco: "Nunca", alcohol: "Nunca",
    },
    no_patologicos: {
      actividad_fisica: "Natación y fuerza 5 días por semana", alimentacion: "Menú de misión balanceado",
      sueno: "7.5 h habituales", vacunas: "Esquema completo, influenza y COVID-19 al día",
    },
    padecimiento_actual: "Asintomática.",
    interrogatorio_sistemas: {
      respiratorio: "Sin síntomas", cardiovascular: "Sin síntomas", digestivo: "Sin síntomas", neurologico: "Sin síntomas",
      vision: "Sin cambios", musculo_esqueletico: "Sin dolor", piel: "Sin lesiones", animo: "Estable",
    },
    espacial: { mareo_espacial_previo: "Sí, leve los primeros 3 días de su misión anterior", sans_previo: "No" },
  },
  {
    astronaut_id: 3,
    heredofamiliares: { diabetes: "Madre (tipo 2)", hipertension: "Ambos padres", cardiopatia: "Ninguno", cancer: "Abuela materna (mama)", otros: "Osteoporosis en la abuela materna" },
    personales_patologicos: {
      asma: "Asma leve en la infancia, sin crisis desde los 12 años", alergias: "Penicilina (anafilaxia), mariscos (urticaria leve)",
      cirugias: "Artroscopia de rodilla derecha (2016)", fracturas: "Clavícula derecha (2011)",
      cronicas: "Hipercolesterolemia leve controlada con dieta", hospitalizaciones: "Por la reacción a penicilina (2004)",
      tabaco: "Exfumador, dejó hace 15 años", alcohol: "Ocasional, suspendido en misión",
    },
    no_patologicos: {
      actividad_fisica: "Fuerza y ciclismo 6 días por semana antes del vuelo", alimentacion: "Menú de misión, evita mariscos",
      sueno: "7 h habituales", vacunas: "Esquema completo, influenza y COVID-19 al día",
    },
    padecimiento_actual: "Sin acceso completo al equipo de resistencia desde hace 25 días por falla; refiere molestia lumbar leve.",
    interrogatorio_sistemas: {
      respiratorio: "Sin síntomas", cardiovascular: "Sin síntomas", digestivo: "Sin síntomas", neurologico: "Sin síntomas",
      vision: "Sin cambios", musculo_esqueletico: "Molestia lumbar leve, sin irradiación", piel: "Sin lesiones", animo: "Frustrado por la falla del equipo",
    },
    espacial: { mareo_espacial_previo: "No aplica (primera misión)", sans_previo: "No aplica (primera misión)" },
  },
];

const P = (o) => ({ ...o, acciones: [...o.ahora, ...o.hoy].slice(0, 3) });

export const PASOS_REFUGIO = [
  "Suspender caminatas espaciales y tareas fuera de zonas protegidas",
  "Ir al área más blindada de la nave",
  "Rodearse de agua y suministros como blindaje",
  "Mantener el dosímetro puesto",
  "Esperar el aviso de fin de evento",
];

export const PROTOCOLS = [
  P({ id: 1, clave: "vfc_sueno", sistema: "sueno", nivel: "atencion", prueba_sugerida: "reaccion", fuente: "aasm,pvtb,Tu línea base personal",
    condicion: "VFC bajo tu línea base 3+ días y sueño corto 3+ noches",
    ahora: ["Pausa de 10 min con respiración lenta (6 respiraciones por minuto)"],
    hoy: ["Adelantar 1 h la hora de dormir", "Bajar el ejercicio a intensidad moderada por 48 h", "Pedir reprogramar tareas críticas de mañana"],
    prevenir: ["Sin pantallas 45 min antes de dormir y luz cálida en el módulo", "Horario fijo de sueño de 22:00 a 06:00 (7 h o más)"],
    escalar: ["Si la prueba de reacción sigue peor que tu línea base o hay errores en tareas críticas", "Si la falta de sueño sigue 3 noches más"] }),
  P({ id: 2, clave: "vfc", sistema: "cardiovascular", nivel: "atencion", prueba_sugerida: "remedicion", fuente: "Tu línea base personal",
    condicion: "VFC 20 % bajo tu línea base 3 días seguidos",
    ahora: ["Siéntate y respira lento 5 min"],
    hoy: ["Bajar la intensidad del ejercicio a moderada por 48 h", "Hidratación: mínimo 2.5 L"],
    prevenir: ["Repetir la medición mañana en ayunas", "Mantener horario fijo de sueño"],
    escalar: ["Si aparece dolor en el pecho, palpitaciones o falta de aire"] }),
  P({ id: 3, clave: "fc_base", sistema: "cardiovascular", nivel: "atencion", prueba_sugerida: "remedicion", fuente: "Tu línea base personal",
    condicion: "FC en reposo 10 lpm sobre tu línea base",
    ahora: ["Reposo sentado 5 min y repetir la medición"],
    hoy: ["Hidratación: mínimo 2.5 L", "Evitar cafeína el resto del día"],
    prevenir: ["Dormir 7–8 h", "Mantener el ejercicio aeróbico del plan"],
    escalar: ["Si la FC en reposo pasa de 110 lpm o hay síntomas"] }),
  P({ id: 4, clave: "news2", sistema: "respiratorio", nivel: "atencion", prueba_sugerida: "remedicion", fuente: "news2",
    condicion: "NEWS2 de 5–6 o algún signo con 3 puntos",
    ahora: ["Suspender actividad física y EVA", "Repetir signos vitales en reposo ahora"],
    hoy: ["Medir signos cada 4 h", "Si hay fiebre > 38.5 °C: paracetamol 500 mg del botiquín, según indique el médico de tripulación"],
    prevenir: ["Hidratación y descanso", "Lavado de manos y limpieza de superficies compartidas"],
    escalar: ["Avisar al médico de tripulación de inmediato (respuesta urgente)"] }),
  P({ id: 5, clave: "news2_alto", sistema: "respiratorio", nivel: "critico", prueba_sugerida: "remedicion", fuente: "news2",
    condicion: "NEWS2 de 7 o más",
    ahora: ["Avisar al médico de tripulación ahora", "Reposo y no quedarse solo"],
    hoy: ["Monitoreo continuo de signos vitales", "Oxígeno según el protocolo del módulo médico si la SpO₂ es ≤ 91 %"],
    prevenir: ["Revisar el plan con el médico de tripulación al estabilizarse"],
    escalar: ["Emergencia: el médico de tripulación coordina la atención"] }),
  P({ id: 6, clave: "spo2_emergencia", sistema: "respiratorio", nivel: "critico", prueba_sugerida: "remedicion", fuente: "news2,oms_oximetria",
    condicion: "SpO₂ menor a 90 %",
    ahora: ["Emergencia: avisar al médico de tripulación ahora", "Sentarse erguido y respirar lento", "Oxígeno según el protocolo del módulo médico"],
    hoy: ["Repetir la oximetría cada 15 min con buena señal (dedo tibio, sin movimiento)"],
    prevenir: ["Revisar el plan con el médico de tripulación al estabilizarse"],
    escalar: ["Si hay falta de aire, confusión o labios azulados: emergencia médica"] }),
  P({ id: 7, clave: "presion_alta", sistema: "cardiovascular", nivel: "atencion", prueba_sugerida: "remedicion", fuente: "pronam",
    condicion: "Presión ≥ 140/90 mmHg",
    ahora: ["Reposo sentado 5 min y repetir la medición"],
    hoy: ["Reducir la sal en las comidas de hoy", "Medir la presión en la mañana y en la noche"],
    prevenir: ["Ejercicio aeróbico diario según el plan", "Dormir 7–8 h"],
    escalar: ["Si llega a 180/110 o hay dolor de cabeza intenso, visión borrosa o dolor en el pecho"] }),
  P({ id: 8, clave: "presion_urgencia", sistema: "cardiovascular", nivel: "critico", prueba_sugerida: "remedicion", fuente: "pronam",
    condicion: "Presión ≥ 180/110 mmHg (urgencia hipertensiva)",
    ahora: ["Suspender toda actividad y quedarse en reposo", "Avisar al médico de tripulación ahora"],
    hoy: ["Repetir la presión cada 15 min"],
    prevenir: ["Revisar el plan con el médico de tripulación"],
    escalar: ["Dolor en el pecho, falta de aire, confusión o cambios en la visión: emergencia"] }),
  P({ id: 9, clave: "ortostatica", sistema: "cardiovascular", nivel: "atencion", prueba_sugerida: "ortostatica", fuente: "ortostatica",
    condicion: "Mareo al ponerse de pie o prueba ortostática positiva",
    ahora: ["Siéntate o acuéstate hasta que pase el mareo", "Haz la prueba ortostática"],
    hoy: ["Hidratación: 2.5 L con electrolitos", "Levántate despacio, en dos tiempos"],
    prevenir: ["Mantener el ejercicio de resistencia de piernas"],
    escalar: ["Si te desmayas o la prueba ortostática sale positiva"] }),
  P({ id: 10, clave: "sans", sistema: "vision", nivel: "atencion", prueba_sugerida: "amsler", fuente: "nasa_sans,amsler",
    condicion: "Visión borrosa o dolor de cabeza (check-in)",
    ahora: ["Descansa la vista 10 min y haz la rejilla de Amsler"],
    hoy: ["Prueba de agudeza visual con la tabla del módulo médico", "Revisar tu presión arterial"],
    prevenir: ["Registrar cada día si hay cambios en la visión", "Usar tus lentes si los tienes"],
    escalar: ["Si la visión empeora o el dolor de cabeza no cede en 24 h: revisión de fondo de ojo con el médico de tripulación"] }),
  P({ id: 11, clave: "amsler", sistema: "vision", nivel: "atencion", prueba_sugerida: "amsler", fuente: "amsler,nasa_sans",
    condicion: "Distorsión en la rejilla de Amsler (complemento, nunca rojo por sí sola)",
    ahora: ["Repite la rejilla con buena luz y con tus lentes puestos"],
    hoy: ["Contesta las preguntas de visión del check-in", "Avisar al médico de tripulación para revisión de ojos"],
    prevenir: ["Hacer la rejilla de Amsler una vez por semana"],
    escalar: ["Si la distorsión aumenta o aparece una mancha fija en la visión"] }),
  P({ id: 12, clave: "confusion", sistema: "salud_mental", nivel: "critico", prueba_sugerida: "remedicion", fuente: "news2",
    condicion: "Confusión o desorientación (check-in)",
    ahora: ["Avisar al médico de tripulación ahora", "No quedarse solo: un compañero te acompaña"],
    hoy: ["Revisión de signos vitales y glucosa con el médico de tripulación"],
    prevenir: ["Dormir 7–8 h e hidratarse"],
    escalar: ["Respuesta urgente: el médico de tripulación coordina la atención"] }),
  P({ id: 13, clave: "sueno", sistema: "sueno", nivel: "atencion", prueba_sugerida: "reaccion", fuente: "aasm,pvtb",
    condicion: "Menos de 7 h tres noches seguidas (rojo: ≤ 6 h y reacción peor que tu línea base)",
    ahora: ["Siesta corta de 20 min si tu horario lo permite"],
    hoy: ["Adelantar 1 h la hora de dormir", "Sin pantallas 45 min antes de dormir"],
    prevenir: ["Luz cálida en el módulo por la noche", "Horario fijo de sueño de 7 h o más"],
    escalar: ["Si la falta de sueño sigue 3 noches más o afecta tareas críticas"] }),
  P({ id: 14, clave: "radiacion_tormenta", sistema: "radiacion", nivel: "critico", prueba_sugerida: null, fuente: "nasa3001,ochmo,hera",
    condicion: "Alarma de la nave: tormenta solar activa (S1 a S5)",
    ahora: PASOS_REFUGIO.slice(0, 4),
    hoy: [PASOS_REFUGIO[4], "Registrar tu dosis personal al salir del refugio"],
    prevenir: ["Revisar el clima espacial (NOAA) a diario", "Planear las EVA lejos de pronósticos de tormenta"],
    escalar: ["Si la dosis de 30 días pasa del 80 % de 250 mSv o hay náusea o vómito"] }),
  P({ id: 15, clave: "radiacion_carrera", sistema: "radiacion", nivel: "atencion", prueba_sugerida: null, fuente: "nasa3001,ochmo",
    condicion: "Dosis de carrera ≥ 50 % de 600 mSv (rojo ≥ 80 %)",
    ahora: ["Revisar tu dosis acumulada con el médico de tripulación"],
    hoy: ["Priorizar tareas en las zonas con más blindaje"],
    prevenir: ["Minimizar las EVA no esenciales", "Dormir en la zona con más blindaje"],
    escalar: ["Si pasas del 80 % del límite de carrera"] }),
  P({ id: 16, clave: "radiacion_30d", sistema: "radiacion", nivel: "atencion", prueba_sugerida: null, fuente: "nasa3001,ochmo",
    condicion: "Dosis de 30 días ≥ 50 % de 250 mSv (rojo ≥ 80 %)",
    ahora: ["Revisar tu dosis de los últimos 30 días con el médico de tripulación"],
    hoy: ["Evitar EVA y tareas en zonas con poco blindaje"],
    prevenir: ["Rotar las tareas expuestas entre la tripulación"],
    escalar: ["Si pasas del 80 % del límite de 30 días"] }),
  P({ id: 17, clave: "radiacion_tasa", sistema: "radiacion", nivel: "atencion", prueba_sugerida: null, fuente: "hera,ochmo",
    condicion: "Tasa del dosímetro más de 3 veces tu línea base",
    ahora: ["Revisar que el dosímetro esté bien colocado y funcionando"],
    hoy: ["Moverte a una zona con más blindaje mientras se revisa"],
    prevenir: ["Revisar el clima espacial (NOAA) a diario"],
    escalar: ["Si la tasa sigue alta o suena la alarma de la nave"] }),
  P({ id: 18, clave: "hueso", sistema: "hueso_musculo", nivel: "atencion", prueba_sugerida: null, fuente: "Regla provisional del equipo",
    condicion: "Menos de 90 min de ejercicio de resistencia 5 días seguidos",
    ahora: ["Reportar la falla o la falta de acceso al equipo de ejercicio"],
    hoy: ["Rutina alternativa de bandas elásticas 45 min", "Si hay dolor muscular: ibuprofeno 400 mg del botiquín, según indique el médico de tripulación"],
    prevenir: ["Calcio y vitamina D según el menú de misión", "Volver a 90+ min diarios de ejercicio de resistencia"],
    escalar: ["Si llevas 10 días sin ejercicio de resistencia o aparece dolor óseo"] }),
  P({ id: 19, clave: "salud_mental", sistema: "salud_mental", nivel: "atencion", prueba_sugerida: "reaccion", fuente: "Auto-reporte del check-in",
    condicion: "Ánimo ≤ 2 o estrés ≥ 4 por 3 días",
    ahora: ["Sesión de respiración guiada de 10 min"],
    hoy: ["Agendar una llamada privada con tu familia", "Contestar el PHQ-9 y el GAD-7 en Pruebas"],
    prevenir: ["Mantener tiempo libre y de descanso en la rutina"],
    escalar: ["Hablar con el médico de tripulación si continúa 2 días más"] }),
  P({ id: 20, clave: "who5", sistema: "salud_mental", nivel: "atencion", prueba_sugerida: "phq9", fuente: "who5",
    condicion: "WHO-5 de 28 o menos",
    ahora: ["Medic avisó al médico de tripulación", "Contesta el PHQ-9"],
    hoy: ["Conversación privada con el médico de tripulación", "Actividad que disfrutes durante 30 min"],
    prevenir: ["Repetir el WHO-5 cada 7 días en el check-in"],
    escalar: ["Si el puntaje baja más o aparecen pensamientos de hacerte daño"] }),
  P({ id: 21, clave: "phq9", sistema: "salud_mental", nivel: "atencion", prueba_sugerida: "gad7", fuente: "phq9",
    condicion: "PHQ-9 de 10 o más (tamizaje, no diagnóstico)",
    ahora: ["Medic avisó al médico de tripulación"],
    hoy: ["Conversación privada con el médico de tripulación", "Llamada privada con tu familia"],
    prevenir: ["Repetir el PHQ-9 cada semana", "Mantener rutina de sueño, ejercicio y descanso"],
    escalar: ["Si aparecen pensamientos de hacerte daño, avisa de inmediato a la tripulación"] }),
  P({ id: 22, clave: "phq9_item9", sistema: "salud_mental", nivel: "critico", prueba_sugerida: null, fuente: "phq9",
    condicion: "Respuesta mayor a 0 en la pregunta 9 del PHQ-9",
    ahora: ["Medic avisó de inmediato al médico de tripulación", "Busca a un compañero de confianza; no te quedes solo(a)"],
    hoy: ["Conversación privada con el médico de tripulación hoy"],
    prevenir: ["Seguimiento semanal con el médico de tripulación", "Llamada privada con tu familia"],
    escalar: ["Si piensas en hacerte daño ahora, avisa de inmediato a la tripulación"] }),
  P({ id: 23, clave: "gad7", sistema: "salud_mental", nivel: "atencion", prueba_sugerida: "phq9", fuente: "gad7",
    condicion: "GAD-7 de 10 o más (tamizaje, no diagnóstico)",
    ahora: ["Medic avisó al médico de tripulación", "Respiración guiada de 10 min"],
    hoy: ["Conversación privada con el médico de tripulación"],
    prevenir: ["Repetir el GAD-7 cada semana"],
    escalar: ["Si la ansiedad no te deja dormir o trabajar"] }),
  P({ id: 25, clave: "cabina_co2", sistema: "cabina", nivel: "atencion", prueba_sugerida: null, fuente: "nasa_ambiente",
    condicion: "CO₂ de la cabina ≥ 3,500 ppm (rojo ≥ 5,000 ppm, umbrales de demo)",
    ahora: ["Revisar el sistema de remoción de CO₂ de tu módulo", "Moverte a un módulo con mejor ventilación"],
    hoy: ["Reportar el CO₂ al ingeniero de vuelo", "Hidratarte y tomar pausas si hay dolor de cabeza"],
    prevenir: ["Revisar a diario el CO₂ de los módulos donde duermes y trabajas"],
    escalar: ["Si el CO₂ pasa de 5,000 ppm o hay dolor de cabeza, mareo o falta de aire"] }),
  P({ id: 26, clave: "temperatura", sistema: "respiratorio", nivel: "atencion", prueba_sugerida: "checkin", fuente: "news2,nasa_inmune",
    condicion: "Temperatura fuera de 36.1–38.0 °C o síntomas de infección",
    ahora: ["Registra tus síntomas en el check-in", "Lávate las manos y usa cubrebocas si compartes módulo"],
    hoy: ["Medir la temperatura cada 6 h", "Si hay fiebre > 38.5 °C: paracetamol 500 mg del botiquín, según indique el médico de tripulación"],
    prevenir: ["Limpieza de superficies compartidas", "Dormir 7 h o más para proteger tu sistema inmune"],
    escalar: ["Si hay fiebre con 2 síntomas o más, o la fiebre llega a 39.1 °C"] }),
  P({ id: 27, clave: "tripulacion", sistema: "salud_mental", nivel: "atencion", prueba_sugerida: "who5", fuente: "nasa_salud_mental",
    condicion: "Relación con la tripulación ≤ 2 de 5",
    ahora: ["Toma una pausa de 10 min a solas antes de la siguiente tarea compartida"],
    hoy: ["Platica con el médico de tripulación o con el comandante en privado"],
    prevenir: ["Mantener espacios de descanso y actividades de equipo planeadas"],
    escalar: ["Si el conflicto afecta tareas críticas o continúa 2 días más"] }),
  P({ id: 28, clave: "fc_rango", sistema: "cardiovascular", nivel: "atencion", prueba_sugerida: "remedicion", fuente: "news2",
    condicion: "FC en reposo fuera de 51–90 lpm (rojo > 100 o ≤ 40)",
    ahora: ["Siéntate 5 min y repite la medición en reposo"],
    hoy: ["Hidratación: mínimo 2.5 L", "Evitar cafeína el resto del día"],
    prevenir: ["Dormir 7 h o más", "Mantener el ejercicio aeróbico del plan"],
    escalar: ["Si la FC sigue arriba de 100 en reposo o hay dolor en el pecho o desmayo"] }),
  P({ id: 29, clave: "fr_rango", sistema: "respiratorio", nivel: "atencion", prueba_sugerida: "remedicion", fuente: "news2",
    condicion: "Frecuencia respiratoria fuera de 12–20 (rojo ≤ 8 o ≥ 25)",
    ahora: ["Siéntate erguido y repite la medición en reposo"],
    hoy: ["Medir la respiración y la SpO₂ cada 4 h"],
    prevenir: ["Revisar el CO₂ de tu módulo"],
    escalar: ["Si hay falta de aire o la frecuencia llega a 25 o más"] }),
  P({ id: 30, clave: "spo2_baja", sistema: "respiratorio", nivel: "atencion", prueba_sugerida: "remedicion", fuente: "oms_oximetria,news2",
    condicion: "SpO₂ entre 90 y 94 %",
    ahora: ["Repite la oximetría con el dedo tibio y sin moverte", "Respira lento y profundo 2 min"],
    hoy: ["Medir la SpO₂ cada 4 h", "Revisar el CO₂ de tu módulo"],
    prevenir: ["Evitar esfuerzo intenso hasta normalizar"],
    escalar: ["Si baja de 90 %: emergencia, avisa al médico de tripulación"] }),
  P({ id: 31, clave: "presion_limitrofe", sistema: "cardiovascular", nivel: "atencion", prueba_sugerida: "ortostatica", fuente: "pronam,news2",
    condicion: "Presión ≥ 130/85 o sistólica ≤ 100",
    ahora: ["Reposo sentado 5 min y repetir la medición"],
    hoy: ["Medir la presión en la mañana y en la noche", "Reducir la sal en las comidas de hoy"],
    prevenir: ["Ejercicio aeróbico diario según el plan", "Dormir 7 h o más"],
    escalar: ["Si llega a 140/90, la sistólica baja de 90 o hay mareo"] }),
  P({ id: 32, clave: "tarjeta_fc", sistema: "cardiovascular", nivel: "atencion", prueba_sugerida: "remedicion", fuente: "news2",
    condicion: "Frecuencia cardiaca o VFC fuera de tu normal",
    ahora: ["Siéntate y respira lento 5 min"], hoy: ["Hidratación: mínimo 2.5 L", "Bajar la intensidad del ejercicio por 48 h si la VFC sigue baja"],
    prevenir: ["Dormir 7 h o más", "Repetir la medición mañana en ayunas"], escalar: ["Si aparece dolor en el pecho, palpitaciones o falta de aire"] }),
  P({ id: 33, clave: "tarjeta_pa", sistema: "cardiovascular", nivel: "atencion", prueba_sugerida: "ortostatica", fuente: "pronam,news2",
    condicion: "Presión fuera de tu rango", ahora: ["Reposo sentado 5 min y repetir la medición"], hoy: ["Medir la presión mañana y noche"],
    prevenir: ["Ejercicio aeróbico y poca sal"], escalar: ["Si llega a 140/90 o la sistólica baja de 90"] }),
  P({ id: 34, clave: "tarjeta_fr", sistema: "respiratorio", nivel: "atencion", prueba_sugerida: "remedicion", fuente: "news2",
    condicion: "Respiración fuera de 12–20", ahora: ["Repite la medición en reposo"], hoy: ["Medir respiración y SpO₂ cada 4 h"],
    prevenir: ["Revisar el CO₂ de tu módulo"], escalar: ["Si hay falta de aire"] }),
  P({ id: 35, clave: "tarjeta_temp", sistema: "respiratorio", nivel: "atencion", prueba_sugerida: "checkin", fuente: "news2,nasa_inmune",
    condicion: "Temperatura o síntomas de infección", ahora: ["Registra tus síntomas en el check-in"], hoy: ["Medir la temperatura cada 6 h"],
    prevenir: ["Lavado de manos y limpieza de superficies"], escalar: ["Si hay fiebre con 2 síntomas o más"] }),
  P({ id: 36, clave: "tarjeta_spo2", sistema: "respiratorio", nivel: "atencion", prueba_sugerida: "remedicion", fuente: "oms_oximetria,news2",
    condicion: "Oxigenación baja", ahora: ["Repite la oximetría con buena señal"], hoy: ["Medir la SpO₂ cada 4 h"],
    prevenir: ["Revisar el CO₂ de tu módulo"], escalar: ["Si baja de 90 %: emergencia"] }),
  P({ id: 37, clave: "tarjeta_conciencia", sistema: "salud_mental", nivel: "atencion", prueba_sugerida: "checkin", fuente: "news2,nasa_sensoriomotor",
    condicion: "Mareo o confusión", ahora: ["Siéntate o acuéstate hasta que pase"], hoy: ["Levántate despacio, en dos tiempos", "Haz la prueba ortostática"],
    prevenir: ["Hidratación con electrolitos"], escalar: ["Si aparece confusión o te desmayas"] }),
  P({ id: 38, clave: "tarjeta_radiacion", sistema: "radiacion", nivel: "atencion", prueba_sugerida: null, fuente: "nasa3001,ochmo",
    condicion: "Dosis de radiación arriba de lo habitual", ahora: ["Mantén el dosímetro puesto"], hoy: ["Prioriza tareas en zonas con más blindaje"],
    prevenir: ["Minimiza las EVA no esenciales"], escalar: ["Si suena la alarma de la nave o pasas del 80 % de un límite"] }),
  P({ id: 39, clave: "tarjeta_sueno", sistema: "sueno", nivel: "atencion", prueba_sugerida: "reaccion", fuente: "aasm,pvtb",
    condicion: "Sueño corto, reacción lenta o fatiga alta", ahora: ["Pausa de 10 min con respiración lenta"], hoy: ["Adelantar 1 h la hora de dormir"],
    prevenir: ["Horario fijo de sueño de 7 h o más"], escalar: ["Si la reacción sigue lenta o hay errores en tareas críticas"] }),
  P({ id: 40, clave: "tarjeta_animo", sistema: "salud_mental", nivel: "atencion", prueba_sugerida: "who5", fuente: "who5,nasa_salud_mental",
    condicion: "Ánimo, estrés o relación con la tripulación fuera de lo normal", ahora: ["Respiración guiada de 10 min"],
    hoy: ["Contestar el PHQ-9 en Pruebas", "Platicar con el médico de tripulación"], prevenir: ["Tiempo libre y de descanso en la rutina"],
    escalar: ["Si aparecen pensamientos de hacerte daño, avisa de inmediato a la tripulación"] }),
  P({ id: 41, clave: "tarjeta_vision", sistema: "vision", nivel: "atencion", prueba_sugerida: "amsler", fuente: "nasa_sans,amsler",
    condicion: "Visión borrosa o dolor de cabeza", ahora: ["Descansa la vista 10 min y haz la rejilla de Amsler"], hoy: ["Revisar tu presión arterial y el CO₂ de tu módulo"],
    prevenir: ["Registrar cada día si hay cambios en la visión"], escalar: ["Si la visión empeora o el dolor no cede en 24 h"] }),
  P({ id: 42, clave: "tarjeta_huesos", sistema: "hueso_musculo", nivel: "atencion", prueba_sugerida: null, fuente: "nasa_osea",
    condicion: "Ejercicio por debajo de lo prescrito", ahora: ["Revisa si el equipo de ejercicio está disponible"], hoy: ["Completa tu ejercicio prescrito de fuerza y cardio"],
    prevenir: ["Calcio y vitamina D según el menú de misión"], escalar: ["Si llevas 5 días debajo de lo prescrito o hay dolor óseo"] }),
  P({ id: 43, clave: "tarjeta_cabina", sistema: "cabina", nivel: "atencion", prueba_sugerida: null, fuente: "nasa_ambiente",
    condicion: "Ambiente de la cabina fuera de rango", ahora: ["Revisa la ventilación de tu módulo"], hoy: ["Reportar los valores al ingeniero de vuelo"],
    prevenir: ["Revisar el CO₂, la temperatura y la humedad a diario"], escalar: ["Si el CO₂ pasa de 5,000 ppm o hay síntomas"] }),
  P({ id: 24, clave: "escalada", sistema: "general", nivel: "critico", prueba_sugerida: null, fuente: "Escalamiento al médico de tripulación",
    condicion: "Prueba con resultado peor o alerta reportada",
    ahora: ["Quédate en reposo", "El médico de tripulación ya fue avisado"],
    hoy: ["Sigue sus indicaciones"],
    prevenir: ["Repite las pruebas que te indique"],
    escalar: ["Si aparecen síntomas nuevos, avisa de inmediato"] }),
];

const CUESTIONARIOS = {
  1: { who5: [2, 2, 2, 1, 3], phq9: [1, 1, 2, 2, 1, 1, 1, 0, 0], gad7: [1, 1, 1, 1, 1, 1, 0] },
  2: { who5: [4, 4, 4, 4, 4], phq9: [0, 0, 1, 1, 0, 0, 0, 0, 0], gad7: [0, 1, 0, 1, 0, 0, 0] },
  3: { who5: [3, 3, 3, 3, 3], phq9: [1, 0, 1, 1, 0, 1, 0, 0, 0], gad7: [1, 1, 1, 1, 0, 1, 0] },
};

export function puntuarCuestionario(tipo, respuestas) {
  const suma = respuestas.reduce((s, x) => s + Number(x || 0), 0);
  if (tipo === "who5") return { bruto: suma, puntaje: suma * 4 };
  return { puntaje: suma, item9: tipo === "phq9" ? Number(respuestas[8] || 0) : undefined };
}

const WHO5_SEMANAL = {
  1: [[2, 2, 2, 1, 3], [2, 2, 3, 2, 3], [3, 3, 4, 3, 4], [4, 3, 4, 3, 4]],
  2: [[4, 4, 4, 4, 4], [4, 4, 5, 4, 4], [4, 4, 4, 4, 5], [5, 4, 4, 4, 4]],
  3: [[3, 3, 3, 3, 3], [3, 3, 4, 3, 3], [3, 4, 3, 3, 4], [4, 3, 4, 3, 4]],
};

function pruebasSemilla() {
  const out = [];
  let id = 5000;
  for (const a of ASTRONAUTS) {
    const c = CUESTIONARIOS[a.id];
    for (let semana = 1; semana <= 12; semana++) {
      const resp = WHO5_SEMANAL[a.id][Math.min(semana - 1, 3)];
      const r = puntuarCuestionario("who5", resp);
      out.push({
        id: id++, astronaut_id: a.id, tipo: "who5", fecha: isoDate(semana * 7), desenlace: null,
        resultado: { respuestas: resp, ...r }, interpretacion: `WHO-5: ${r.puntaje}/100 · tamizaje, no diagnóstico`,
        creada_en: isoDateTime(semana * 7, 9, 30),
      });
    }
    for (const tipo of ["phq9", "gad7"]) {
      const r = puntuarCuestionario(tipo, c[tipo]);
      out.push({
        id: id++, astronaut_id: a.id, tipo, fecha: isoDate(3), desenlace: null,
        resultado: { respuestas: c[tipo], ...r }, interpretacion: `Puntaje ${r.puntaje} · tamizaje, no diagnóstico`,
        creada_en: isoDateTime(3, 9, 30),
      });
    }
  }
  return out;
}

export function eventosSemilla() {
  return [
    {
      id: 1, inicio: isoDateTime(19, 6, 40), fin: isoDateTime(17, 21, 15), nivel: "S3", origen: "simulado",
      refugio: { 1: isoDateTime(19, 6, 52), 2: isoDateTime(19, 6, 55), 3: isoDateTime(19, 7, 4) },
    },
  ];
}

const SINTOMAS_HOY = { 3: ["garganta"] };
const CO2_PICO = { 2: [3900, 4300] };

export function resultadosSemilla(vitals) {
  const rnd = mulberry32(4242);
  const out = [];
  const fila = (a, prueba_id, diasAtras, hora, respuestas, base = {}) => {
    const previos = out.filter((r) => r.astronaut_id === a && r.prueba_id === prueba_id);
    const b = { ...baseDe(prueba_id, previos), ...base };
    const resultado = calificarPrueba(prueba_id, respuestas, b);
    out.push({ id: `s-${a}-${prueba_id}-${diasAtras}`, astronaut_id: a, prueba_id, valor: { respuestas, resultado, causas: resultado.causas || {} }, nivel: resultado.nivel, hecho_en: isoDateTime(diasAtras, hora, Math.floor(rnd() * 50)), desde_ficha: null, diasAtras, hora });
  };
  const vit = (a, diasAtras) => vitals.find((v) => v.astronaut_id === a && v.fecha === isoDate(diasAtras)) || {};
  const pad = (n) => String(n).padStart(2, "0");
  for (const a of ASTRONAUTS.map((x) => x.id)) {
    for (let d = 60; d >= 1; d -= 3) {
      const malo = a === 1 && d <= 8;
      const med = Math.round(278 + a * 4 + rnd() * 18 + (malo ? 55 + (8 - d) * 6 : 0));
      fila(a, "pvt", d, 7, { pvt: { mediana_ms: med, lapsos: malo ? 3 + Math.round((8 - d) / 3) : Math.round(rnd() * 1.5), falsas: Math.round(rnd()), estimulos: 60 } });
    }
    for (let d = 21; d >= 1; d--) {
      const v = vit(a, d);
      const horas = Number(v.horas_sueno) || 7.2;
      const malo = a === 1 && d <= 8;
      const latencia = malo ? 35 + Math.round(rnd() * 20) : 10 + Math.round(rnd() * 10);
      const despierto = malo ? 40 + Math.round(rnd() * 20) : 10 + Math.round(rnd() * 10);
      const total = Math.round(horas * 60 + latencia + despierto);
      const ini = 22 * 60 + 30 + Math.round(rnd() * 30);
      const fin = (ini + total) % 1440;
      fila(a, "diario_sueno", d, 7, {
        acostarse: `${pad(Math.floor(ini / 60) % 24)}:${pad(ini % 60)}`, levantarse: `${pad(Math.floor(fin / 60))}:${pad(fin % 60)}`, latencia, despertares: malo ? 3 : 1, despierto,
        calidad: malo ? 2 : 4, ambiente: a === 2 && d <= 2 ? ["calor"] : [], somnifero: malo && d % 3 === 0 ? "si" : "no",
      });
    }
    for (let d = 14; d >= 1; d -= 2) fila(a, "kss", d, 14, { kss: a === 1 && d <= 8 ? 7 + Math.round(rnd()) : 3 + Math.round(rnd() * 2) });
    for (let d = 84; d >= 0; d -= 14) {
      const s0 = 112 + a * 2 + Math.round(rnd() * 6), d0 = 70 + Math.round(rnd() * 6);
      fila(a, "presion_pronam", Math.max(d, 1), 9, { l1: { sistolica: s0 + 4, diastolica: d0 + 2 }, l2: { sistolica: s0, diastolica: d0 }, l3: { sistolica: s0 - 1, diastolica: d0 } });
    }
    const agarre0 = { 1: 34, 2: 30, 3: 46 }[a];
    for (let sem = 8; sem >= 1; sem--) {
      const caida = a === 3 && sem <= 3 ? 1 - 0.05 * (4 - sem) : 1;
      const k = Math.round(agarre0 * caida * (0.98 + rnd() * 0.04));
      fila(a, "agarre", sem * 7, 16, { derecha: { i1: k - 1, i2: k, i3: k - 2 }, izquierda: { i1: k - 3, i2: k - 2, i3: k - 4 } });
    }
    for (let d = 14; d >= 1; d--) {
      const m = Number(vit(a, d).minutos_ejercicio) || 120;
      const cinta = Math.round(m * 0.3), bici = Math.round(m * 0.15);
      fila(a, "ejercicio_registro", d, 19, { cinta, bici, resistencia: m - cinta - bici }, { ejercicioMeta: 120 });
    }
    for (let d = 27; d >= 3; d -= 4) fila(a, "orina", d, 8, { color: a === 3 && d <= 7 ? 6 : 2 + Math.round(rnd() * 2) });
    for (const [d, lineas] of [[112, 9], [52, 9]]) {
      fila(a, "amsler", d, 10, { amsler: { od: [], oi: [] } });
      fila(a, "agudeza", d, 10, { agudeza: { distancia: 3, od: lineas, oi: lineas, cerca: a === 1 && d === 52 ? 8 : lineas } });
    }
    for (const d of [19, 18]) fila(a, "tormenta_sintomas", d, d === 19 ? 13 : 9, { nausea: "no", vomito: "no", cansancio: 3 + Math.round(rnd() * 2), piel: "no", dosis: Math.round((8 + rnd() * 10) * 10) / 10 });
    for (let d = 30; d >= 2; d -= 7) fila(a, "temperatura", d, 8, { espera: "si", sitio: "oral", temperatura: Math.round((36.6 + rnd() * 0.5) * 10) / 10 });
  }
  fila(2, "cabina_tripulacion", 1, 11, { tripulacion: { 1: { dolor: false, cansancio: true, sueno: true }, 2: { dolor: true, cansancio: false, sueno: false }, 3: { dolor: false, cansancio: false, sueno: false } } });
  return out;
}

export function actividadSemilla() {
  return ASTRONAUTS.map((a) => ({ astronaut_id: a.id, estado: "reposo", desde: isoDateTime(0, 6, 30), fiebre: false }));
}

export function generateMock() {
  const rnd = mulberry32(78);
  const rnd2 = mulberry32(2026);
  const rnd3 = mulberry32(314);
  const cabina = [];
  const E = EVENTOS;
  const vitals = [];
  const checkins = [];
  for (const a of ASTRONAUTS) {
    for (let d = 0; d < DIAS; d++) {
      const fecha = isoDate(DIAS - 1 - d);
      const malSueno = a.id === 1 && d >= E.malSuenoDesde;
      const tormenta = d >= E.tormentaDesde && d <= E.tormentaHasta;
      const sinEjercicio = a.id === 3 && d >= E.sinEjercicioDesde;
      vitals.push({
        astronaut_id: a.id,
        fecha,
        fc: round(60 + a.id * 2 + rnd() * 6 + (rnd3() - 0.5) * 10 + (malSueno ? 9 : 0)),
        vfc: round(68 - a.id * 3 + rnd() * 8 - (malSueno ? 22 : 0)),
        spo2: round(97 + rnd() * 2, 1),
        sistolica: round(111 + rnd() * 8),
        diastolica: round(68 + rnd() * 10),
        temperatura: round(36.4 + rnd() * 0.5, 1),
        frec_resp: round(13 + rnd() * 4),
        horas_sueno: round(malSueno ? 4.6 + rnd() * 1.0 : 7.0 + rnd() * 1.2, 1),
        dosis_dia_msv: round(tormenta ? (rnd(), 8 + rnd() * 17) : (0.4 + rnd() * 0.3) * FACTOR_DOSIS[a.id], 3),
        minutos_ejercicio: round(sinEjercicio ? 40 + rnd() * 25 : 115 + rnd() * 35),
        peso: round(PESO_BASE[a.id] - d * 0.008 + rnd() * 0.4, 1),
      });
      const v = vitals[vitals.length - 1];
      v.ejercicio_fuerza_min = Math.round(v.minutos_ejercicio * 0.55);
      v.ejercicio_cardio_min = v.minutos_ejercicio - v.ejercicio_fuerza_min;
      const diasAtras = DIAS - 1 - d;
      const pico = CO2_PICO[a.id] && diasAtras < 2 ? CO2_PICO[a.id][1 - diasAtras] : null;
      cabina.push({
        astronaut_id: a.id,
        fecha,
        co2_ppm: pico ?? Math.round(2200 + rnd2() * 800),
        temp_c: round(21 + rnd2() * 3, 1),
        humedad: Math.round(38 + rnd2() * 15),
        ruido_db: Math.round(52 + rnd2() * 8),
      });
      checkins.push({
        astronaut_id: a.id,
        fecha,
        animo: clamp(round(4 + rnd() - (malSueno ? 2 : 0)), 1, 5),
        estres: clamp(round(2 + rnd() + (malSueno ? 2 : 0) + (tormenta ? 1 : 0)), 1, 5),
        fatiga: clamp(round(2 + rnd() + (malSueno ? 2 : 0)), 1, 5),
        tiempo_reaccion_ms: round(270 + rnd() * 40 + (malSueno ? 90 : 0)),
        confusion: false,
        vision_cefalea: false,
        mareo_de_pie: false,
        tripulacion: clamp(Math.round(3.5 + rnd2() * 1.5), 1, 5),
        sintomas: d === DIAS - 1 ? SINTOMAS_HOY[a.id] || [] : [],
        vision_borrosa: false,
        dolor_cabeza: a.id === 2 && d >= DIAS - 2,
      });
    }
  }
  return {
    astronauts: ASTRONAUTS, vitals, checkins, protocols: PROTOCOLS, alerts: [],
    profiles: PROFILES, historias: HISTORIAS, pruebas: pruebasSemilla(), eventos: eventosSemilla(), cabina,
    actividad: actividadSemilla(), resultados: resultadosSemilla(vitals),
  };
}
