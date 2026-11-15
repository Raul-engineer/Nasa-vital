import { baseDe, calificarPrueba, construirValor, PRUEBAS_POR_ID } from "./pruebas.js";

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
  { id: 1, nombre: "Cmdr. A. Reyes", rol: "Commander", dia_mision: 142, dia_regreso: 180 },
  { id: 2, nombre: "Dr. L. Garza", rol: "Crew medical officer", dia_mision: 142, dia_regreso: 180 },
  { id: 3, nombre: "Eng. M. Torres", rol: "Flight engineer", dia_mision: 142, dia_regreso: 180 },
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
    astronaut_id: 1, edad: 46, sexo: "Female", peso_kg: 64, estatura_cm: 168, tipo_sangre: "O+",
    alergias: [{ sustancia: "Latex", reaccion: "Contact dermatitis", riesgo: "moderado" }],
    medicamentos: ["Artificial tears as needed"],
    condiciones_cronicas: ["Mild myopia"],
    fc_basal: 62, pa_basal: "112/72", spo2_basal: 98,
    dosis_carrera_previa_msv: 180, misiones_previas: 2, dias_espacio_previos: 365, usa_lentes: true, ejercicio_prescrito_min: 120,
    contacto_emergencia: { nombre: "J. Reyes", relacion: "Husband", telefono: "+52 81 5555 0101" },
  },
  {
    astronaut_id: 2, edad: 39, sexo: "Female", peso_kg: 58, estatura_cm: 162, tipo_sangre: "A+",
    alergias: [{ sustancia: "Ibuprofen (NSAID)", reaccion: "Hives", riesgo: "moderado" }],
    medicamentos: [],
    condiciones_cronicas: [],
    fc_basal: 60, pa_basal: "108/70", spo2_basal: 99,
    dosis_carrera_previa_msv: 60, misiones_previas: 1, dias_espacio_previos: 120, usa_lentes: false, ejercicio_prescrito_min: 120,
    contacto_emergencia: { nombre: "R. Garza", relacion: "Sister", telefono: "+52 81 5555 0102" },
  },
  {
    astronaut_id: 3, edad: 42, sexo: "Male", peso_kg: 82, estatura_cm: 178, tipo_sangre: "B+",
    alergias: [
      { sustancia: "Penicillin", reaccion: "Anaphylaxis", riesgo: "alto" },
      { sustancia: "Shellfish", reaccion: "Mild hives", riesgo: "bajo" },
    ],
    medicamentos: ["Vitamin D 1000 IU daily"],
    condiciones_cronicas: ["Mild hypercholesterolemia controlled with diet"],
    fc_basal: 64, pa_basal: "118/76", spo2_basal: 98,
    dosis_carrera_previa_msv: 0, misiones_previas: 0, dias_espacio_previos: 0, usa_lentes: false, ejercicio_prescrito_min: 120,
    contacto_emergencia: { nombre: "P. Torres", relacion: "Mother", telefono: "+52 81 5555 0103" },
  },
];

export const HISTORIAS = [
  {
    astronaut_id: 1,
    heredofamiliares: { diabetes: "Father (type 2)", hipertension: "Mother", cardiopatia: "None", cancer: "None", otros: "" },
    personales_patologicos: {
      asma: "Denied", alergias: "Latex (contact dermatitis)", cirugias: "Appendectomy at age 19", fracturas: "Left distal radius (2009)",
      cronicas: "Mild myopia", hospitalizaciones: "Only for the appendectomy", tabaco: "Never", alcohol: "Occasional, suspended during the mission",
    },
    no_patologicos: {
      actividad_fisica: "Running and strength 6 days a week before flight", alimentacion: "Balanced mission menu",
      sueno: "7 h usual; occasional insomnia during the mission", vacunas: "Full schedule, influenza and COVID-19 up to date",
    },
    padecimiento_actual: "Trouble sleeping for 8 nights due to workload; reports tiredness in the afternoons.",
    interrogatorio_sistemas: {
      respiratorio: "No symptoms", cardiovascular: "No palpitations or chest pain", digestivo: "No symptoms",
      neurologico: "Occasional mild headache in the afternoons", vision: "No changes since the start of the mission",
      musculo_esqueletico: "No pain", piel: "No lesions", animo: "Irritable from tiredness",
    },
    espacial: { mareo_espacial_previo: "Yes, mild during the first 2 days of previous missions", sans_previo: "No" },
  },
  {
    astronaut_id: 2,
    heredofamiliares: { diabetes: "None", hipertension: "Father", cardiopatia: "Paternal grandfather (heart attack at 70)", cancer: "None", otros: "" },
    personales_patologicos: {
      asma: "Denied", alergias: "Ibuprofen (hives)", cirugias: "None", fracturas: "None",
      cronicas: "None", hospitalizaciones: "None", tabaco: "Never", alcohol: "Never",
    },
    no_patologicos: {
      actividad_fisica: "Swimming and strength 5 days a week", alimentacion: "Balanced mission menu",
      sueno: "7.5 h usual", vacunas: "Full schedule, influenza and COVID-19 up to date",
    },
    padecimiento_actual: "Asymptomatic.",
    interrogatorio_sistemas: {
      respiratorio: "No symptoms", cardiovascular: "No symptoms", digestivo: "No symptoms", neurologico: "No symptoms",
      vision: "No changes", musculo_esqueletico: "No pain", piel: "No lesions", animo: "Stable",
    },
    espacial: { mareo_espacial_previo: "Yes, mild during the first 3 days of the previous mission", sans_previo: "No" },
  },
  {
    astronaut_id: 3,
    heredofamiliares: { diabetes: "Mother (type 2)", hipertension: "Both parents", cardiopatia: "None", cancer: "Maternal grandmother (breast)", otros: "Osteoporosis in the maternal grandmother" },
    personales_patologicos: {
      asma: "Mild asthma in childhood, no attacks since age 12", alergias: "Penicillin (anaphylaxis), shellfish (mild hives)",
      cirugias: "Right knee arthroscopy (2016)", fracturas: "Right clavicle (2011)",
      cronicas: "Mild hypercholesterolemia controlled with diet", hospitalizaciones: "For the penicillin reaction (2004)",
      tabaco: "Former smoker, quit 15 years ago", alcohol: "Occasional, suspended during the mission",
    },
    no_patologicos: {
      actividad_fisica: "Strength and cycling 6 days a week before flight", alimentacion: "Mission menu, avoids shellfish",
      sueno: "7 h usual", vacunas: "Full schedule, influenza and COVID-19 up to date",
    },
    padecimiento_actual: "No full access to the resistance equipment for 25 days due to a failure; reports mild lower back discomfort.",
    interrogatorio_sistemas: {
      respiratorio: "No symptoms", cardiovascular: "No symptoms", digestivo: "No symptoms", neurologico: "No symptoms",
      vision: "No changes", musculo_esqueletico: "Mild lower back discomfort, no radiation", piel: "No lesions", animo: "Frustrated by the equipment failure",
    },
    espacial: { mareo_espacial_previo: "Not applicable (first mission)", sans_previo: "Not applicable (first mission)" },
  },
];

const P = (o) => ({ ...o, acciones: [...o.ahora, ...o.hoy].slice(0, 3) });

export const PASOS_REFUGIO = [
  "Suspend spacewalks and tasks outside protected areas",
  "Go to the most shielded area of the spacecraft",
  "Surround yourself with water and supplies as shielding",
  "Keep the dosimeter on",
  "Wait for the end-of-event notice",
];

export const PROTOCOLS = [
  P({ id: 1, clave: "vfc_sueno", sistema: "sueno", nivel: "atencion", prueba_sugerida: "reaccion", fuente: "aasm,pvtb,Your personal baseline",
    condicion: "HRV below your baseline 3+ days and short sleep 3+ nights",
    ahora: ["10-min break with slow breathing (6 breaths per minute)"],
    hoy: ["Go to bed 1 h earlier", "Lower exercise to moderate intensity for 48 h", "Ask to reschedule tomorrow's critical tasks"],
    prevenir: ["No screens 45 min before sleep and warm light in the module", "Fixed sleep schedule from 22:00 to 06:00 (7 h or more)"],
    escalar: ["If the reaction test is still worse than your baseline or there are errors in critical tasks", "If the lack of sleep continues 3 more nights"] }),
  P({ id: 2, clave: "vfc", sistema: "cardiovascular", nivel: "atencion", prueba_sugerida: "remedicion", fuente: "Your personal baseline",
    condicion: "HRV 20 % below your baseline 3 days in a row",
    ahora: ["Sit down and breathe slowly for 5 min"],
    hoy: ["Lower exercise intensity to moderate for 48 h", "Hydration: at least 2.5 L"],
    prevenir: ["Repeat the reading tomorrow while fasting", "Keep a fixed sleep schedule"],
    escalar: ["If chest pain, palpitations or shortness of breath appear"] }),
  P({ id: 3, clave: "fc_base", sistema: "cardiovascular", nivel: "atencion", prueba_sugerida: "remedicion", fuente: "Your personal baseline",
    condicion: "Resting HR 10 bpm above your baseline",
    ahora: ["Rest seated for 5 min and repeat the reading"],
    hoy: ["Hydration: at least 2.5 L", "Avoid caffeine for the rest of the day"],
    prevenir: ["Sleep 7–8 h", "Keep the aerobic exercise in the plan"],
    escalar: ["If resting HR goes above 110 bpm or there are symptoms"] }),
  P({ id: 4, clave: "news2", sistema: "respiratorio", nivel: "atencion", prueba_sugerida: "remedicion", fuente: "news2",
    condicion: "NEWS2 of 5–6 or any sign with 3 points",
    ahora: ["Suspend physical activity and EVA", "Repeat vital signs at rest now"],
    hoy: ["Measure signs every 4 h", "If there is fever > 38.5 °C: acetaminophen 500 mg from the kit, as the crew physician indicates"],
    prevenir: ["Hydration and rest", "Hand washing and cleaning of shared surfaces"],
    escalar: ["Notify the crew physician immediately (urgent response)"] }),
  P({ id: 5, clave: "news2_alto", sistema: "respiratorio", nivel: "critico", prueba_sugerida: "remedicion", fuente: "news2",
    condicion: "NEWS2 of 7 or more",
    ahora: ["Notify the crew physician now", "Rest and do not stay alone"],
    hoy: ["Continuous vital sign monitoring", "Oxygen per the medical module protocol if SpO₂ is ≤ 91 %"],
    prevenir: ["Review the plan with the crew physician once stabilized"],
    escalar: ["Emergency: the crew physician coordinates care"] }),
  P({ id: 6, clave: "spo2_emergencia", sistema: "respiratorio", nivel: "critico", prueba_sugerida: "remedicion", fuente: "news2,oms_oximetria",
    condicion: "SpO₂ below 90 %",
    ahora: ["Emergency: notify the crew physician now", "Sit upright and breathe slowly", "Oxygen per the medical module protocol"],
    hoy: ["Repeat oximetry every 15 min with a good signal (warm finger, no movement)"],
    prevenir: ["Review the plan with the crew physician once stabilized"],
    escalar: ["If there is shortness of breath, confusion or bluish lips: medical emergency"] }),
  P({ id: 7, clave: "presion_alta", sistema: "cardiovascular", nivel: "atencion", prueba_sugerida: "remedicion", fuente: "pronam",
    condicion: "Blood pressure ≥ 140/90 mmHg",
    ahora: ["Rest seated for 5 min and repeat the reading"],
    hoy: ["Cut down on salt in today's meals", "Measure blood pressure in the morning and at night"],
    prevenir: ["Daily aerobic exercise per the plan", "Sleep 7–8 h"],
    escalar: ["If it reaches 180/110 or there is a severe headache, blurred vision or chest pain"] }),
  P({ id: 8, clave: "presion_urgencia", sistema: "cardiovascular", nivel: "critico", prueba_sugerida: "remedicion", fuente: "pronam",
    condicion: "Blood pressure ≥ 180/110 mmHg (hypertensive urgency)",
    ahora: ["Stop all activity and stay at rest", "Notify the crew physician now"],
    hoy: ["Repeat blood pressure every 15 min"],
    prevenir: ["Review the plan with the crew physician"],
    escalar: ["Chest pain, shortness of breath, confusion or vision changes: emergency"] }),
  P({ id: 9, clave: "ortostatica", sistema: "cardiovascular", nivel: "atencion", prueba_sugerida: "ortostatica", fuente: "ortostatica",
    condicion: "Dizziness when standing up or a positive orthostatic test",
    ahora: ["Sit or lie down until the dizziness passes", "Do the orthostatic test"],
    hoy: ["Hydration: 2.5 L with electrolytes", "Get up slowly, in two steps"],
    prevenir: ["Keep up leg resistance exercise"],
    escalar: ["If you faint or the orthostatic test comes out positive"] }),
  P({ id: 10, clave: "sans", sistema: "vision", nivel: "atencion", prueba_sugerida: "amsler", fuente: "nasa_sans,amsler",
    condicion: "Blurred vision or headache (check-in)",
    ahora: ["Rest your eyes for 10 min and do the Amsler grid"],
    hoy: ["Visual acuity test with the medical module chart", "Check your blood pressure"],
    prevenir: ["Log any vision changes every day", "Wear your glasses if you have them"],
    escalar: ["If vision gets worse or the headache does not ease in 24 h: fundus exam with the crew physician"] }),
  P({ id: 11, clave: "amsler", sistema: "vision", nivel: "atencion", prueba_sugerida: "amsler", fuente: "amsler,nasa_sans",
    condicion: "Distortion on the Amsler grid (complement, never red on its own)",
    ahora: ["Repeat the grid with good light and your glasses on"],
    hoy: ["Answer the vision questions in the check-in", "Notify the crew physician for an eye exam"],
    prevenir: ["Do the Amsler grid once a week"],
    escalar: ["If the distortion increases or a fixed spot appears in your vision"] }),
  P({ id: 12, clave: "confusion", sistema: "salud_mental", nivel: "critico", prueba_sugerida: "remedicion", fuente: "news2",
    condicion: "Confusion or disorientation (check-in)",
    ahora: ["Notify the crew physician now", "Do not stay alone: a crewmate stays with you"],
    hoy: ["Vital signs and glucose check with the crew physician"],
    prevenir: ["Sleep 7–8 h and hydrate"],
    escalar: ["Urgent response: the crew physician coordinates care"] }),
  P({ id: 13, clave: "sueno", sistema: "sueno", nivel: "atencion", prueba_sugerida: "reaccion", fuente: "aasm,pvtb",
    condicion: "Less than 7 h three nights in a row (red: ≤ 6 h and reaction worse than your baseline)",
    ahora: ["Short 20-min nap if your schedule allows"],
    hoy: ["Go to bed 1 h earlier", "No screens 45 min before sleep"],
    prevenir: ["Warm light in the module at night", "Fixed sleep schedule of 7 h or more"],
    escalar: ["If the lack of sleep continues 3 more nights or affects critical tasks"] }),
  P({ id: 14, clave: "radiacion_tormenta", sistema: "radiacion", nivel: "critico", prueba_sugerida: null, fuente: "nasa3001,ochmo,hera",
    condicion: "Ship alarm: solar storm active (S1 to S5)",
    ahora: PASOS_REFUGIO.slice(0, 4),
    hoy: [PASOS_REFUGIO[4], "Log your personal dose when you leave the shelter"],
    prevenir: ["Check space weather (NOAA) daily", "Plan EVAs away from storm forecasts"],
    escalar: ["If the 30-day dose exceeds 80 % of 250 mSv or there is nausea or vomiting"] }),
  P({ id: 15, clave: "radiacion_carrera", sistema: "radiacion", nivel: "atencion", prueba_sugerida: null, fuente: "nasa3001,ochmo",
    condicion: "Career dose ≥ 50 % of 600 mSv (red ≥ 80 %)",
    ahora: ["Review your cumulative dose with the crew physician"],
    hoy: ["Prioritize tasks in the areas with more shielding"],
    prevenir: ["Minimize non-essential EVAs", "Sleep in the area with more shielding"],
    escalar: ["If you exceed 80 % of the career limit"] }),
  P({ id: 16, clave: "radiacion_30d", sistema: "radiacion", nivel: "atencion", prueba_sugerida: null, fuente: "nasa3001,ochmo",
    condicion: "30-day dose ≥ 50 % of 250 mSv (red ≥ 80 %)",
    ahora: ["Review your dose for the last 30 days with the crew physician"],
    hoy: ["Avoid EVAs and tasks in areas with little shielding"],
    prevenir: ["Rotate exposed tasks among the crew"],
    escalar: ["If you exceed 80 % of the 30-day limit"] }),
  P({ id: 17, clave: "radiacion_tasa", sistema: "radiacion", nivel: "atencion", prueba_sugerida: null, fuente: "hera,ochmo",
    condicion: "Dosimeter rate more than 3 times your baseline",
    ahora: ["Check that the dosimeter is properly placed and working"],
    hoy: ["Move to an area with more shielding while it is checked"],
    prevenir: ["Check space weather (NOAA) daily"],
    escalar: ["If the rate stays high or the ship alarm sounds"] }),
  P({ id: 18, clave: "hueso", sistema: "hueso_musculo", nivel: "atencion", prueba_sugerida: null, fuente: "Provisional team rule",
    condicion: "Less than 90 min of resistance exercise 5 days in a row",
    ahora: ["Report the failure or lack of access to the exercise equipment"],
    hoy: ["Alternative 45-min resistance band routine", "If there is muscle pain: ibuprofen 400 mg from the kit, as the crew physician indicates"],
    prevenir: ["Calcium and vitamin D per the mission menu", "Return to 90+ min of daily resistance exercise"],
    escalar: ["If you have gone 10 days without resistance exercise or bone pain appears"] }),
  P({ id: 19, clave: "salud_mental", sistema: "salud_mental", nivel: "atencion", prueba_sugerida: "reaccion", fuente: "Check-in self-report",
    condicion: "Mood ≤ 2 or stress ≥ 4 for 3 days",
    ahora: ["10-min guided breathing session"],
    hoy: ["Schedule a private call with your family", "Answer the PHQ-9 and GAD-7 in Tests"],
    prevenir: ["Keep free time and rest in your routine"],
    escalar: ["Talk to the crew physician if it continues 2 more days"] }),
  P({ id: 20, clave: "who5", sistema: "salud_mental", nivel: "atencion", prueba_sugerida: "phq9", fuente: "who5",
    condicion: "WHO-5 of 28 or less",
    ahora: ["Medic notified the crew physician", "Answer the PHQ-9"],
    hoy: ["Private conversation with the crew physician", "An activity you enjoy for 30 min"],
    prevenir: ["Repeat the WHO-5 every 7 days in the check-in"],
    escalar: ["If the score drops further or thoughts of harming yourself appear"] }),
  P({ id: 21, clave: "phq9", sistema: "salud_mental", nivel: "atencion", prueba_sugerida: "gad7", fuente: "phq9",
    condicion: "PHQ-9 of 10 or more (screening, not diagnosis)",
    ahora: ["Medic notified the crew physician"],
    hoy: ["Private conversation with the crew physician", "Private call with your family"],
    prevenir: ["Repeat the PHQ-9 every week", "Keep your sleep, exercise and rest routine"],
    escalar: ["If thoughts of harming yourself appear, tell the crew immediately"] }),
  P({ id: 22, clave: "phq9_item9", sistema: "salud_mental", nivel: "critico", prueba_sugerida: null, fuente: "phq9",
    condicion: "Answer above 0 on question 9 of the PHQ-9",
    ahora: ["Medic notified the crew physician immediately", "Find a crewmate you trust; do not stay alone"],
    hoy: ["Private conversation with the crew physician today"],
    prevenir: ["Weekly follow-up with the crew physician", "Private call with your family"],
    escalar: ["If you are thinking of harming yourself now, tell the crew immediately"] }),
  P({ id: 23, clave: "gad7", sistema: "salud_mental", nivel: "atencion", prueba_sugerida: "phq9", fuente: "gad7",
    condicion: "GAD-7 of 10 or more (screening, not diagnosis)",
    ahora: ["Medic notified the crew physician", "10-min guided breathing"],
    hoy: ["Private conversation with the crew physician"],
    prevenir: ["Repeat the GAD-7 every week"],
    escalar: ["If anxiety keeps you from sleeping or working"] }),
  P({ id: 25, clave: "cabina_co2", sistema: "cabina", nivel: "atencion", prueba_sugerida: null, fuente: "nasa_ambiente",
    condicion: "Cabin CO₂ ≥ 3,500 ppm (red ≥ 5,000 ppm, demo thresholds)",
    ahora: ["Check the CO₂ removal system in your module", "Move to a better-ventilated module"],
    hoy: ["Report the CO₂ to the flight engineer", "Hydrate and take breaks if you have a headache"],
    prevenir: ["Check the CO₂ daily in the modules where you sleep and work"],
    escalar: ["If CO₂ exceeds 5,000 ppm or there is headache, dizziness or shortness of breath"] }),
  P({ id: 26, clave: "temperatura", sistema: "respiratorio", nivel: "atencion", prueba_sugerida: "checkin", fuente: "news2,nasa_inmune",
    condicion: "Temperature outside 36.1–38.0 °C or signs of infection",
    ahora: ["Log your symptoms in the check-in", "Wash your hands and wear a face mask if you share a module"],
    hoy: ["Measure your temperature every 6 h", "If there is fever > 38.5 °C: acetaminophen 500 mg from the kit, as the crew physician indicates"],
    prevenir: ["Cleaning of shared surfaces", "Sleep 7 h or more to protect your immune system"],
    escalar: ["If there is fever with 2 or more symptoms, or the fever reaches 39.1 °C"] }),
  P({ id: 27, clave: "tripulacion", sistema: "salud_mental", nivel: "atencion", prueba_sugerida: "who5", fuente: "nasa_salud_mental",
    condicion: "Relationship with the crew ≤ 2 of 5",
    ahora: ["Take a 10-min break alone before the next shared task"],
    hoy: ["Talk privately with the crew physician or the commander"],
    prevenir: ["Keep rest spaces and planned team activities"],
    escalar: ["If the conflict affects critical tasks or continues 2 more days"] }),
  P({ id: 28, clave: "fc_rango", sistema: "cardiovascular", nivel: "atencion", prueba_sugerida: "remedicion", fuente: "news2",
    condicion: "Resting HR outside 51–90 bpm (red > 100 or ≤ 40)",
    ahora: ["Sit for 5 min and repeat the reading at rest"],
    hoy: ["Hydration: at least 2.5 L", "Avoid caffeine for the rest of the day"],
    prevenir: ["Sleep 7 h or more", "Keep the aerobic exercise in the plan"],
    escalar: ["If HR stays above 100 at rest or there is chest pain or fainting"] }),
  P({ id: 29, clave: "fr_rango", sistema: "respiratorio", nivel: "atencion", prueba_sugerida: "remedicion", fuente: "news2",
    condicion: "Respiratory rate outside 12–20 (red ≤ 8 or ≥ 25)",
    ahora: ["Sit upright and repeat the reading at rest"],
    hoy: ["Measure breathing and SpO₂ every 4 h"],
    prevenir: ["Check the CO₂ in your module"],
    escalar: ["If there is shortness of breath or the rate reaches 25 or more"] }),
  P({ id: 30, clave: "spo2_baja", sistema: "respiratorio", nivel: "atencion", prueba_sugerida: "remedicion", fuente: "oms_oximetria,news2",
    condicion: "SpO₂ between 90 and 94 %",
    ahora: ["Repeat oximetry with a warm finger and without moving", "Breathe slowly and deeply for 2 min"],
    hoy: ["Measure SpO₂ every 4 h", "Check the CO₂ in your module"],
    prevenir: ["Avoid intense exertion until it normalizes"],
    escalar: ["If it drops below 90 %: emergency, tell the crew physician"] }),
  P({ id: 31, clave: "presion_limitrofe", sistema: "cardiovascular", nivel: "atencion", prueba_sugerida: "ortostatica", fuente: "pronam,news2",
    condicion: "Blood pressure ≥ 130/85 or systolic ≤ 100",
    ahora: ["Rest seated for 5 min and repeat the reading"],
    hoy: ["Measure blood pressure in the morning and at night", "Cut down on salt in today's meals"],
    prevenir: ["Daily aerobic exercise per the plan", "Sleep 7 h or more"],
    escalar: ["If it reaches 140/90, the systolic drops below 90 or there is dizziness"] }),
  P({ id: 32, clave: "tarjeta_fc", sistema: "cardiovascular", nivel: "atencion", prueba_sugerida: "remedicion", fuente: "news2",
    condicion: "Heart rate or HRV outside your normal",
    ahora: ["Sit down and breathe slowly for 5 min"], hoy: ["Hydration: at least 2.5 L", "Lower exercise intensity for 48 h if HRV stays low"],
    prevenir: ["Sleep 7 h or more", "Repeat the reading tomorrow while fasting"], escalar: ["If chest pain, palpitations or shortness of breath appear"] }),
  P({ id: 33, clave: "tarjeta_pa", sistema: "cardiovascular", nivel: "atencion", prueba_sugerida: "ortostatica", fuente: "pronam,news2",
    condicion: "Blood pressure outside your range", ahora: ["Rest seated for 5 min and repeat the reading"], hoy: ["Measure blood pressure morning and night"],
    prevenir: ["Aerobic exercise and little salt"], escalar: ["If it reaches 140/90 or the systolic drops below 90"] }),
  P({ id: 34, clave: "tarjeta_fr", sistema: "respiratorio", nivel: "atencion", prueba_sugerida: "remedicion", fuente: "news2",
    condicion: "Breathing outside 12–20", ahora: ["Repeat the reading at rest"], hoy: ["Measure breathing and SpO₂ every 4 h"],
    prevenir: ["Check the CO₂ in your module"], escalar: ["If there is shortness of breath"] }),
  P({ id: 35, clave: "tarjeta_temp", sistema: "respiratorio", nivel: "atencion", prueba_sugerida: "checkin", fuente: "news2,nasa_inmune",
    condicion: "Temperature or signs of infection", ahora: ["Log your symptoms in the check-in"], hoy: ["Measure your temperature every 6 h"],
    prevenir: ["Hand washing and surface cleaning"], escalar: ["If there is fever with 2 or more symptoms"] }),
  P({ id: 36, clave: "tarjeta_spo2", sistema: "respiratorio", nivel: "atencion", prueba_sugerida: "remedicion", fuente: "oms_oximetria,news2",
    condicion: "Low oxygenation", ahora: ["Repeat oximetry with a good signal"], hoy: ["Measure SpO₂ every 4 h"],
    prevenir: ["Check the CO₂ in your module"], escalar: ["If it drops below 90 %: emergency"] }),
  P({ id: 37, clave: "tarjeta_conciencia", sistema: "salud_mental", nivel: "atencion", prueba_sugerida: "checkin", fuente: "news2,nasa_sensoriomotor",
    condicion: "Dizziness or confusion", ahora: ["Sit or lie down until it passes"], hoy: ["Get up slowly, in two steps", "Do the orthostatic test"],
    prevenir: ["Hydration with electrolytes"], escalar: ["If confusion appears or you faint"] }),
  P({ id: 38, clave: "tarjeta_radiacion", sistema: "radiacion", nivel: "atencion", prueba_sugerida: null, fuente: "nasa3001,ochmo",
    condicion: "Radiation dose above usual", ahora: ["Keep the dosimeter on"], hoy: ["Prioritize tasks in areas with more shielding"],
    prevenir: ["Minimize non-essential EVAs"], escalar: ["If the ship alarm sounds or you exceed 80 % of a limit"] }),
  P({ id: 39, clave: "tarjeta_sueno", sistema: "sueno", nivel: "atencion", prueba_sugerida: "reaccion", fuente: "aasm,pvtb",
    condicion: "Short sleep, slow reaction or high fatigue", ahora: ["10-min break with slow breathing"], hoy: ["Go to bed 1 h earlier"],
    prevenir: ["Fixed sleep schedule of 7 h or more"], escalar: ["If the reaction stays slow or there are errors in critical tasks"] }),
  P({ id: 40, clave: "tarjeta_animo", sistema: "salud_mental", nivel: "atencion", prueba_sugerida: "who5", fuente: "who5,nasa_salud_mental",
    condicion: "Mood, stress or relationship with the crew outside normal", ahora: ["10-min guided breathing"],
    hoy: ["Answer the PHQ-9 in Tests", "Talk with the crew physician"], prevenir: ["Free time and rest in your routine"],
    escalar: ["If thoughts of harming yourself appear, tell the crew immediately"] }),
  P({ id: 41, clave: "tarjeta_vision", sistema: "vision", nivel: "atencion", prueba_sugerida: "amsler", fuente: "nasa_sans,amsler",
    condicion: "Blurred vision or headache", ahora: ["Rest your eyes for 10 min and do the Amsler grid"], hoy: ["Check your blood pressure and the CO₂ in your module"],
    prevenir: ["Log any vision changes every day"], escalar: ["If vision gets worse or the pain does not ease in 24 h"] }),
  P({ id: 42, clave: "tarjeta_huesos", sistema: "hueso_musculo", nivel: "atencion", prueba_sugerida: null, fuente: "nasa_osea",
    condicion: "Exercise below prescribed", ahora: ["Check whether the exercise equipment is available"], hoy: ["Complete your prescribed strength and cardio exercise"],
    prevenir: ["Calcium and vitamin D per the mission menu"], escalar: ["If you have been below prescribed for 5 days or there is bone pain"] }),
  P({ id: 43, clave: "tarjeta_cabina", sistema: "cabina", nivel: "atencion", prueba_sugerida: null, fuente: "nasa_ambiente",
    condicion: "Cabin environment out of range", ahora: ["Check the ventilation in your module"], hoy: ["Report the values to the flight engineer"],
    prevenir: ["Check CO₂, temperature and humidity daily"], escalar: ["If CO₂ exceeds 5,000 ppm or there are symptoms"] }),
  P({ id: 24, clave: "escalada", sistema: "general", nivel: "critico", prueba_sugerida: null, fuente: "Escalation to the crew physician",
    condicion: "Test with a worse result or reported alert",
    ahora: ["Stay at rest", "The crew physician has already been notified"],
    hoy: ["Follow their instructions"],
    prevenir: ["Repeat the tests they indicate"],
    escalar: ["If new symptoms appear, notify immediately"] }),
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
        resultado: { respuestas: resp, ...r }, interpretacion: `WHO-5: ${r.puntaje}/100 · screening, not diagnosis`,
        creada_en: isoDateTime(semana * 7, 9, 30),
      });
    }
    for (const tipo of ["phq9", "gad7"]) {
      const r = puntuarCuestionario(tipo, c[tipo]);
      out.push({
        id: id++, astronaut_id: a.id, tipo, fecha: isoDate(3), desenlace: null,
        resultado: { respuestas: c[tipo], ...r }, interpretacion: `Score ${r.puntaje} · screening, not diagnosis`,
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
    const hecho_en = isoDateTime(diasAtras, hora, Math.floor(rnd() * 50));
    const valor = construirValor({ prueba: PRUEBAS_POR_ID[prueba_id], respuestas, base: b, resultado, origen: a === 2 && prueba_id === "orina" ? "control" : "laptop", ahora: hecho_en });
    out.push({ id: `s-${a}-${prueba_id}-${diasAtras}`, astronaut_id: a, prueba_id, valor, nivel: resultado.nivel, hecho_en, desde_ficha: null, diasAtras, hora });
  };
  const vit = (a, diasAtras) => vitals.find((v) => v.astronaut_id === a && v.fecha === isoDate(diasAtras)) || {};
  const pad = (n) => String(n).padStart(2, "0");
  for (const a of ASTRONAUTS.map((x) => x.id)) {
    for (let d = 60; d >= 1; d -= 3) {
      const malo = a === 1 && d <= 8;
      const med = Math.round(278 + a * 4 + rnd() * 18 + (malo ? 55 + (8 - d) * 6 : 0));
      const lapsos = malo ? 3 + Math.round((8 - d) / 3) : Math.round(rnd() * 1.5);
      const tiempos = Array.from({ length: 40 }, (_, k) => (k < lapsos ? 360 + Math.round(rnd() * 140) : Math.round(med - 40 + rnd() * 70)));
      fila(a, "pvt", d, 7, { pvt: { mediana_ms: med, lapsos, falsas: Math.round(rnd()), estimulos: 40, tiempos } });
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
