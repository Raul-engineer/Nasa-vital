import { COLOR_GRAVEDAD, ETIQUETA_GRAVEDAD } from "./analysis.js";
import { inferirTipo, leerNota } from "./motivos.js";
import { respuestasComoObjeto } from "./respuestas.js";

export const NIVELES = ["ok", "info", "moderado", "urgente", "critico"];
export const RANGO_NIVEL = Object.fromEntries(NIVELES.map((n, i) => [n, i]));
export const ETIQUETA_NIVEL = { ...ETIQUETA_GRAVEDAD, resuelto: "Resolved" };
export const COLOR_NIVEL = { ...COLOR_GRAVEDAD, resuelto: COLOR_GRAVEDAD.ok };
export const NOTA_BOTIQUIN = "Confirm the dose with the flight surgeon or the crew medical officer.";
export const TEXTO_NO_LIBRE = "Available on board: prescribed by the flight surgeon";
export const MOTIVOS_NO_PUEDO = [
  { id: "equipo", texto: "I don't have the equipment" },
  { id: "peor", texto: "I feel worse" },
  { id: "otro", texto: "Other" },
];
export const RESPUESTAS = { si: "Yes", no: "No", nose: "I don't know" };
export const MMHG_POR_PPM = 760 / 1e6;
export const LIMITE_CO2_MMHG = 3;
export const CO2_ALTO_MMHG = 4.5;

export const mayorNivel = (...ns) => ns.filter((n) => n in RANGO_NIVEL).reduce((a, b) => (RANGO_NIVEL[b] > RANGO_NIVEL[a] ? b : a), "ok");
export function gravedadesConFichas(gravedades = {}, eventos = []) {
  const g = { ...gravedades };
  for (const e of eventos || []) if (!e.cerrado_en && e.clave in FICHAS_CLAVES_SET && e.nivel in RANGO_NIVEL) g[e.clave] = mayorNivel(g[e.clave] || "ok", e.nivel);
  return g;
}
const FICHAS_CLAVES_SET = { fc: 1, pa: 1, fr: 1, spo2: 1, temp: 1, conciencia: 1, sueno: 1, animo: 1, radiacion: 1, vision: 1, huesos: 1, cabina: 1 };
export const menorNivel =(a, b) => (RANGO_NIVEL[a] <= RANGO_NIVEL[b] ? a : b);
export const subirNivel = (n) => NIVELES[Math.min(NIVELES.length - 1, Math.max(RANGO_NIVEL.moderado, (RANGO_NIVEL[n] ?? 0) + 1))];
export const mmhg = (ppm) => (ppm == null || !Number.isFinite(Number(ppm)) ? null : Math.round(Number(ppm) * MMHG_POR_PPM * 10) / 10);

const minuscula = (t) => (t.length > 1 && t[1] === t[1].toLowerCase() ? t[0].toLowerCase() + t.slice(1) : t);
const num = (x) => (x == null || x === "" || Number.isNaN(Number(x)) ? null : Number(x));
const f1 = (x) => Number(x).toLocaleString("en-US", { maximumFractionDigits: 1 });

const P = (id, texto, si = {}, no = {}, extra = {}) => ({ id, texto, si, no, ...extra });
const C = (id, nombre, porque, peso, fuente) => ({ id, nombre, porque, peso, fuente });
const S = (id, texto, obligatorio = false, minutos = null, extra = {}) => ({ id, texto, obligatorio, minutos, tipo: extra.tipo || (extra.abrir ? "otro" : inferirTipo(texto)), ...extra });
const M = (nombre, paquete, uso, libre = false, extra = {}) => ({ nombre, paquete, uso, libre, ...extra });
const E = (texto, nivel) => ({ texto, nivel });

export const TITULOS = {
  fc: "Heart rate", pa: "Blood pressure", fr: "Respiratory rate", spo2: "SpO₂", temp: "Temperature", conciencia: "Consciousness and dizziness",
  sueno: "Sleep and alertness", animo: "Mood, stress and crew", radiacion: "Radiation", vision: "Vision (SANS)", huesos: "Bones and muscles", cabina: "Cabin",
};
export const CATEGORIA_FICHA = {
  fc: "Heart and breathing", pa: "Heart and breathing", fr: "Heart and breathing", spo2: "Heart and breathing",
  temp: "Mind and defenses", conciencia: "Mind and defenses", sueno: "Mind and defenses", animo: "Mind and defenses",
  radiacion: "Space effects", vision: "Space effects", huesos: "Space effects", cabina: "Space effects",
};

const abrir = (clave) => [S(`abrir.${clave}`, `Open the ${TITULOS[clave]} card`, false, null, { abrir: clave })];
const esfuerzo = (ctx) => ctx.actividad === "ejercicio" || ctx.actividad === "recuperacion";
const L = (ctx) => ctx.lectura || {};
const CI = (ctx) => ctx.ci || {};

const PARACETAMOL = M("Acetaminophen 325 mg", "Convenience", "Pain or discomfort", true);
const IBUPROFENO = M("Ibuprofen 400 mg", "Convenience", "Pain", true, { grupo: "aine" });

const FC = {
  clave: "fc", titulo: TITULOS.fc,
  peligro: [
    { id: "pecho", texto: "Chest pain or pressure" },
    { id: "aire", texto: "Shortness of breath" },
    { id: "desmayo", texto: "Fainting or near fainting" },
    { id: "fc_extrema", texto: "HR of 131 or more, or 40 or less, at rest", dato: (c) => !esfuerzo(c) && num(L(c).fc) != null && (L(c).fc >= 131 || L(c).fc <= 40) },
  ],
  preguntas: [
    P("p1", "Do you have chest pain, shortness of breath or did you feel like you were going to faint?", {}, {}, { peligro: true, marca: ["dolor_pecho", "organo_blanco", "desmayo"] }),
    P("p2", "Did you exercise or exert yourself in the last 15 minutes?", { ejercicio: 4 }),
    P("p3", "Do you feel nervous, scared or very stressed?", { estres: 3 }),
    P("p4", "Did you sleep less than 6 hours last night?", { sueno: 2 }),
    P("p5", "Did you take caffeine, modafinil or a decongestant today?", { estimulante: 3 }),
    P("p6", "Do you have a fever, chills or feel sick?", { infeccion: 3 }),
  ],
  causas: [
    C("ejercicio", "Recent exertion", "Exertion raises HR; at rest it comes down on its own within minutes.", 2, "news2"),
    C("estres", "Stress or fright", "Stress activates the nervous system and speeds up the heart.", 2, "news2,nasa_salud_mental"),
    C("estimulante", "Caffeine or a stimulant", "Caffeine, modafinil and pseudoephedrine can raise HR.", 1, "nasa_botiquin"),
    C("sueno", "Little sleep", "Little sleep raises resting HR and lowers HRV.", 1, "aasm"),
    C("infeccion", "Infection or fever", "Fever raises HR by about 10 bpm per degree.", 1, "news2,nasa_inmune"),
    C("deshidratacion", "Little water", "With less blood volume the heart beats faster.", 1, "esc2018"),
    C("arritmia", "Irregular rhythm", "An irregular pulse needs review by the flight surgeon.", 0, "esc2018"),
  ],
  planes: {
    estres: [
      S("fc.reposo", "Sit or stay still for 5 min with slow breathing", true),
      S("fc.agua", "Drink water"),
      S("fc.cafeina", "No caffeine for 6 hours"),
      S("fc.remedir", "Measure again in 10 min", true, 10, { remedir: true }),
    ],
    estimulante: "estres",
    sueno: "estres",
    ejercicio: [
      S("fc.ej.pausa", "Stop exercising and stay at rest", true),
      S("fc.ej.agua", "Drink water"),
      S("fc.ej.remedir", "Measure again at rest in 15 min", true, 15, { remedir: true }),
    ],
    infeccion: abrir("temp"),
    deshidratacion: [
      S("fc.agua.sal", "Drink water with salt or electrolytes", true),
      S("fc.agua.nota", "Write down how much you drank"),
      S("fc.agua.remedir", "Measure again in 30 min", true, 30, { remedir: true }),
    ],
    arritmia: [
      S("fc.arr.reposo", "Stay at rest", true),
      S("fc.arr.aviso", "Notify the flight surgeon", true, 10),
      S("fc.arr.remedir", "Measure again in 10 min", true, 10, { remedir: true }),
    ],
  },
  ajuste: (c, pts) => {
    if (c.pulsoIrregular) pts.arritmia += 10;
  },
  sinPrimeraLinea: "No first-line medication.",
  botiquin: [M("Metoprolol", "Oral · cardiac", "HR control")],
  avisosBotiquin: ["Caffeine (Vivarin 200 mg), modafinil 200 mg and pseudoephedrine can raise HR."],
  remedir: { minutos: 10, cierra: "Back in your personal range" },
  escalar: [E("Still above your baseline after 10 min at rest", "urgente"), E("Irregular pulse", "urgente")],
  fuentes: ["news2", "esc2018", "nasa_botiquin"],
};

const PA_ALTA = {
  peligro: [{ id: "organo", texto: "BP of 180/110 or more with chest pain, shortness of breath, new blurred vision, weakness or difficulty speaking" }],
  preguntas: [
    P("a1", "Do you have chest pain, shortness of breath, new blurred vision, weakness or difficulty speaking?", {}, {}, { peligro: true, marca: ["organo_blanco", "dolor_pecho"] }),
    P("a2", "Do you have pain anywhere right now?", { dolor: 3 }),
    P("a3", "Are you stressed or did you just go through a tense situation?", { estres: 3 }),
    P("a4", "Did you take pseudoephedrine, caffeine or another medication today?", { medicamento: 3 }),
    P("a5", "Was the cuff on correctly and were you still while measuring?", {}, { medicion: 3 }),
  ],
  causas: [
    C("estres", "Stress", "Stress raises blood pressure for minutes or hours.", 2, "pronam"),
    C("dolor", "Pain", "Pain raises blood pressure; it comes down when treated.", 1, "pronam"),
    C("medicamento", "Medication or caffeine", "Pseudoephedrine and caffeine raise blood pressure.", 1, "pronam,nasa_botiquin"),
    C("medicion", "Measurement error", "A badly placed cuff or moving gives high readings.", 1, "pronam"),
    C("hipertension", "Sustained high blood pressure", "If it stays high over several well-taken readings, it is hypertension.", 1, "pronam"),
  ],
  planes: {
    estres: [
      S("pa.a.sentar", "Sit for 5 min without talking", true),
      S("pa.a.tres", "Measure 3 times 1 to 2 min apart and average the last 2", true, 10),
      S("pa.a.causa", "Treat the cause: analgesic if it is pain, slow breathing if it is stress, stop the decongestant"),
      S("pa.a.remedir", "Measure again in 30 min", true, 30, { remedir: true }),
    ],
    dolor: "estres", medicamento: "estres", medicion: "estres", hipertension: "estres",
  },
  botiquin: [PARACETAMOL, IBUPROFENO, M("Lisinopril", "Oral · cardiac", "High blood pressure"), M("Metoprolol", "Oral · cardiac", "High blood pressure and HR")],
  avisosBotiquin: ["PRONAM: do not give antihypertensives under the tongue. In an urgency without organ damage, lower the pressure gradually over 24 to 48 hours."],
  remedir: { minutos: 30, cierra: "Back below 130/85" },
  escalar: [E("180/110 or more without symptoms", "urgente"), E("180/110 or more with symptoms", "critico")],
  fuentes: ["pronam", "nasa_botiquin"],
};

const PA_BAJA = {
  peligro: [
    { id: "desmayo", texto: "Fainting", nivel: "urgente" },
    { id: "confusion", texto: "Confusion" },
    { id: "piel", texto: "Cold, sweaty skin" },
    { id: "sis90", texto: "Systolic of 90 or less", nivel: "urgente", sigue: true, dato: (c) => num(L(c).sistolica) != null && L(c).sistolica <= 90 },
  ],
  preguntas: [
    P("b1", "Did you feel like you were going to faint or did you lose consciousness?", {}, {}, { peligro: true, nivel: "urgente", marca: ["desmayo"] }),
    P("b2", "Did you just get up, turn or change position?", { ortostatica: 3 }, { ortostatica: -2 }),
    P("b3", "Did you just go through a fright, strong pain or intense stress?", { vasovagal: 3 }, { vasovagal: -1 }, { marca: ["susto"] }),
    P("b4", "Today did you drink less water than usual, vomit or sweat a lot?", { deshidratacion: 3 }, { deshidratacion: -1 }, { marca: ["poca_agua"] }),
    P("b5", "Did you take any medication in the last 6 hours?", { medicamento: 2 }, { medicamento: -2 }),
  ],
  causas: [
    C("vasovagal", "Vasovagal reaction", "Fainting from a fright, pain or fear; the most common kind and almost always benign.", 2, "esc2018"),
    C("deshidratacion", "Dehydration", "With little water, blood volume and blood pressure drop.", 2, "esc2018"),
    C("ortostatica", "Change of position", "When you stand up blood pools in the legs; in microgravity it hardly happens.", 1, "esc2018,ortostatica"),
    C("medicamento", "Medication", "Some medications lower blood pressure.", 1, "esc2018"),
    C("infeccion", "Infection", "An infection can lower blood pressure.", 1, "news2,esc2018"),
  ],
  planes: {
    vasovagal: [
      S("pa.b.quieto", "Stay still", true),
      S("pa.b.piernas", "Cross your legs and squeeze your muscles for 30 seconds (counter-pressure maneuver)"),
      S("pa.b.agua", "Drink water"),
      S("pa.b.remedir", "Measure again in 10 min", true, 10, { remedir: true }),
    ],
    deshidratacion: [
      S("pa.d.sal", "Drink water with salt or electrolytes", true),
      S("pa.d.nota", "Write down how much you drank"),
      S("pa.d.remedir", "Measure again in 30 min", true, 30, { remedir: true }),
    ],
    ortostatica: [
      S("pa.o.sentar", "Sit or lie down", true),
      S("pa.o.piernas", "Legs up"),
      S("pa.o.sal", "Water and salt"),
      S("pa.o.prueba", "Do the orthostatic test", true, 15, { href: "/pruebas?t=ortostatica" }),
    ],
    medicamento: [
      S("pa.m.anotar", "Write down which one and the time", true),
      S("pa.m.repetir", "Do not repeat the dose"),
      S("pa.m.aviso", "Notify the flight surgeon"),
    ],
    infeccion: abrir("temp"),
  },
  ajuste: (c, pts) => {
    if (["luna", "marte", "regreso"].includes(c.fase)) pts.ortostatica += 3;
  },
  sinPrimeraLinea: "None; the plan is fluids and posture.",
  botiquin: [],
  remedir: { minutos: 10, cierra: "Systolic rises above 100" },
  escalar: [E("Systolic of 90 or less that does not rise in 15 min, or fainting", "urgente"), E("Fainting with injury, chest pain or shortness of breath", "critico")],
  fuentes: ["esc2018", "ortostatica", "news2"],
};

const FR = {
  clave: "fr", titulo: TITULOS.fr,
  peligro: [
    { id: "fr_extrema", texto: "RR of 25 or more, or 8 or less", dato: (c) => num(L(c).frec_resp) != null && (L(c).frec_resp >= 25 || L(c).frec_resp <= 8) },
    { id: "spo2_baja", texto: "SpO₂ dropping at the same time", dato: (c) => num(L(c).spo2) != null && L(c).spo2 < 94 && num(L(c).frec_resp) >= 21 },
    { id: "labios", texto: "Blue lips" },
    { id: "pecho", texto: "Chest pain" },
  ],
  preguntas: [
    P("p1", "Do you have chest pain or blue lips?", {}, {}, { peligro: true, marca: ["dolor_pecho", "organo_blanco"] }),
    P("p2", "Did you exercise recently?", { ejercicio: 4 }),
    P("p3", "Do you feel anxious or have tingling in your hands or mouth?", { ansiedad: 3 }),
    P("p4", "Do other crew members have a headache or breathe fast?", { co2: 4 }, {}, { marca: ["sintomas_tripulacion"] }),
    P("p5", "Do you have a fever or cough?", { infeccion: 3 }),
    P("p6", "Do you wheeze when breathing or have a tight chest?", { broncoespasmo: 3 }),
  ],
  causas: [
    C("ejercicio", "Recent exertion", "Breathing fast after exercise is normal and comes down at rest.", 2, "news2"),
    C("ansiedad", "Anxiety", "Anxiety speeds up breathing and causes tingling in the hands and mouth.", 2, "dsm5"),
    C("co2", "High CO₂ in the cabin", "With more CO₂ the body breathes faster.", 1, "ochmo_co2"),
    C("infeccion", "Respiratory infection", "It is the most common infection in flight.", 1, "crucian2016"),
    C("broncoespasmo", "Narrowed airways", "Wheezing and a tight chest point to narrowed airways.", 0, "nasa_botiquin"),
  ],
  planes: {
    ansiedad: [
      S("fr.resp", "Breathe slowly, 4 seconds in and 6 out, for 3 min", true, 3),
      S("fr.co2", "Check the cabin CO₂"),
      S("fr.remedir", "Measure again in 10 min", true, 10, { remedir: true }),
    ],
    co2: abrir("cabina"),
    ejercicio: [
      S("fr.ej.pausa", "Stop exercising and stay at rest", true),
      S("fr.ej.remedir", "Measure again at rest in 15 min", true, 15, { remedir: true }),
    ],
    infeccion: abrir("temp"),
    broncoespasmo: [
      S("fr.b.sentar", "Sit upright", true),
      S("fr.b.aviso", "Notify the flight surgeon about the rescue inhaler", true, 5),
      S("fr.b.remedir", "Measure again in 10 min", true, 10, { remedir: true }),
    ],
  },
  botiquin: [
    M("Albuterol inhaler", "Topical and injectable · respiratory", "Rescue if wheezing"),
    M("Fluticasone and salmeterol", "Topical and injectable · respiratory", "Narrowed airways"),
    M("Benzonatate", "Oral", "Cough"),
    M("Dextromethorphan", "Convenience", "Cough", true),
  ],
  remedir: { minutos: 10, cierra: "Back to 12–20 per minute" },
  escalar: [E("Does not come down in 10 min, or SpO₂ of 93 or less", "urgente")],
  fuentes: ["news2", "ochmo_co2", "crucian2016", "nasa_botiquin"],
};

const SPO2 = {
  clave: "spo2", titulo: TITULOS.spo2,
  nota: "A watch reading below 90 % is treated as an emergency until the finger oximeter confirms or rules it out.",
  peligro: [
    { id: "sp90", texto: "SpO₂ below 90 %", sigue: true, dato: (c) => num(L(c).spo2) != null && L(c).spo2 < 90 && !(num(c.oximetro) >= 90) },
    { id: "conf", texto: "Low SpO₂ with confusion or shortness of breath", dato: (c) => num(L(c).spo2) != null && L(c).spo2 < 94 && !!CI(c).confusion },
  ],
  preguntas: [
    P("p1", "Are you short of breath or confused?", {}, {}, { peligro: true, marca: ["falta_aire"] }),
    P("p2", "Does the reading come from the watch and were you moving?", { falsa: 4 }),
    P("p3", "Are your hands cold?", { falsa: 2 }),
    P("p4", "Does another crew member have low SpO₂ or is the cabin showing an oxygen or pressure alert?", { cabina: 5 }),
    P("p5", "Do you have a cough, fever or pain when breathing?", { pulmon: 3 }),
  ],
  causas: [
    C("falsa", "False watch reading", "Watches measure SpO₂ worse than a finger oximeter, especially when it drops.", 3, "hearn2023"),
    C("cabina", "Cabin oxygen or pressure", "An oxygen or pressure failure affects the whole crew.", 1, "nasa_ambiente"),
    C("pulmon", "Lung problem", "An infection or a lung problem lowers oxygen.", 1, "oms_oximetria,crucian2016"),
  ],
  planes: {
    falsa: [
      S("sp.calentar", "Warm your hands and stay still for 1 min", true),
      S("sp.dedo", "Measure with the finger oximeter", true, 5, { remedir: true }),
      S("sp.seguir", "If confirmed, follow the cabin or lung plan"),
    ],
    cabina: [
      S("sp.c.alarma", "Alarm to the whole crew", true),
      S("sp.c.mascara", "Put on the oxygen mask", true),
      S("sp.c.proc", "Follow the ship procedure", true),
    ],
    pulmon: [
      S("sp.p.sentar", "Sit upright", true),
      S("sp.p.aviso", "Notify the flight surgeon", true, 5),
      S("sp.p.remedir", "Measure again in 5 min", true, 5, { remedir: true }),
    ],
  },
  sinPrimeraLinea: "No medication; confirm the reading first.",
  botiquin: [],
  remedir: { minutos: 5, cierra: "95 % or more with the finger oximeter" },
  escalar: [E("Below 90 % confirmed", "critico"), E("Between 90 and 93 % that does not rise in 5 min", "urgente")],
  fuentes: ["oms_oximetria", "news2", "hearn2023"],
};

const TEMP = {
  clave: "temp", titulo: TITULOS.temp,
  contexto: "On long missions resting temperature rises about 1 °C; it is compared with your in-flight baseline.",
  contextoFuente: "stahn2017",
  peligro: [
    { id: "alta", texto: "Temperature of 39.1 °C or more", dato: (c) => num(L(c).temperatura) >= 39.1 },
    { id: "baja", texto: "Temperature of 35.0 °C or less", dato: (c) => num(L(c).temperatura) != null && L(c).temperatura <= 35.0 },
    { id: "meningea", texto: "Fever with confusion, stiff neck, skin spots that do not fade when pressed, or low blood pressure" },
  ],
  preguntas: [
    P("p1", "Do you have a stiff neck, confusion or spots that do not fade when pressed?", {}, {}, { peligro: true }),
    P("p2", "Did you exercise in the last hour?", { ejercicio: 4 }, {}, { marca: ["ejercicio"] }),
    P("p3", "Do you have a cough, sore throat or stuffy nose?", { respiratoria: 3 }),
    P("p4", "Do you have burning when urinating or need to urinate more often?", { urinaria: 3 }),
    P("p5", "Do you have a wound, pimples, blisters or a new rash on your skin or mouth?", { piel: 3 }, {}, { marca: ["piel"] }),
    P("p6", "Does the cabin feel hot or humid?", { cabina: 2 }),
  ],
  causas: [
    C("ejercicio", "Heat from exercise", "In flight the body takes longer to release the heat from exercise.", 2, "stahn2017"),
    C("respiratoria", "Respiratory infection", "The most common in flight: 0.97 per flight year.", 2, "crucian2016"),
    C("piel", "Skin or herpes", "Rashes 1.12 per flight year; herpes reactivated in 61 % on the ISS.", 2, "crucian2016,rooney2019"),
    C("urinaria", "Urinary infection", "Burning and frequent urge to urinate.", 1, "crucian2016"),
    C("cabina", "Hot cabin", "Outside the NASA range of 18 to 27 °C the body heats up.", 1, "nasa3001"),
  ],
  planes: {
    ejercicio: [
      S("t.ej.pausa", "Stop exercising and move near an air vent", true),
      S("t.ej.agua", "Drink water"),
      S("t.ej.cabina", "Check the cabin temperature (NASA range 18 to 27 °C)"),
      S("t.ej.remedir", "Measure again in 20 min", true, 20, { remedir: true }),
    ],
    cabina: "ejercicio",
    respiratoria: [
      S("t.inf.cada4", "Measure the temperature every 4 hours and write it down", true, 240, { remedir: true }),
      S("t.inf.paracetamol", "Acetaminophen if you feel unwell"),
      S("t.inf.agua", "Drink more water"),
      S("t.inf.cubrebocas", "Face mask and hand washing"),
      S("t.inf.reporte", "Send a report to the flight surgeon", true, 60),
    ],
    urinaria: "respiratoria",
    piel: "respiratoria",
  },
  botiquin: [
    PARACETAMOL, IBUPROFENO,
    M("Amoxicillin", "Oral · antibiotics", "Infection", false, { grupo: "penicilina" }),
    M("Azithromycin", "Oral · antibiotics", "Infection"),
    M("Doxycycline", "Oral · antibiotics", "Infection"),
    M("Levofloxacin", "Oral · antibiotics", "Infection"),
    M("Nitrofurantoin", "Oral · antibiotics", "Urinary tract"),
    M("Trimethoprim with sulfamethoxazole", "Oral · antibiotics", "Infection"),
    M("Valacyclovir", "Oral", "Herpes"),
    M("Hydrocortisone 1 %", "Convenience", "Itchy rash", true),
    M("Loratadine", "Convenience", "Itchy rash", true),
    M("Fexofenadine", "Convenience", "Itchy rash", true),
  ],
  remedir: { minutos: 20, cierra: "Below 37.5 °C or within your baseline" },
  escalar: [E("1 °C or more above your in-flight baseline for more than 24 hours", "urgente"), E("Fever with high HR or low blood pressure", "urgente")],
  fuentes: ["news2", "stahn2017", "crucian2016", "rooney2019", "nasa_botiquin"],
};

const CONCIENCIA = {
  clave: "conciencia", titulo: TITULOS.conciencia,
  limiteRespuestaMin: 2,
  peligro: [
    { id: "no_responde", texto: "Unresponsive" },
    { id: "convulsion", texto: "Seizure" },
    { id: "golpe", texto: "Head injury with vomiting or drowsiness" },
    { id: "lado", texto: "Weakness on one side of the body" },
    { id: "conf_spo2", texto: "Confusion with low SpO₂", dato: (c) => !!CI(c).confusion && num(L(c).spo2) != null && L(c).spo2 < 94 },
  ],
  nota: "If you do not answer the survey within 2 min, it is treated as an emergency.",
  preguntas: [
    P("p1", "Did you hit your head?", { golpe: 5 }, {}, { marca: ["golpe"] }),
    P("p2", "Did you take zolpidem, zaleplon or promethazine in the last 8 hours?", { medicamento: 4 }, {}, { marca: ["sedante"] }),
    P("p3", "Have you been in space less than 3 days and do you have nausea or dizziness when moving your head?", { mareo: 4 }),
    P("p4", "Do other crew members have a headache or feel slow?", { cabina: 4 }, {}, { marca: ["sintomas_tripulacion"] }),
    P("p5", "Did you sleep less than 5 hours?", { sueno: 2 }),
  ],
  causas: [
    C("mareo", "Space motion sickness", "It happens to 50–80 % on arrival in space.", 2, "nasa_sensoriomotor,davis_mareo"),
    C("medicamento", "Medication that causes drowsiness", "Zolpidem, zaleplon and promethazine cause drowsiness and slowness.", 1, "nasa_botiquin,cowings"),
    C("sueno", "Little sleep", "Little sleep lowers alertness and reaction.", 1, "pvtb"),
    C("cabina", "Cabin CO₂", "High CO₂ causes headache and slowness.", 1, "ochmo_co2"),
    C("golpe", "Head injury", "A blow can cause confusion hours later.", 0, "news2"),
    C("presion", "Low blood pressure", "With low blood pressure less blood reaches the brain.", 0, "esc2018"),
  ],
  planes: {
    mareo: [
      S("cc.vista", "Hold your head still and fix your gaze on one point", true),
      S("cc.agua", "Sip water"),
      S("cc.oficial", "Notify the medical officer about the medication", true, 15),
      S("cc.remedir", "Reassess in 2 hours", false, 120, { remedir: true }),
    ],
    medicamento: [
      S("cc.m.tareas", "No critical tasks until the effect wears off", true),
      S("cc.m.companero", "Have another crew member confirm how you are", true, 15),
      S("cc.m.pvt", "3-min reaction test once fully awake", false, null, { href: "/pruebas?t=reaccion" }),
    ],
    sueno: "medicamento",
    golpe: [
      S("cc.g.acompanado", "Stay with someone", true),
      S("cc.g.oficial", "Notify the medical officer now", true, 5),
      S("cc.g.remedir", "Reassess in 30 min", true, 30, { remedir: true }),
    ],
    cabina: abrir("cabina"),
    presion: abrir("pa"),
  },
  ajuste: (c, pts) => {
    if (num(L(c).sistolica) != null && L(c).sistolica <= 100) pts.presion += 3;
  },
  botiquin: [
    M("Promethazine 25 mg", "Oral and injectable", "NASA's main treatment for space motion sickness; given when symptoms appear"),
    M("Meclizine", "Oral", "Dizziness"),
    M("Ondansetron", "Oral", "Nausea"),
    M("Flumazenil", "Emergency", "Medical officer only"),
    M("Naloxone", "Emergency", "Medical officer only"),
  ],
  avisosBotiquin: ["Promethazine causes drowsiness and lowers performance."],
  remedir: { minutos: 30, cierra: "Alert and not dizzy" },
  escalar: [E("Confusion that does not improve in 30 min", "urgente"), E("Head injury with symptoms", "critico")],
  fuentes: ["news2", "nasa_sensoriomotor", "davis_mareo", "cowings", "prometazina_amhp2025", "nasa_botiquin", "wotring2015"],
};

const SUENO = {
  clave: "sueno", titulo: TITULOS.sueno,
  contexto: "NASA schedules 8.5 hours of sleep; the actual average on the ISS was about 6 hours.",
  contextoFuente: "barger2014",
  peligro: [
    { id: "dormido", texto: "Falling asleep during a critical task" },
    { id: "lapsos", texto: "3 or more lapses (355 ms or more) on the reaction test before a spacewalk or maneuver", dato: (c) => num(c.lapsos) >= 3 && !!c.tareaCritica },
  ],
  preguntas: [
    P("p1", "Did your schedule change in the last 3 days (docking, spacewalk, shift)?", { horario: 4 }, {}, { marca: ["horario"] }),
    P("p2", "Was there noise, light or heat in your rest area?", { ambiente: 3 }, {}, { marca: ["ambiente"] }),
    P("p3", "Were you worried or thinking before going to sleep?", { estres: 3 }),
    P("p4", "Did you take caffeine after noon, or modafinil?", { estimulante: 3 }),
    P("p5", "Did a headache or back pain wake you up?", { dolor: 2 }),
    P("p6", "Did you sleep badly even though your area was fine (no noise, light or heat) 3 or more nights this week?", { insomnio: 3 }, {}, { requiere: { p2: "no" } }),
  ],
  causas: [
    C("horario", "Schedule change", "Shift changes move your body clock.", 2, "barger2014"),
    C("ambiente", "Rest environment", "Noise, light and heat break up sleep on the spacecraft.", 2, "ochmo_tb041"),
    C("estres", "Worry", "Thinking or worrying when you lie down delays sleep.", 1, "dsm5"),
    C("estimulante", "Caffeine or modafinil", "Caffeine stays active for several hours.", 1, "barger2014"),
    C("dolor", "Pain", "A headache or back pain wakes you up.", 0, "barger2014"),
    C("insomnio", "Possible insomnia", "It is only considered insomnia when you sleep badly under good sleeping conditions.", 0, "dsm5"),
  ],
  planes: {
    horario: [
      S("s.lentes", "One hour before sleep, blue-light-blocking glasses and warm light", true),
      S("s.antifaz", "Eye mask and earplugs"),
      S("s.zona", "Check the temperature and CO₂ in your area"),
      S("s.cafeina", "No caffeine 6 hours before sleep"),
      S("s.despertar", "On waking, bright blue light and a 3-min reaction test", true, null, { remedir: true, href: "/pruebas?t=reaccion" }),
    ],
    ambiente: "horario", estres: "horario", estimulante: "horario", dolor: "horario",
    insomnio: [
      S("s.lentes", "One hour before sleep, blue-light-blocking glasses and warm light", true),
      S("s.antifaz", "Eye mask and earplugs"),
      S("s.zona", "Check the temperature and CO₂ in your area"),
      S("s.cafeina", "No caffeine 6 hours before sleep"),
      S("s.despertar", "On waking, bright blue light and a 3-min reaction test", true, null, { remedir: true, href: "/pruebas?t=reaccion" }),
      S("s.insomnio", "Notify the flight surgeon: possible insomnia", true),
    ],
  },
  botiquin: [
    M("Melatonin 3 mg", "Convenience", "Sleep", true),
    M("Zaleplon 10 mg", "Convenience", "Sleep", true, { advertencia: "A notice is sent if 2 or more crew members take it the same night." }),
    M("Zolpidem 5 mg", "Convenience", "Sleep", true, { advertencia: "A notice is sent if 2 or more crew members take it the same night." }),
    M("Caffeine 200 mg", "Convenience", "Alertness", true),
    M("Modafinil 200 mg", "Oral", "Alertness"),
  ],
  remedir: { minutos: null, cierra: "Reaction within your normal on the 3-min test" },
  escalar: [E("3 nights in a row below your baseline", "urgente"), E("Lapses before a critical task", "urgente")],
  fuentes: ["aasm", "pvtb", "barger2014", "dsm5", "ochmo_tb041", "wotring2015", "nasa_botiquin"],
};

const ANIMO = {
  clave: "animo", titulo: TITULOS.animo,
  contexto: "Daily WHO-5 (52 % or less = low well-being). Weekly PHQ-9 and GAD-7 (10 or more = moderate, 15 or more = high). They are screening, never diagnosis.",
  contextoFuente: "who5,phq9,gad7",
  peligro: [{ id: "phq9", texto: "Any answer other than 0 on question 9 of the PHQ-9", conductual: true, dato: (c) => num(c.phq9Item9) > 0 }],
  preguntas: [
    P("p1", "Did you sleep badly 2 or more nights this week?", { sueno: 3 }),
    P("p2", "Did you have a conflict or tension with someone on the crew or on Earth?", { relaciones: 3 }),
    P("p3", "Are you worried about your family or about something on Earth?", { familia: 3 }),
    P("p4", "Do you feel you have too much work or that the days are monotonous?", { carga: 3 }),
    P("p5", "Do you feel fear or nerves about something in the mission?", { ansiedad: 3 }, {}, { marca: ["ansiedad"] }),
    P("p6", "Did you start a new medication in the last 2 weeks (prednisone, antibiotic, modafinil, inhaler, sleeping pill)?", { medicamento: 4 }, {}, { marca: ["medicamento_nuevo"] }),
    P("p7", "Did you receive bad news or lose someone recently?", { duelo: 4 }, {}, { marca: ["mala_noticia"] }),
    P("p8", "Did you go through an emergency or a bad fright on board in the last month?", { estres_agudo: 4 }, {}, { marca: ["emergencia_bordo"] }),
    P("p9", "Do you suddenly get a very strong fear with a racing heart or shortness of breath?", { panico: 3 }, {}, { marca: ["panico"] }),
  ],
  causas: [
    C("sueno", "Poor sleep", "Sleeping badly lowers your mood the next day.", 1, "basner2014"),
    C("relaciones", "Tension with others", "In an isolated group, conflicts weigh more.", 1, "nasa_salud_mental"),
    C("familia", "Worry about family", "Distance from family is a frequent stress on long missions.", 1, "nasa_salud_mental"),
    C("carga", "Workload or monotony", "Too much work or identical days wear down your mood.", 1, "nasa_salud_mental"),
    C("ansiedad", "Nerves about the mission", "Fear about something in the mission raises stress.", 1, "gad7"),
    C("medicamento", "Medication", "Before thinking of a disorder, a medication is ruled out: stimulants, steroids, antibiotics and salbutamol (the inhaler's albuterol).", 0, "dsm5"),
    C("duelo", "Grief", "A recent loss explains the low mood; it is treated as grief.", 0, "dsm5"),
    C("estres_agudo", "Stress after an emergency", "After an emergency it is common to sleep badly or be easily startled for a few weeks.", 0, "dsm5"),
    C("panico", "Panic attack", "Sudden strong fear with a racing heart; the heart and lungs are ruled out first.", 0, "dsm5"),
  ],
  planes: {
    sueno: [
      S("an.conferencia", "Ask for a private psychological conference", true),
      S("an.familia", "Ask for a private call with your family"),
      S("an.ejercicio", "Complete the day's exercise"),
      S("an.libre", "Some free time: music, a movie or looking at Earth"),
      S("an.resp", "3 min of slow breathing if there is anxiety", false, 3),
      S("an.who5", "Repeat the WHO-5 in 3 days", true, 4320, { remedir: true, href: "/pruebas?t=who5" }),
    ],
    relaciones: "sueno", familia: "sueno", carga: "sueno", ansiedad: "sueno",
    medicamento: [
      S("an.m.anotar", "Write down the medication and since when", true),
      S("an.m.aviso", "Notify the flight surgeon to consider changing it", true, 60),
      S("an.who5", "Repeat the WHO-5 in 3 days", true, 4320, { remedir: true, href: "/pruebas?t=who5" }),
    ],
    duelo: [
      S("an.d.familia", "Private call with your family", true),
      S("an.d.conferencia", "Private psychological conference", true),
      S("an.d.carga", "Lower the workload that day if possible"),
      S("an.d.revisar", "Review in 1 week", false, 10080, { remedir: true }),
    ],
    estres_agudo: [
      S("an.e.chequeo", "Mood and sleep check for the whole crew at 3 days, 2 weeks and 1 month"),
      S("an.e.conferencia", "Private conference if there are intrusive memories or startling", true),
    ],
    panico: [
      S("an.p.companero", "Have a crewmate stay with you", true),
      S("an.p.resp", "Slow 4-6 breathing for 3 min", true, 3),
      S("an.p.medir", "Measure HR, RR and SpO₂ again", true, 5, { remedir: true }),
      S("an.p.emergencia", "If there is chest pain or SpO₂ drops, emergency plan"),
    ],
  },
  excluir: (c, marcas) => {
    const pecho = marcas.has("dolor_pecho");
    const sp = c.spo2Bajo2h;
    if (!pecho && !sp) return null;
    return { ids: ["panico"], abrir: pecho ? "fc" : "spo2", texto: pecho ? "You answered chest pain: check your heart first." : "Your SpO₂ dropped below 94 % in the last 2 hours: check your oxygen first." };
  },
  botiquin: [
    M("Sertraline", "Oral · behavioral health", "Mood"),
    M("Venlafaxine", "Oral · behavioral health", "Mood"),
    M("Lorazepam", "Oral · behavioral health", "Anxiety"),
    M("Aripiprazole", "Oral · behavioral health", "Behavioral health"),
    M("Diazepam", "Injectable", "Crisis"),
    M("Ziprasidone", "Injectable", "Crisis"),
  ],
  textoNoLibre: "Only prescribed by the flight surgeon or the psychiatrist on Earth",
  remedir: { minutos: 4320, cierra: "WHO-5 above 52" },
  escalar: [E("PHQ-9 or GAD-7 of 15 or more, or low WHO-5 for 2 weeks in a row", "urgente"), E("Question 9 of the PHQ-9", "critico")],
  fuentes: ["who5", "phq9", "gad7", "dsm5", "nasa_salud_mental"],
};

const RADIACION = {
  clave: "radiacion", titulo: TITULOS.radiacion,
  contexto: "NASA limit: 600 mSv over a career and 250 mSv per solar storm. The cumulative dose is a long-term risk and does not raise the level on its own.",
  contextoFuente: "nasa3001,ochmo",
  peligro: [
    { id: "eva", texto: "Solar storm alert during a spacewalk", dato: (c) => !!c.tormentaActiva && !!c.tareaCritica },
    { id: "nausea", texto: "Nausea or vomiting in the hours after a storm" },
  ],
  preguntas: [
    P("p1", "Was there a solar storm alert in the last 48 hours?", { radiacion: 4 }, { radiacion: -4 }, { auto: (c) => (c.tormenta48h == null ? null : c.tormenta48h ? "si" : "no") }),
    P("p2", "Have you been in space less than 3 days?", { mareo: 4 }, {}, { auto: (c) => (num(c.diaMision) == null ? null : c.diaMision < 3 ? "si" : "no") }),
    P("p3", "Does the nausea get worse when you move your head?", { mareo: 3 }),
    P("p4", "Is your skin red or burning in an exposed area?", { radiacion: 3 }),
    P("p5", "Did you eat something different or do you have diarrhea?", { estomago: 3 }, {}, { marca: ["estomago"] }),
  ],
  causas: [
    C("radiacion", "Radiation", "Nausea in the hours after a high dose is the first sign.", 1, "ochmo"),
    C("mareo", "Space motion sickness", "It is common in the first days in space.", 1, "nasa_sensoriomotor"),
    C("estomago", "Stomach", "Something you ate or a stomach infection.", 1, "crucian2016"),
  ],
  planes: {
    alerta: [
      S("r.blindada", "Go to the shielded area until the alert is lifted", true, 10),
      S("r.eva", "If you are on a spacewalk, end it and return to the spacecraft", true),
      S("r.dosimetro", "Write down the dosimeter reading", true),
      S("r.sintomas", "Symptom survey every 6 hours for 2 days", false, 360),
    ],
    radiacion: [
      S("r.vomito", "Record the time of the first vomit", true),
      S("r.agua", "Sip water"),
      S("r.aviso", "Notice to the flight surgeon with the measured dose", true, 30),
    ],
    mareo: abrir("conciencia"),
    estomago: [
      S("r.e.agua", "Sip water", true),
      S("r.e.anotar", "Write down what you ate"),
      S("r.e.revisar", "Reassess in 6 hours", false, 360, { remedir: true }),
    ],
  },
  botiquin: [M("Ondansetron 8 mg", "Oral", "Nausea"), M("Promethazine 25 mg", "Oral", "Nausea")],
  remedir: { minutos: 360, cierra: "No nausea and no active alert" },
  escalar: [E("Storm dose near 250 mSv, or vomiting after the storm", "urgente"), E("Approaching 600 mSv career dose", "info")],
  fuentes: ["nasa3001", "ochmo", "ochmo_tb020", "hera", "nasa_botiquin"],
};

const VISION = {
  clave: "vision", titulo: TITULOS.vision,
  contexto: "81 % of astronauts examined after long missions have at least one sign of SANS. The most common is blurry near vision.",
  contextoFuente: "nasa_sans",
  peligro: [
    { id: "subita", texto: "Sudden loss of vision" },
    { id: "amsler", texto: "Fixed spot or distorted lines on the Amsler grid", nivel: "urgente", sigue: true, dato: (c) => !!c.amslerAnormal },
    { id: "doble", texto: "Double vision" },
  ],
  preguntas: [
    P("p1", "Was the change sudden, within minutes or hours?", {}, {}, { peligro: true, marca: ["organo_blanco", "perdida_vision"] }),
    P("p2", "Is your vision blurry only up close?", { sans: 4 }),
    P("p3", "Is your eye red, painful or do you feel something in it?", { ojo: 4 }),
    P("p4", "Are your eyes dry or gritty?", { seco: 3 }),
    P("p5", "Do you have a headache and is the cabin CO₂ high?", { co2: 3 }, {}, { marca: ["dolor_cabeza"] }),
  ],
  causas: [
    C("sans", "SANS", "Eye changes from the fluid that shifts to the head in microgravity.", 2, "nasa_sans"),
    C("seco", "Dry eye", "The spacecraft air dries out the eyes.", 1, "nasa_ambiente"),
    C("ojo", "Irritated eye or something in it", "A particle or an eye infection.", 1, "nasa_botiquin"),
    C("co2", "Cabin CO₂", "High CO₂ causes headache and blurred vision.", 1, "ochmo_co2"),
  ],
  planes: {
    sans: [
      S("v.lentes", "Try the space anticipation glasses and write down which one clears it up", true),
      S("v.amsler", "Acuity test and Amsler grid", true, null, { href: "/pruebas?t=amsler" }),
      S("v.oct", "Report to the flight surgeon to bring the OCT forward", true, 1440),
      S("v.co2", "Check the cabin CO₂"),
    ],
    ojo: [
      S("v.o.tallar", "Do not rub your eye", true),
      S("v.o.lavar", "Rinse with saline or artificial tears", true),
      S("v.o.fluor", "Fluorescein strip check by the medical officer"),
    ],
    seco: [
      S("v.s.lagrimas", "Use artificial tears", true),
      S("v.s.humedad", "Check the cabin humidity"),
      S("v.s.remedir", "Check again in 1 hour", false, 60, { remedir: true }),
    ],
    co2: abrir("cabina"),
  },
  botiquin: [
    M("Refresh and GenTeal artificial tears", "Convenience", "Dry eye", true),
    M("Moxifloxacin drops", "Topical and injectable", "Eye infection"),
    M("Erythromycin ointment", "Topical and injectable", "Eye infection"),
    M("Tobramycin with dexamethasone", "Topical and injectable", "Eye inflammation"),
    M("Tetracaine", "Topical and injectable", "Eye anesthesia for examination"),
    M("Fluorescein", "Topical and injectable", "Eye examination"),
  ],
  remedir: { minutos: 60, cierra: "No blurred vision or headache" },
  escalar: [E("Abnormal Amsler", "urgente"), E("Sudden loss", "critico")],
  fuentes: ["nasa_sans", "amsler", "ochmo_co2", "nasa_botiquin"],
};

const HUESOS = {
  clave: "huesos", titulo: TITULOS.huesos,
  contexto: "1–2 % of bone is lost per month; daily exercise is mandatory. On arrival in space, 52–68 % have back pain, mild in most.",
  contextoFuente: "nasa_osea",
  peligro: [
    { id: "colico", texto: "Strong pain in the flank or lower back that moves to the groin, with blood in the urine or fever", nivel: "urgente" },
    { id: "orinar", texto: "Unable to urinate", nivel: "urgente" },
    { id: "deformidad", texto: "Blow with deformity" },
  ],
  preguntas: [
    P("p1", "Do you have blood in your urine, fever with flank pain, or are you unable to urinate?", {}, {}, { peligro: true, nivel: "urgente", marca: ["sangre_orina"] }),
    P("p2", "Is the pain in your lower back and did it start in your first days in space?", { espalda: 4 }),
    P("p3", "Does the pain come and go in waves and move toward the groin?", { rinon: 4 }, {}, { marca: ["costado"] }),
    P("p4", "Is your urine dark or did you drink little water?", { deshidratacion: 3, rinon: 1 }, {}, { marca: ["poca_agua"] }),
    P("p5", "Did you get hurt using exercise equipment?", { lesion: 4 }),
    P("p6", "Did you miss exercise sessions this week?", { condicion: 2 }),
  ],
  causas: [
    C("espalda", "Space back pain", "The spine stretches in microgravity and hurts in the first days.", 2, "nasa_osea"),
    C("condicion", "Lack of exercise", "Without exercise you lose bone and muscle.", 1, "nasa_osea"),
    C("deshidratacion", "Little water", "With little water urine becomes concentrated and favors stones.", 1, "nasem2018"),
    C("lesion", "Injury with the equipment", "A bad movement with the exercise equipment.", 1, "nasa_osea"),
    C("rinon", "Kidney stone", "The calcium released by bone rises in the urine and forms stones.", 0, "nasem2018"),
  ],
  planes: {
    espalda: [
      S("h.fetal", "Fetal position, knees to chest for 2 min, 3 times", true),
      S("h.ibuprofeno", "Ibuprofen if the pain keeps you from working"),
      S("h.core", "Abdominal and back exercises in the day's session"),
      S("h.revisar", "Check tomorrow", false, 1440, { remedir: true }),
    ],
    rinon: [
      S("h.r.agua", "Drink more water", true),
      S("h.r.eco", "Notice to the flight surgeon for an onboard ultrasound", true, 30),
      S("h.r.analgesico", "Analgesic as the physician indicates"),
    ],
    condicion: [S("h.c.ejercicio", "Complete the day's exercise", true, null, { remedir: true })],
    deshidratacion: [
      S("h.d.agua", "Drink more water", true),
      S("h.d.orina", "Check the urine color tomorrow", false, 1440, { remedir: true }),
    ],
    lesion: [
      S("h.l.equipo", "Stop using that equipment", true),
      S("h.l.reposo", "Rest the area"),
      S("h.l.aviso", "Notify the flight surgeon", true, 60),
    ],
  },
  botiquin: [
    IBUPROFENO, PARACETAMOL,
    M("Ketorolac", "Injectable", "Severe pain"),
    M("Hydrocodone with acetaminophen", "Oral", "Severe pain"),
    M("Tamsulosin", "Oral", "Kidney stone"),
  ],
  avisosBotiquin: ["Against kidney stones, potassium citrate is the countermeasure approved for flight."],
  remedir: { minutos: 1440, cierra: "Day's exercise at 80 % or more and no pain" },
  escalar: [E("Colicky pain with blood or fever", "urgente"), E("Unable to urinate", "urgente")],
  fuentes: ["nasa_osea", "nasem2018", "leblanc2013", "nasa_botiquin"],
};

const CABINA = {
  clave: "cabina", titulo: TITULOS.cabina,
  contexto: "Limit: CO₂ of 3 mmHg or less on average per hour. From 2.8 to 4.5 mmHg it causes headache; above 4.5, tiredness, poor sleep and nausea. Temperature and humidity between 18 °C with 75 % and 27 °C with 25 %.",
  contextoFuente: "ochmo_co2,nasa3001",
  compartida: true,
  peligro: [{ id: "alarma", texto: "Fire, depressurization or toxic (ammonia) alarm", alarma: true, dato: (c) => !!c.alarmaNave }],
  preguntas: [
    P("p1", "Do you have a headache now?", { co2: 3 }, {}, { marca: ["dolor_cabeza"] }),
    P("p2", "Is more than one person exercising in the same module?", { co2: 3 }),
    P("p3", "Does the fan in your area sound different or can you not feel any air?", { ventilacion: 3 }),
    P("p4", "Are you sweating or cold without exercising?", { temperatura: 3 }),
  ],
  causas: [
    C("co2", "High CO₂", "More people or exercise in a module raises CO₂.", 2, "ochmo_co2"),
    C("ventilacion", "Ventilation", "Without airflow CO₂ builds up around your head.", 1, "ochmo_co2"),
    C("temperatura", "Temperature or humidity", "Outside 18–27 °C the body feels unwell.", 1, "nasa3001"),
  ],
  planes: {
    co2: [
      S("cb.modulo", "Go to a module with better ventilation", true),
      S("cb.pausa", "Pause exercise in that module"),
      S("cb.sistema", "Check the CO₂ scrubbing system and report to Earth", true, 30),
      S("cb.paracetamol", "Acetaminophen if you have a headache"),
      S("cb.remedir", "Measure the CO₂ again in 1 hour", true, 60, { remedir: true }),
    ],
    ventilacion: [
      S("cb.v.modulo", "Go to another module", true),
      S("cb.v.reporte", "Check the fan in your area and report it", true, 30),
      S("cb.v.remedir", "Measure the CO₂ again in 1 hour", true, 60, { remedir: true }),
    ],
    temperatura: [
      S("cb.t.ajustar", "Adjust the module temperature", true),
      S("cb.t.humedad", "Check the humidity"),
      S("cb.t.remedir", "Measure again in 30 min", false, 30, { remedir: true }),
    ],
  },
  botiquin: [PARACETAMOL],
  remedir: { minutos: 60, cierra: "CO₂ of 3 mmHg or less" },
  escalar: [E("CO₂ above 4.5 mmHg or symptoms in 2 or more crew members", "urgente"), E("Ship alarm", "critico")],
  fuentes: ["ochmo_co2", "ochmo_tb002", "nasa3001", "nasa_ambiente"],
};

export const FICHAS = {
  fc: FC,
  pa: { clave: "pa", titulo: TITULOS.pa, ramas: { alta: PA_ALTA, baja: PA_BAJA } },
  fr: FR, spo2: SPO2, temp: TEMP, conciencia: CONCIENCIA, sueno: SUENO, animo: ANIMO, radiacion: RADIACION, vision: VISION, huesos: HUESOS, cabina: CABINA,
};
export const CLAVES_FICHA = Object.keys(FICHAS);

export const PRUEBAS_RECOMENDADAS = {
  fc: ["remedicion", "recuperacion_fc"], pa: ["presion_pronam", "ortostatica"], fr: ["borg"], spo2: ["spo2_confirmacion"], temp: ["temperatura"],
  conciencia: ["amt4", "cincinnati", "msaq"], sueno: ["diario_sueno", "kss", "pvt"], animo: ["who5", "phq9", "gad7"],
  radiacion: ["tormenta_sintomas", "msaq"], vision: ["amsler", "agudeza", "lentes"], huesos: ["dolor", "orina", "ejercicio_registro", "agarre"], cabina: ["cabina_tripulacion"],
};
for (const [k, ids] of Object.entries(PRUEBAS_RECOMENDADAS)) {
  FICHAS[k].pruebasRecomendadas = ids;
  if (FICHAS[k].ramas) Object.values(FICHAS[k].ramas).forEach((r) => { r.pruebasRecomendadas = ids; });
}

export function notasDeEvento(pasos = [], eventoId = null) {
  return pasos.filter((p) => eventoId == null || p.evento_id === eventoId).map((p) => {
    const n = leerNota(p.nota);
    return n ? { ...n, paso: n.paso || p.paso_id, t: n.t || p.marcado_en } : null;
  }).filter(Boolean);
}

export function mostrarPruebaCompleta({ ev, evento = null, notas = [] } = {}) {
  if (!ev) return { mostrar: false, motivos: [], pruebas: [] };
  const m = evento?.respuestas?._m || {};
  const motivos = [];
  if (m.nivelInicial && RANGO_NIVEL[ev.nivel] > RANGO_NIVEL[m.nivelInicial]) motivos.push("The level went up");
  if (m.peor || notas.some((n) => n.motivo === "peor")) motivos.push("You feel worse");
  if (ev.empate) motivos.push("Two causes ended up tied");
  if ((m.remediciones || []).some((r) => r.resultado !== "resuelto")) motivos.push("Measuring again did not resolve it");
  const sust = {};
  for (const n of notas) if (n.alt) sust[n.paso] = (sust[n.paso] || 0) + 1;
  if (Object.values(sust).some((x) => x >= 2) || Object.values(sust).reduce((a, b) => a + b, 0) >= 2) motivos.push("You swapped steps for their alternative");
  return { mostrar: motivos.length > 0, motivos, pruebas: ev.ficha.pruebasRecomendadas || PRUEBAS_RECOMENDADAS[ev.clave] || [] };
}

export const PLAN_EMERGENCIA = [
  S("em.avisar", "Notify the crew medical officer now", true, 2),
  S("em.acompanado", "Have a crewmate stay with you", true),
  S("em.procedimiento", "Follow the ship emergency procedure", true),
  S("em.remedir", "Measure your signs again in 5 min", true, 5, { remedir: true }),
];
export const PLAN_CONDUCTUAL = [
  S("cd.conferencia", "Open the private psychological conference", true, 2),
  S("cd.oficial", "Notify the crew medical officer", true, 2),
];
export const PLAN_ALARMA = [S("al.salvo", "Confirm \"I am safe\"", true, 2)];

export function ramaPa(ctx = {}) {
  if (ctx.rama === "alta" || ctx.rama === "baja") return ctx.rama;
  const s = num(L(ctx).sistolica);
  return s != null && s <= 100 ? "baja" : "alta";
}

export function obtenerFicha(clave, ctx = {}) {
  const f = FICHAS[clave];
  if (!f) return null;
  if (!f.ramas) return f;
  const rama = ramaPa(ctx);
  return { ...f.ramas[rama], clave, titulo: rama === "baja" ? "Low blood pressure" : "High blood pressure", rama };
}

export function preguntasDe(clave) {
  const f = FICHAS[clave];
  if (!f) return [];
  return f.ramas ? [...f.ramas.alta.preguntas, ...f.ramas.baja.preguntas] : f.preguntas;
}

export function limpiarRespuestas(r = {}) {
  return Object.fromEntries(Object.entries(r || {}).filter(([k, v]) => !k.startsWith("_") && (v === "si" || v === "no" || v === "nose")));
}

export function marcasDe(todas = {}) {
  const m = new Set();
  for (const [clave, r] of Object.entries(todas || {})) {
    const resp = limpiarRespuestas(r);
    for (const p of preguntasDe(clave)) if (resp[p.id] === "si") (p.marca || []).forEach((x) => m.add(x));
  }
  return m;
}

export function resolverPlan(ficha, causaId) {
  let p = ficha.planes?.[causaId];
  for (let i = 0; typeof p === "string" && i < 5; i++) p = ficha.planes[p];
  return Array.isArray(p) ? p : [];
}

function respuestasAuto(ficha, ctx) {
  const out = {};
  for (const p of ficha.preguntas) {
    const v = p.auto?.(ctx);
    if (v === "si" || v === "no") out[p.id] = v;
  }
  return out;
}

const NOMBRE_CORTO = { fc: "HR", pa: "blood pressure", fr: "RR", spo2: "SpO₂", temp: "temperature" };

function contraBase(v, rango, unidad) {
  if (v == null || !rango || rango[0] == null) return "";
  const [lo, hi] = rango;
  const r = `${f1(lo)}–${f1(hi)}`;
  if (v > hi) return `, ${f1(v - hi)} ${unidad} above your baseline (${r})`;
  if (v < lo) return `, ${f1(lo - v)} ${unidad} below your baseline (${r})`;
  return `, within your baseline (${r})`;
}

export function frase(clave, ctx = {}) {
  const l = L(ctx), ci = CI(ctx), t = ctx.tarjeta || {};
  if (clave === "fc") return `Your HR is at ${l.fc ?? "—"} bpm${contraBase(num(l.fc), ctx.rango, "bpm")}.`;
  if (clave === "pa") {
    const s = num(l.sistolica), d = num(l.diastolica);
    const b = contraBase(s, ctx.rango, "mmHg");
    return `Your blood pressure is at ${s ?? "—"}/${d ?? "—"} mmHg${b ? `; the systolic is${b.slice(1)}` : ""}.`;
  }
  if (clave === "fr") return `You breathe ${l.frec_resp ?? "—"} times per minute${contraBase(num(l.frec_resp), ctx.rango, "br/min")}.`;
  if (clave === "spo2") return `Your SpO₂ is at ${l.spo2 ?? "—"} %${contraBase(num(l.spo2), ctx.rango, "points")}${num(ctx.oximetro) != null ? `; the finger oximeter read ${ctx.oximetro} %` : ""}.`;
  if (clave === "temp") return `Your temperature is at ${l.temperatura ?? "—"} °C${contraBase(num(l.temperatura), ctx.rango, "°C")}.`;
  if (clave === "conciencia") return ci.confusion ? "You reported confusion." : ci.mareo_de_pie ? "You reported dizziness." : "You are alert and not dizzy.";
  if (clave === "sueno") {
    const h = num(ctx.horasSueno);
    const n = num(ctx.noches);
    const r = num(ctx.reaccion), rb = num(ctx.reaccionBase);
    const partes = [`You slept ${h != null ? f1(h) : "—"} h last night`];
    if (n) partes.push(`you have had ${n} nights with less than 7 h`);
    if (r != null && rb) {
      const pct = Math.round(((r - rb) / rb) * 100);
      partes.push(pct === 0 ? `your reaction is ${Math.round(r)} ms, the same as your normal` : `your reaction is ${Math.round(r)} ms, ${Math.abs(pct)} % ${pct > 0 ? "slower" : "faster"} than your normal of ${Math.round(rb)} ms`);
    }
    return partes.join("; ") + ".";
  }
  if (clave === "animo") {
    const w = num(ctx.who5);
    return w != null ? `Your WHO-5 is ${w}/100${w <= 52 ? ", low well-being" : ""}${t.rangoPersonal ? contraBase(w, t.rangoPersonal, "points") : ""}.` : t.motivo ? `${t.motivo}.` : "No recent WHO-5.";
  }
  if (clave === "radiacion") {
    const r = ctx.radiacion || {};
    const base = `The rate is ${Math.round(r.tasa || 0)} µSv/h (baseline ${Math.round(r.tasaBase || 0)})`;
    return `${base}. Career dose: ${Math.round(r.carrera || 0)} of 600 mSv, with ${Math.round(r.previa || 0)} mSv from previous missions${ctx.tormentaActiva ? ". Solar storm active" : ""}.`;
  }
  if (clave === "vision") return t.motivo ? `${t.motivo[0].toUpperCase()}${t.motivo.slice(1)}.` : "No changes in your vision.";
  if (clave === "huesos") return `Today you are at ${ctx.huesosPct ?? "—"} % of your prescribed exercise${ctx.racha ? `; ${ctx.racha} days in a row below it` : ""}.`;
  if (clave === "cabina") {
    const ppm = num(ctx.co2_ppm);
    const extra = ctx.tempCabina != null ? ` The cabin is at ${f1(ctx.tempCabina)} °C with ${ctx.humedad ?? "—"} % humidity.` : "";
    return `CO₂ of ${ppm != null ? ppm.toLocaleString("en-US") : "—"} ppm (${mmhg(ppm) ?? "—"} mmHg); the limit is ${LIMITE_CO2_MMHG} mmHg.${extra}`;
  }
  return NOMBRE_CORTO[clave] ? `Check your ${NOMBRE_CORTO[clave]}.` : "";
}

export function evaluarFicha(clave, { contexto = {}, respuestas = {}, todas = null, combinaciones = [] } = {}) {
  const ctx = contexto || {};
  const ficha = obtenerFicha(clave, ctx);
  if (!ficha) return null;
  const propias = limpiarRespuestas(respuestas);
  const resp = { ...respuestasAuto(ficha, ctx), ...propias };
  const autos = new Set(Object.keys(respuestasAuto(ficha, ctx)).filter((k) => !(k in propias)));
  const visibles = ficha.preguntas.filter((p) => !p.requiere || Object.entries(p.requiere).every(([k, v]) => resp[k] === v));
  const marcas = marcasDe({ ...(todas || {}), [clave]: resp });

  const activos = [];
  for (const pe of ficha.peligro) if (pe.dato && pe.dato(ctx)) activos.push({ ...pe, nivel: pe.nivel || "critico", origen: "dato" });
  const manual = respuestas?._peligro ? ficha.peligro.find((x) => x.id === respuestas._peligro) : null;
  if (manual && !activos.some((a) => a.id === manual.id)) activos.push({ ...manual, nivel: manual.nivel || "critico", sigue: false, origen: "manual" });
  for (const p of visibles) if (p.peligro && resp[p.id] === "si") activos.push({ id: p.id, texto: p.texto, nivel: p.nivel || "critico", origen: "pregunta" });

  const conductual = activos.some((a) => a.conductual);
  const alarma = activos.some((a) => a.alarma);
  const bloquea = activos.some((a) => !a.sigue);
  const modo = conductual ? "conductual" : alarma ? "alarma" : bloquea ? "emergencia" : "normal";

  const puntos = Object.fromEntries(ficha.causas.map((c) => [c.id, c.peso]));
  for (const p of visibles) {
    const v = resp[p.id];
    const mapa = v === "si" ? p.si : v === "no" ? p.no : null;
    if (mapa) for (const [c, n] of Object.entries(mapa)) if (c in puntos) puntos[c] += n;
  }
  ficha.ajuste?.(ctx, puntos, resp);
  for (const [c, n] of Object.entries(ctx.ajustesPruebas?.[clave] || {})) if (c in puntos) puntos[c] += n;
  const orden = ficha.causas.map((c) => c.id);
  const exclusion = ficha.excluir?.(ctx, marcas) || null;
  const fuera = new Set(exclusion?.ids || []);
  const causas = ficha.causas
    .map((c) => ({ ...c, puntos: puntos[c.id], descartarAntes: fuera.has(c.id) }))
    .sort((a, b) => (a.descartarAntes - b.descartarAntes) || b.puntos - a.puntos || orden.indexOf(a.id) - orden.indexOf(b.id));
  const candidatas = causas.filter((c) => !c.descartarAntes);
  const max = candidatas.length ? candidatas[0].puntos : null;
  const principales = candidatas.filter((c) => c.puntos === max);

  let planes = [];
  if (modo === "conductual") planes = [{ causa: { id: "conductual", nombre: "Behavioral health" }, pasos: PLAN_CONDUCTUAL }];
  else if (modo === "alarma") planes = [{ causa: { id: "alarma", nombre: "Ship alarm" }, pasos: PLAN_ALARMA }];
  else if (modo === "emergencia") planes = [{ causa: { id: "emergencia", nombre: "Emergency plan" }, pasos: PLAN_EMERGENCIA }];
  else {
    if (ficha.planes.alerta && ctx.tormentaActiva) planes.push({ causa: { id: "alerta", nombre: "Solar storm alert" }, pasos: ficha.planes.alerta });
    for (const c of principales) planes.push({ causa: c, pasos: resolverPlan(ficha, c.id) });
    if (activos.length) planes.unshift({ causa: { id: "emergencia", nombre: "While it is confirmed" }, pasos: PLAN_EMERGENCIA.slice(0, 1) });
  }

  const sinPreguntas = modo !== "normal";
  const pendientes = sinPreguntas ? [] : visibles.filter((p) => !(p.id in resp));
  const total = sinPreguntas ? 0 : visibles.length;

  const base = ctx.gravedad || "moderado";
  const propiasCombos = (combinaciones || []).filter((c) => !c.fichas?.length || c.fichas.includes(clave));
  let nivel = mayorNivel(base, ...activos.map((a) => a.nivel), ...propiasCombos.map((c) => c.nivel), ctx.nivelMinimo, ctx.nivelPruebas?.[clave]);
  if (conductual || alarma) nivel = "critico";

  return {
    clave, ficha, rama: ficha.rama || null, titulo: ficha.titulo, modo, nivel, nivelBase: base,
    peligros: activos, frase: frase(clave, ctx), contexto: ficha.contexto || null,
    preguntas: sinPreguntas ? [] : visibles, respuestas: resp, autos, siguiente: pendientes[0] || null,
    progreso: { hechas: total - pendientes.length, total }, terminada: sinPreguntas || pendientes.length === 0,
    causas, principales, empate: principales.length > 1, planes, exclusion,
    causaProbable: modo === "normal" && Object.keys(propias).length && principales.length ? `Probable cause: ${principales.map((c) => minuscula(c.nombre)).join(" or ")}` : null,
    combinaciones: propiasCombos, marcas: [...marcas],
    botiquin: sinPreguntas && modo !== "normal" && modo !== "emergencia" ? [] : ficha.botiquin || [],
  };
}

export function pasosDeEvento(evento) {
  if (!evento) return [];
  const m = evento.respuestas?._m || {};
  const ficha = obtenerFicha(evento.clave, { rama: m.rama });
  if (!ficha) return [];
  if (m.modo === "conductual") return PLAN_CONDUCTUAL;
  if (m.modo === "alarma") return PLAN_ALARMA;
  if (m.modo === "emergencia") return PLAN_EMERGENCIA;
  const ids = String(evento.causa || "").split(",").map((x) => x.trim()).filter(Boolean);
  const vistos = new Set();
  const out = [];
  const extra = [...(m.alerta ? resolverPlan(ficha, "alerta") : []), ...(m.peligroActivo ? PLAN_EMERGENCIA.slice(0, 1) : [])];
  for (const p of [...extra, ...ids.flatMap((id) => resolverPlan(ficha, id))]) {
    if (vistos.has(p.id) || p.abrir) continue;
    vistos.add(p.id);
    out.push(p);
  }
  return out;
}

export function textoPaso(clave, pasoId, rama = null) {
  const todos = [...PLAN_EMERGENCIA, ...PLAN_CONDUCTUAL, ...PLAN_ALARMA];
  const fs = FICHAS[clave]?.ramas ? [FICHAS[clave].ramas.alta, FICHAS[clave].ramas.baja] : [FICHAS[clave]].filter(Boolean);
  for (const f of fs) for (const v of Object.values(f.planes || {})) if (Array.isArray(v)) todos.push(...v);
  return todos.find((p) => p.id === pasoId)?.texto || pasoId;
}

export function lecturaDeContexto(ctx = {}) {
  const l = L(ctx), ci = CI(ctx);
  return {
    fc: num(l.fc), sistolica: num(l.sistolica), diastolica: num(l.diastolica), frec_resp: num(l.frec_resp), spo2: num(ctx.oximetro) ?? num(l.spo2), temperatura: num(l.temperatura),
    co2_ppm: num(ctx.co2_ppm), who5: num(ctx.who5), reaccion: num(ctx.reaccion), huesosPct: num(ctx.huesosPct),
    confusion: !!ci.confusion, mareo: !!ci.mareo_de_pie, vision_borrosa: !!ci.vision_borrosa, dolor_cabeza: !!ci.dolor_cabeza, tormentaActiva: !!ctx.tormentaActiva,
  };
}

export const CAMPOS_REMEDIR = {
  fc: [{ campo: "fc", etiqueta: "HR", unidad: "bpm" }],
  pa: [{ campo: "sistolica", etiqueta: "Systolic", unidad: "mmHg" }, { campo: "diastolica", etiqueta: "Diastolic", unidad: "mmHg" }],
  fr: [{ campo: "frec_resp", etiqueta: "RR", unidad: "br/min" }],
  spo2: [{ campo: "spo2", etiqueta: "Finger oximeter", unidad: "%" }],
  temp: [{ campo: "temperatura", etiqueta: "Temperature", unidad: "°C", paso: 0.1 }],
  cabina: [{ campo: "co2_ppm", etiqueta: "CO₂", unidad: "ppm", paso: 50 }],
  animo: [{ campo: "who5", etiqueta: "WHO-5", unidad: "/100" }],
  sueno: [{ campo: "reaccion", etiqueta: "Reaction", unidad: "ms" }],
  huesos: [{ campo: "huesosPct", etiqueta: "Today's exercise", unidad: "%" }],
  conciencia: [], vision: [], radiacion: [],
};

const dist = (v, lo, hi) => (v == null ? 0 : v < lo ? lo - v : v > hi ? v - hi : 0);

export function evaluarRemedicion(clave, ctx = {}, nueva = {}, inicial = null) {
  const antes = { ...lecturaDeContexto(ctx), ...(inicial || {}) };
  const n = { ...antes, ...Object.fromEntries(Object.entries(nueva || {}).filter(([, v]) => v !== null && v !== undefined && v !== "")) };
  const rango = ctx.rango || null;
  const R = (ok, dAntes, dAhora, umbral = 0) => (ok ? "resuelto" : dAhora > dAntes + umbral ? "peor" : "igual");
  let resultado = "igual";
  if (clave === "fc") {
    const [lo, hi] = rango || [51, 90];
    resultado = R(num(n.fc) != null && n.fc >= Math.min(lo, 51) && n.fc <= Math.max(hi, 90), dist(antes.fc, lo, hi), dist(num(n.fc), lo, hi), 5);
  } else if (clave === "pa") {
    if (ramaPa(ctx) === "baja") resultado = R(num(n.sistolica) > 100, dist(antes.sistolica, 101, 200), dist(num(n.sistolica), 101, 200), 4);
    else resultado = R(num(n.sistolica) < 130 && num(n.diastolica) < 85, dist(antes.sistolica, 0, 129) + dist(antes.diastolica, 0, 84), dist(num(n.sistolica), 0, 129) + dist(num(n.diastolica), 0, 84), 5);
  } else if (clave === "fr") resultado = R(num(n.frec_resp) >= 12 && num(n.frec_resp) <= 20, dist(antes.frec_resp, 12, 20), dist(num(n.frec_resp), 12, 20), 1);
  else if (clave === "spo2") resultado = R(num(n.spo2) >= 95, dist(antes.spo2, 95, 100), dist(num(n.spo2), 95, 100), 1);
  else if (clave === "temp") {
    const hi = rango ? Math.max(37.5, rango[1] + 0.2) : 37.5;
    resultado = R(num(n.temperatura) != null && n.temperatura < hi && n.temperatura > 36.0, dist(antes.temperatura, 36.1, hi), dist(num(n.temperatura), 36.1, hi), 0.2);
  } else if (clave === "cabina") {
    const lim = LIMITE_CO2_MMHG / MMHG_POR_PPM;
    resultado = R(num(n.co2_ppm) != null && n.co2_ppm <= lim, dist(antes.co2_ppm, 0, lim), dist(num(n.co2_ppm), 0, lim), 200);
  } else if (clave === "animo") resultado = R(num(n.who5) > 52, dist(antes.who5, 53, 100), dist(num(n.who5), 53, 100), 4);
  else if (clave === "sueno") {
    const b = num(ctx.reaccionBase) || 300;
    resultado = R(num(n.reaccion) != null && n.reaccion <= b * 1.15, dist(antes.reaccion, 0, b * 1.15), dist(num(n.reaccion), 0, b * 1.15), 15);
  } else if (clave === "huesos") resultado = R(num(n.huesosPct) >= 80, dist(antes.huesosPct, 80, 999), dist(num(n.huesosPct), 80, 999), 5);
  else if (clave === "conciencia") resultado = !n.confusion && !n.mareo ? "resuelto" : n.confusion && !antes.confusion ? "peor" : "igual";
  else if (clave === "vision") resultado = !n.vision_borrosa && !n.dolor_cabeza ? "resuelto" : "igual";
  else if (clave === "radiacion") resultado = !n.tormentaActiva ? "resuelto" : "igual";
  return { resultado, lectura: n };
}

const NIVEL_DE_TARJETA = { critico: "critico", atencion: "urgente" };

export function ajustesDeResultados(resultados = [], { ahora = Date.now(), desde = null, horas = 24 } = {}) {
  const ajustesPruebas = {};
  const nivelPruebas = {};
  const ultimos = {};
  const recientes = (resultados || []).filter((r) => ahora - Date.parse(r.hecho_en) <= horas * 36e5).sort((a, b) => String(a.hecho_en).localeCompare(String(b.hecho_en)));
  for (const r of recientes) {
    ultimos[r.prueba_id] = r;
    for (const [clave, mapa] of Object.entries(r.valor?.causas || {})) {
      ajustesPruebas[clave] = { ...(ajustesPruebas[clave] || {}) };
      for (const [c, n] of Object.entries(mapa)) ajustesPruebas[clave][c] = (ajustesPruebas[clave][c] || 0) + n;
    }
    if (r.desde_ficha && r.nivel in RANGO_NIVEL && (!desde || r.hecho_en >= desde)) nivelPruebas[r.desde_ficha] = mayorNivel(nivelPruebas[r.desde_ficha] || "ok", r.nivel);
  }
  const ox = ultimos.spo2_confirmacion ? respuestasComoObjeto(ultimos.spo2_confirmacion.valor).oximetro : null;
  return { ajustesPruebas, nivelPruebas, ultimasPruebas: ultimos, ...(ox != null ? { oximetroPrueba: Number(ox) } : {}) };
}

export function contextoFicha(clave, analisis, data, extra = {}) {
  const tarjetas = analisis?.tarjetas || [];
  const porK = Object.fromEntries(tarjetas.map((x) => [x.k, x]));
  const t = porK[clave] || null;
  const ev = data?.enVivo || {};
  const hoy = analisis?.hoy || {};
  const ci = analisis?.checkinHoy || {};
  const cab = porK.cabina?.cabinaHoy || {};
  const rad = analisis?.radiacion || {};
  const ahora = extra.ahora ?? Date.now();
  const eventos = data?.eventos || [];
  const tormenta48h = !!rad.activo || eventos.some((e) => {
    const ini = Date.parse(e.inicio);
    const fin = e.fin ? Date.parse(e.fin) : ahora;
    return ini <= ahora && ahora - fin <= 48 * 36e5;
  });
  const act = analisis?.actividad?.estado || "reposo";
  const pvt = [...(analisis?.pruebasDia || [])].reverse().find((p) => p.tipo === "reaccion");
  const aj = ajustesDeResultados(extra.resultados, { ahora, desde: extra.desde });
  return {
    clave, tarjeta: t, rango: t?.rangoPersonal || null, rango2: t?.rangoPersonal2 || null,
    lectura: hoy, ci, gravedad: analisis?.gravedades?.[clave] || (t ? NIVEL_DE_TARJETA[t.estado] || "ok" : "ok"),
    actividad: act, diaMision: num(ev.dia_mision) ?? data?.astronaut?.dia_mision ?? null, fase: ev.fase_mision || data?.astronaut?.fase || "orbita",
    tormentaActiva: !!rad.activo, refugio: !!rad.refugio, tormenta48h,
    radiacion: { tasa: rad.tasa, tasaBase: rad.tasaBase, carrera: rad.carrera, previa: rad.previa, pct: rad.pct },
    phq9Item9: num(analisis?.tamizaje?.phq9?.resultado?.item9) || 0, who5: num(porK.animo?.valor),
    co2_ppm: num(cab.co2_ppm), tempCabina: num(cab.temp_c), humedad: num(cab.humedad),
    pulsoIrregular: !!ev.pulso_irregular, tareaCritica: !!ev.tarea_critica, alarmaNave: ev.alarma_nave || null,
    amslerAnormal: !!analisis?.sistemas?.vision?.extra?.amsler, lapsos: num(pvt?.resultado?.lapsos),
    reaccion: num(porK.sueno?.reaccion), reaccionBase: num(porK.sueno?.reaccionBase), noches: num(porK.sueno?.noches), horasSueno: num(porK.sueno?.valor),
    huesosPct: num(porK.huesos?.valor), racha: num(porK.huesos?.racha),
    nivelMinimo: extra.nivelMinimo || null, rama: extra.rama || null,
    ...aj, oximetro: num(extra.oximetro) ?? aj.oximetroPrueba ?? null,
    spo2Bajo2h: extra.spo2Bajo2h ?? (num(hoy.spo2) != null && hoy.spo2 < 94),
  };
}
