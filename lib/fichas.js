import { COLOR_GRAVEDAD, ETIQUETA_GRAVEDAD } from "./analysis.js";
import { inferirTipo, leerNota } from "./motivos.js";

export const NIVELES = ["ok", "info", "moderado", "urgente", "critico"];
export const RANGO_NIVEL = Object.fromEntries(NIVELES.map((n, i) => [n, i]));
export const ETIQUETA_NIVEL = { ...ETIQUETA_GRAVEDAD, resuelto: "Resuelto" };
export const COLOR_NIVEL = { ...COLOR_GRAVEDAD, resuelto: COLOR_GRAVEDAD.ok };
export const NOTA_BOTIQUIN = "Confirma la dosis con el cirujano de vuelo o el oficial médico de la tripulación.";
export const TEXTO_NO_LIBRE = "Disponible a bordo: lo indica el cirujano de vuelo";
export const MOTIVOS_NO_PUEDO = [
  { id: "equipo", texto: "No tengo el equipo" },
  { id: "peor", texto: "Me siento peor" },
  { id: "otro", texto: "Otro" },
];
export const RESPUESTAS = { si: "Sí", no: "No", nose: "No sé" };
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
const f1 = (x) => Number(x).toLocaleString("es-MX", { maximumFractionDigits: 1 });

const P = (id, texto, si = {}, no = {}, extra = {}) => ({ id, texto, si, no, ...extra });
const C = (id, nombre, porque, peso, fuente) => ({ id, nombre, porque, peso, fuente });
const S = (id, texto, obligatorio = false, minutos = null, extra = {}) => ({ id, texto, obligatorio, minutos, tipo: extra.tipo || (extra.abrir ? "otro" : inferirTipo(texto)), ...extra });
const M = (nombre, paquete, uso, libre = false, extra = {}) => ({ nombre, paquete, uso, libre, ...extra });
const E = (texto, nivel) => ({ texto, nivel });

export const TITULOS = {
  fc: "Frecuencia cardiaca", pa: "Presión arterial", fr: "Frecuencia respiratoria", spo2: "SpO₂", temp: "Temperatura", conciencia: "Conciencia y mareo",
  sueno: "Sueño y alerta", animo: "Ánimo, estrés y tripulación", radiacion: "Radiación", vision: "Visión (SANS)", huesos: "Huesos y músculos", cabina: "Cabina",
};
export const CATEGORIA_FICHA = {
  fc: "Corazón y respiración", pa: "Corazón y respiración", fr: "Corazón y respiración", spo2: "Corazón y respiración",
  temp: "Mente y defensas", conciencia: "Mente y defensas", sueno: "Mente y defensas", animo: "Mente y defensas",
  radiacion: "Efectos del espacio", vision: "Efectos del espacio", huesos: "Efectos del espacio", cabina: "Efectos del espacio",
};

const abrir = (clave) => [S(`abrir.${clave}`, `Abrir la ficha de ${TITULOS[clave]}`, false, null, { abrir: clave })];
const esfuerzo = (ctx) => ctx.actividad === "ejercicio" || ctx.actividad === "recuperacion";
const L = (ctx) => ctx.lectura || {};
const CI = (ctx) => ctx.ci || {};

const PARACETAMOL = M("Paracetamol 325 mg", "Conveniencia", "Dolor o malestar", true);
const IBUPROFENO = M("Ibuprofeno 400 mg", "Conveniencia", "Dolor", true, { grupo: "aine" });

const FC = {
  clave: "fc", titulo: TITULOS.fc,
  peligro: [
    { id: "pecho", texto: "Dolor o presión en el pecho" },
    { id: "aire", texto: "Falta de aire" },
    { id: "desmayo", texto: "Desmayo o casi desmayo" },
    { id: "fc_extrema", texto: "FC de 131 o más, o de 40 o menos, en reposo", dato: (c) => !esfuerzo(c) && num(L(c).fc) != null && (L(c).fc >= 131 || L(c).fc <= 40) },
  ],
  preguntas: [
    P("p1", "¿Tienes dolor de pecho, falta de aire o sentiste que te desmayabas?", {}, {}, { peligro: true, marca: ["dolor_pecho", "organo_blanco", "desmayo"] }),
    P("p2", "¿Hiciste ejercicio o un esfuerzo en los últimos 15 minutos?", { ejercicio: 4 }),
    P("p3", "¿Te sientes nervioso, asustado o con mucho estrés?", { estres: 3 }),
    P("p4", "¿Dormiste menos de 6 horas anoche?", { sueno: 2 }),
    P("p5", "¿Tomaste cafeína, modafinilo o un descongestionante hoy?", { estimulante: 3 }),
    P("p6", "¿Tienes fiebre, escalofríos o te sientes enfermo?", { infeccion: 3 }),
  ],
  causas: [
    C("ejercicio", "Esfuerzo reciente", "El esfuerzo sube la FC; en reposo baja sola en minutos.", 2, "news2"),
    C("estres", "Estrés o susto", "El estrés activa el sistema nervioso y acelera el corazón.", 2, "news2,nasa_salud_mental"),
    C("estimulante", "Cafeína o estimulante", "La cafeína, el modafinilo y la pseudoefedrina pueden subir la FC.", 1, "nasa_botiquin"),
    C("sueno", "Poco sueño", "Dormir poco sube la FC en reposo y baja la VFC.", 1, "aasm"),
    C("infeccion", "Infección o fiebre", "La fiebre sube unos 10 lpm por cada grado.", 1, "news2,nasa_inmune"),
    C("deshidratacion", "Poca agua", "Con menos volumen de sangre el corazón late más rápido.", 1, "esc2018"),
    C("arritmia", "Ritmo irregular", "Un pulso irregular necesita revisión del cirujano de vuelo.", 0, "esc2018"),
  ],
  planes: {
    estres: [
      S("fc.reposo", "Sentarte o quedarte quieto 5 min con respiración lenta", true),
      S("fc.agua", "Tomar agua"),
      S("fc.cafeina", "Nada de cafeína en 6 horas"),
      S("fc.remedir", "Volver a medir en 10 min", true, 10, { remedir: true }),
    ],
    estimulante: "estres",
    sueno: "estres",
    ejercicio: [
      S("fc.ej.pausa", "Detener el ejercicio y quedarte en reposo", true),
      S("fc.ej.agua", "Tomar agua"),
      S("fc.ej.remedir", "Volver a medir en reposo en 15 min", true, 15, { remedir: true }),
    ],
    infeccion: abrir("temp"),
    deshidratacion: [
      S("fc.agua.sal", "Tomar agua con sal o electrolitos", true),
      S("fc.agua.nota", "Anotar cuánto tomaste"),
      S("fc.agua.remedir", "Volver a medir en 30 min", true, 30, { remedir: true }),
    ],
    arritmia: [
      S("fc.arr.reposo", "Quedarte en reposo", true),
      S("fc.arr.aviso", "Avisar al cirujano de vuelo", true, 10),
      S("fc.arr.remedir", "Volver a medir en 10 min", true, 10, { remedir: true }),
    ],
  },
  ajuste: (c, pts) => {
    if (c.pulsoIrregular) pts.arritmia += 10;
  },
  sinPrimeraLinea: "Sin medicamento de primera línea.",
  botiquin: [M("Metoprolol", "Oral · cardiaco", "Control de la FC")],
  avisosBotiquin: ["La cafeína (Vivarin 200 mg), el modafinilo 200 mg y la pseudoefedrina pueden subir la FC."],
  remedir: { minutos: 10, cierra: "Vuelve a tu rango personal" },
  escalar: [E("Sigue arriba de tu base después de 10 min en reposo", "urgente"), E("Pulso irregular", "urgente")],
  fuentes: ["news2", "esc2018", "nasa_botiquin"],
};

const PA_ALTA = {
  peligro: [{ id: "organo", texto: "PA de 180/110 o más con dolor de pecho, falta de aire, visión borrosa nueva, debilidad o dificultad para hablar" }],
  preguntas: [
    P("a1", "¿Tienes dolor de pecho, falta de aire, visión borrosa nueva, debilidad o dificultad para hablar?", {}, {}, { peligro: true, marca: ["organo_blanco", "dolor_pecho"] }),
    P("a2", "¿Tienes dolor en alguna parte ahora?", { dolor: 3 }),
    P("a3", "¿Estás estresado o acabas de pasar una situación tensa?", { estres: 3 }),
    P("a4", "¿Tomaste pseudoefedrina, cafeína u otro medicamento hoy?", { medicamento: 3 }),
    P("a5", "¿El brazalete estaba bien puesto y estabas quieto al medir?", {}, { medicion: 3 }),
  ],
  causas: [
    C("estres", "Estrés", "El estrés sube la presión por minutos u horas.", 2, "pronam"),
    C("dolor", "Dolor", "El dolor sube la presión; baja al tratarlo.", 1, "pronam"),
    C("medicamento", "Medicamento o cafeína", "La pseudoefedrina y la cafeína suben la presión.", 1, "pronam,nasa_botiquin"),
    C("medicion", "Error al medir", "Un brazalete mal puesto o moverte da lecturas altas.", 1, "pronam"),
    C("hipertension", "Presión alta sostenida", "Si sigue alta en varias mediciones bien hechas, es hipertensión.", 1, "pronam"),
  ],
  planes: {
    estres: [
      S("pa.a.sentar", "Sentarte 5 min sin hablar", true),
      S("pa.a.tres", "Medir 3 veces con 1 a 2 min de diferencia y promediar las 2 últimas", true, 10),
      S("pa.a.causa", "Tratar la causa: analgésico si es dolor, respiración lenta si es estrés, suspender el descongestionante"),
      S("pa.a.remedir", "Volver a medir en 30 min", true, 30, { remedir: true }),
    ],
    dolor: "estres", medicamento: "estres", medicion: "estres", hipertension: "estres",
  },
  botiquin: [PARACETAMOL, IBUPROFENO, M("Lisinopril", "Oral · cardiaco", "Presión alta"), M("Metoprolol", "Oral · cardiaco", "Presión alta y FC")],
  avisosBotiquin: ["PRONAM: no des antihipertensivos debajo de la lengua. En urgencia sin daño a órgano, baja la presión poco a poco en 24 a 48 horas."],
  remedir: { minutos: 30, cierra: "Vuelve a menos de 130/85" },
  escalar: [E("180/110 o más sin síntomas", "urgente"), E("180/110 o más con síntomas", "critico")],
  fuentes: ["pronam", "nasa_botiquin"],
};

const PA_BAJA = {
  peligro: [
    { id: "desmayo", texto: "Desmayo", nivel: "urgente" },
    { id: "confusion", texto: "Confusión" },
    { id: "piel", texto: "Piel fría y sudorosa" },
    { id: "sis90", texto: "Sistólica de 90 o menos", nivel: "urgente", sigue: true, dato: (c) => num(L(c).sistolica) != null && L(c).sistolica <= 90 },
  ],
  preguntas: [
    P("b1", "¿Sentiste que te ibas a desmayar o perdiste la conciencia?", {}, {}, { peligro: true, nivel: "urgente", marca: ["desmayo"] }),
    P("b2", "¿Te acabas de levantar, girar o cambiar de postura?", { ortostatica: 3 }, { ortostatica: -2 }),
    P("b3", "¿Acabas de pasar un susto, dolor fuerte o estrés intenso?", { vasovagal: 3 }, { vasovagal: -1 }, { marca: ["susto"] }),
    P("b4", "¿Hoy tomaste menos agua de lo normal, vomitaste o sudaste mucho?", { deshidratacion: 3 }, { deshidratacion: -1 }, { marca: ["poca_agua"] }),
    P("b5", "¿Tomaste algún medicamento en las últimas 6 horas?", { medicamento: 2 }, { medicamento: -2 }),
  ],
  causas: [
    C("vasovagal", "Reacción vasovagal", "Desmayo por susto, dolor o miedo; el más común y casi siempre benigno.", 2, "esc2018"),
    C("deshidratacion", "Deshidratación", "Con poca agua baja el volumen de sangre y la presión.", 2, "esc2018"),
    C("ortostatica", "Cambio de postura", "Al pararte la sangre baja a las piernas; en microgravedad casi no ocurre.", 1, "esc2018,ortostatica"),
    C("medicamento", "Medicamento", "Algunos medicamentos bajan la presión.", 1, "esc2018"),
    C("infeccion", "Infección", "Una infección puede bajar la presión.", 1, "news2,esc2018"),
  ],
  planes: {
    vasovagal: [
      S("pa.b.quieto", "Quedarte quieto", true),
      S("pa.b.piernas", "Cruzar las piernas y apretar los músculos 30 segundos (maniobra de contrapresión)"),
      S("pa.b.agua", "Tomar agua"),
      S("pa.b.remedir", "Volver a medir en 10 min", true, 10, { remedir: true }),
    ],
    deshidratacion: [
      S("pa.d.sal", "Tomar agua con sal o electrolitos", true),
      S("pa.d.nota", "Anotar cuánto tomaste"),
      S("pa.d.remedir", "Volver a medir en 30 min", true, 30, { remedir: true }),
    ],
    ortostatica: [
      S("pa.o.sentar", "Sentarte o acostarte", true),
      S("pa.o.piernas", "Piernas arriba"),
      S("pa.o.sal", "Agua y sal"),
      S("pa.o.prueba", "Hacer la prueba ortostática", true, 15, { href: "/pruebas?t=ortostatica" }),
    ],
    medicamento: [
      S("pa.m.anotar", "Anotar cuál y la hora", true),
      S("pa.m.repetir", "No repetir la dosis"),
      S("pa.m.aviso", "Avisar al cirujano de vuelo"),
    ],
    infeccion: abrir("temp"),
  },
  ajuste: (c, pts) => {
    if (["luna", "marte", "regreso"].includes(c.fase)) pts.ortostatica += 3;
  },
  sinPrimeraLinea: "Ninguno; el plan es líquidos y postura.",
  botiquin: [],
  remedir: { minutos: 10, cierra: "La sistólica sube arriba de 100" },
  escalar: [E("Sistólica de 90 o menos que no sube en 15 min, o desmayo", "urgente"), E("Desmayo con lesión, dolor de pecho o falta de aire", "critico")],
  fuentes: ["esc2018", "ortostatica", "news2"],
};

const FR = {
  clave: "fr", titulo: TITULOS.fr,
  peligro: [
    { id: "fr_extrema", texto: "FR de 25 o más, u 8 o menos", dato: (c) => num(L(c).frec_resp) != null && (L(c).frec_resp >= 25 || L(c).frec_resp <= 8) },
    { id: "spo2_baja", texto: "SpO₂ bajando al mismo tiempo", dato: (c) => num(L(c).spo2) != null && L(c).spo2 < 94 && num(L(c).frec_resp) >= 21 },
    { id: "labios", texto: "Labios morados" },
    { id: "pecho", texto: "Dolor de pecho" },
  ],
  preguntas: [
    P("p1", "¿Tienes dolor de pecho o los labios morados?", {}, {}, { peligro: true, marca: ["dolor_pecho", "organo_blanco"] }),
    P("p2", "¿Hiciste ejercicio hace poco?", { ejercicio: 4 }),
    P("p3", "¿Te sientes ansioso o con hormigueo en manos o boca?", { ansiedad: 3 }),
    P("p4", "¿Otros tripulantes tienen dolor de cabeza o respiran rápido?", { co2: 4 }, {}, { marca: ["sintomas_tripulacion"] }),
    P("p5", "¿Tienes fiebre o tos?", { infeccion: 3 }),
    P("p6", "¿Tienes silbido al respirar o el pecho apretado?", { broncoespasmo: 3 }),
  ],
  causas: [
    C("ejercicio", "Esfuerzo reciente", "Respirar rápido después del ejercicio es normal y baja en reposo.", 2, "news2"),
    C("ansiedad", "Ansiedad", "La ansiedad acelera la respiración y da hormigueo en manos y boca.", 2, "dsm5"),
    C("co2", "CO₂ alto en la cabina", "Con más CO₂ el cuerpo respira más rápido.", 1, "ochmo_co2"),
    C("infeccion", "Infección respiratoria", "Es la infección más común en vuelo.", 1, "crucian2016"),
    C("broncoespasmo", "Bronquios cerrados", "El silbido y el pecho apretado indican bronquios cerrados.", 0, "nasa_botiquin"),
  ],
  planes: {
    ansiedad: [
      S("fr.resp", "Respirar lento, 4 segundos al inhalar y 6 al exhalar, por 3 min", true, 3),
      S("fr.co2", "Revisar el CO₂ de la cabina"),
      S("fr.remedir", "Volver a medir en 10 min", true, 10, { remedir: true }),
    ],
    co2: abrir("cabina"),
    ejercicio: [
      S("fr.ej.pausa", "Detener el ejercicio y quedarte en reposo", true),
      S("fr.ej.remedir", "Volver a medir en reposo en 15 min", true, 15, { remedir: true }),
    ],
    infeccion: abrir("temp"),
    broncoespasmo: [
      S("fr.b.sentar", "Sentarte erguido", true),
      S("fr.b.aviso", "Avisar al cirujano de vuelo para el inhalador de rescate", true, 5),
      S("fr.b.remedir", "Volver a medir en 10 min", true, 10, { remedir: true }),
    ],
  },
  botiquin: [
    M("Albuterol inhalador", "Tópico e inyectable · respiración", "Rescate si hay silbido"),
    M("Fluticasona y salmeterol", "Tópico e inyectable · respiración", "Bronquios cerrados"),
    M("Benzonatato", "Oral", "Tos"),
    M("Dextrometorfano", "Conveniencia", "Tos", true),
  ],
  remedir: { minutos: 10, cierra: "Vuelve a 12–20 por minuto" },
  escalar: [E("No baja en 10 min, o SpO₂ de 93 o menos", "urgente")],
  fuentes: ["news2", "ochmo_co2", "crucian2016", "nasa_botiquin"],
};

const SPO2 = {
  clave: "spo2", titulo: TITULOS.spo2,
  nota: "Una lectura menor a 90 % del reloj se trata como emergencia hasta que el oxímetro de dedo la confirme o la descarte.",
  peligro: [
    { id: "sp90", texto: "SpO₂ menor a 90 %", sigue: true, dato: (c) => num(L(c).spo2) != null && L(c).spo2 < 90 && !(num(c.oximetro) >= 90) },
    { id: "conf", texto: "SpO₂ baja con confusión o falta de aire", dato: (c) => num(L(c).spo2) != null && L(c).spo2 < 94 && !!CI(c).confusion },
  ],
  preguntas: [
    P("p1", "¿Tienes falta de aire o confusión?", {}, {}, { peligro: true, marca: ["falta_aire"] }),
    P("p2", "¿El dato viene del reloj y te estabas moviendo?", { falsa: 4 }),
    P("p3", "¿Tienes las manos frías?", { falsa: 2 }),
    P("p4", "¿Otro tripulante tiene la SpO₂ baja o la cabina marca alerta de oxígeno o presión?", { cabina: 5 }),
    P("p5", "¿Tienes tos, fiebre o dolor al respirar?", { pulmon: 3 }),
  ],
  causas: [
    C("falsa", "Lectura falsa del reloj", "Los relojes miden la SpO₂ peor que un oxímetro de dedo, sobre todo cuando baja.", 3, "hearn2023"),
    C("cabina", "Oxígeno o presión de la cabina", "Una falla de oxígeno o presión afecta a toda la tripulación.", 1, "nasa_ambiente"),
    C("pulmon", "Problema del pulmón", "Una infección o un problema del pulmón baja el oxígeno.", 1, "oms_oximetria,crucian2016"),
  ],
  planes: {
    falsa: [
      S("sp.calentar", "Calentar las manos y quedarte quieto 1 min", true),
      S("sp.dedo", "Medir con el oxímetro de dedo", true, 5, { remedir: true }),
      S("sp.seguir", "Si se confirma, seguir el plan de cabina o de pulmón"),
    ],
    cabina: [
      S("sp.c.alarma", "Alarma a toda la tripulación", true),
      S("sp.c.mascara", "Ponerte la máscara de oxígeno", true),
      S("sp.c.proc", "Seguir el procedimiento de la nave", true),
    ],
    pulmon: [
      S("sp.p.sentar", "Sentarte erguido", true),
      S("sp.p.aviso", "Avisar al cirujano de vuelo", true, 5),
      S("sp.p.remedir", "Volver a medir en 5 min", true, 5, { remedir: true }),
    ],
  },
  sinPrimeraLinea: "Sin medicamento; primero confirma la lectura.",
  botiquin: [],
  remedir: { minutos: 5, cierra: "95 % o más con el oxímetro de dedo" },
  escalar: [E("Menos de 90 % confirmada", "critico"), E("Entre 90 y 93 % que no sube en 5 min", "urgente")],
  fuentes: ["oms_oximetria", "news2", "hearn2023"],
};

const TEMP = {
  clave: "temp", titulo: TITULOS.temp,
  contexto: "En misiones largas la temperatura en reposo sube cerca de 1 °C; se compara con tu base en vuelo.",
  contextoFuente: "stahn2017",
  peligro: [
    { id: "alta", texto: "Temperatura de 39.1 °C o más", dato: (c) => num(L(c).temperatura) >= 39.1 },
    { id: "baja", texto: "Temperatura de 35.0 °C o menos", dato: (c) => num(L(c).temperatura) != null && L(c).temperatura <= 35.0 },
    { id: "meningea", texto: "Fiebre con confusión, cuello rígido, manchas en la piel que no desaparecen al apretar o presión baja" },
  ],
  preguntas: [
    P("p1", "¿Tienes el cuello rígido, confusión o manchas que no desaparecen al apretar?", {}, {}, { peligro: true }),
    P("p2", "¿Hiciste ejercicio en la última hora?", { ejercicio: 4 }, {}, { marca: ["ejercicio"] }),
    P("p3", "¿Tienes tos, dolor de garganta o nariz tapada?", { respiratoria: 3 }),
    P("p4", "¿Tienes ardor al orinar o necesitas orinar más seguido?", { urinaria: 3 }),
    P("p5", "¿Tienes una herida, granos, ampollas o erupción nueva en la piel o la boca?", { piel: 3 }, {}, { marca: ["piel"] }),
    P("p6", "¿La cabina se siente caliente o húmeda?", { cabina: 2 }),
  ],
  causas: [
    C("ejercicio", "Calor por ejercicio", "En vuelo el cuerpo tarda más en soltar el calor del ejercicio.", 2, "stahn2017"),
    C("respiratoria", "Infección respiratoria", "La más común en vuelo: 0.97 por año de vuelo.", 2, "crucian2016"),
    C("piel", "Piel o herpes", "Erupciones 1.12 por año de vuelo; el herpes se reactivó en el 61 % en la ISS.", 2, "crucian2016,rooney2019"),
    C("urinaria", "Infección urinaria", "Ardor y ganas frecuentes de orinar.", 1, "crucian2016"),
    C("cabina", "Cabina caliente", "Fuera del rango NASA de 18 a 27 °C el cuerpo se calienta.", 1, "nasa3001"),
  ],
  planes: {
    ejercicio: [
      S("t.ej.pausa", "Detener el ejercicio y ponerte cerca de una salida de aire", true),
      S("t.ej.agua", "Tomar agua"),
      S("t.ej.cabina", "Revisar la temperatura de la cabina (rango NASA 18 a 27 °C)"),
      S("t.ej.remedir", "Volver a medir en 20 min", true, 20, { remedir: true }),
    ],
    cabina: "ejercicio",
    respiratoria: [
      S("t.inf.cada4", "Medir la temperatura cada 4 horas y anotarla", true, 240, { remedir: true }),
      S("t.inf.paracetamol", "Paracetamol si hay malestar"),
      S("t.inf.agua", "Tomar más agua"),
      S("t.inf.cubrebocas", "Cubrebocas y lavarse las manos"),
      S("t.inf.reporte", "Enviar reporte al cirujano de vuelo", true, 60),
    ],
    urinaria: "respiratoria",
    piel: "respiratoria",
  },
  botiquin: [
    PARACETAMOL, IBUPROFENO,
    M("Amoxicilina", "Oral · antibióticos", "Infección", false, { grupo: "penicilina" }),
    M("Azitromicina", "Oral · antibióticos", "Infección"),
    M("Doxiciclina", "Oral · antibióticos", "Infección"),
    M("Levofloxacino", "Oral · antibióticos", "Infección"),
    M("Nitrofurantoína", "Oral · antibióticos", "Vías urinarias"),
    M("Trimetoprim con sulfametoxazol", "Oral · antibióticos", "Infección"),
    M("Valaciclovir", "Oral", "Herpes"),
    M("Hidrocortisona 1 %", "Conveniencia", "Erupción con comezón", true),
    M("Loratadina", "Conveniencia", "Erupción con comezón", true),
    M("Fexofenadina", "Conveniencia", "Erupción con comezón", true),
  ],
  remedir: { minutos: 20, cierra: "Menos de 37.5 °C o dentro de tu base" },
  escalar: [E("1 °C o más sobre tu base en vuelo por más de 24 horas", "urgente"), E("Fiebre con FC alta o presión baja", "urgente")],
  fuentes: ["news2", "stahn2017", "crucian2016", "rooney2019", "nasa_botiquin"],
};

const CONCIENCIA = {
  clave: "conciencia", titulo: TITULOS.conciencia,
  limiteRespuestaMin: 2,
  peligro: [
    { id: "no_responde", texto: "No responde" },
    { id: "convulsion", texto: "Convulsión" },
    { id: "golpe", texto: "Golpe en la cabeza con vómito o somnolencia" },
    { id: "lado", texto: "Debilidad de un lado del cuerpo" },
    { id: "conf_spo2", texto: "Confusión con SpO₂ baja", dato: (c) => !!CI(c).confusion && num(L(c).spo2) != null && L(c).spo2 < 94 },
  ],
  nota: "Si no contestas la encuesta en 2 min, se trata como emergencia.",
  preguntas: [
    P("p1", "¿Te golpeaste la cabeza?", { golpe: 5 }, {}, { marca: ["golpe"] }),
    P("p2", "¿Tomaste zolpidem, zaleplon o prometazina en las últimas 8 horas?", { medicamento: 4 }, {}, { marca: ["sedante"] }),
    P("p3", "¿Llevas menos de 3 días en el espacio y tienes náusea o mareo al mover la cabeza?", { mareo: 4 }),
    P("p4", "¿Otros tripulantes tienen dolor de cabeza o se sienten lentos?", { cabina: 4 }, {}, { marca: ["sintomas_tripulacion"] }),
    P("p5", "¿Dormiste menos de 5 horas?", { sueno: 2 }),
  ],
  causas: [
    C("mareo", "Mareo espacial", "Le pasa al 50–80 % al llegar al espacio.", 2, "nasa_sensoriomotor,davis_mareo"),
    C("medicamento", "Medicamento que da sueño", "Zolpidem, zaleplon y prometazina dan sueño y lentitud.", 1, "nasa_botiquin,cowings"),
    C("sueno", "Poco sueño", "Dormir poco baja la alerta y la reacción.", 1, "pvtb"),
    C("cabina", "CO₂ de la cabina", "El CO₂ alto da dolor de cabeza y lentitud.", 1, "ochmo_co2"),
    C("golpe", "Golpe en la cabeza", "Un golpe puede dar confusión horas después.", 0, "news2"),
    C("presion", "Presión baja", "Con la presión baja llega menos sangre al cerebro.", 0, "esc2018"),
  ],
  planes: {
    mareo: [
      S("cc.vista", "Fijar la cabeza y la vista en un punto", true),
      S("cc.agua", "Tomar agua a sorbos"),
      S("cc.oficial", "Avisar al oficial médico para el medicamento", true, 15),
      S("cc.remedir", "Volver a evaluar en 2 horas", false, 120, { remedir: true }),
    ],
    medicamento: [
      S("cc.m.tareas", "No hacer tareas críticas hasta que pase el efecto", true),
      S("cc.m.companero", "Que otro tripulante confirme cómo estás", true, 15),
      S("cc.m.pvt", "Prueba de reacción de 3 min al despertar bien", false, null, { href: "/pruebas?t=reaccion" }),
    ],
    sueno: "medicamento",
    golpe: [
      S("cc.g.acompanado", "Quedarte acompañado", true),
      S("cc.g.oficial", "Avisar al oficial médico ahora", true, 5),
      S("cc.g.remedir", "Volver a evaluar en 30 min", true, 30, { remedir: true }),
    ],
    cabina: abrir("cabina"),
    presion: abrir("pa"),
  },
  ajuste: (c, pts) => {
    if (num(L(c).sistolica) != null && L(c).sistolica <= 100) pts.presion += 3;
  },
  botiquin: [
    M("Prometazina 25 mg", "Oral e inyectable", "Tratamiento principal de la NASA para el mareo espacial; se da cuando aparecen los síntomas"),
    M("Meclizina", "Oral", "Mareo"),
    M("Ondansetrón", "Oral", "Náusea"),
    M("Flumazenil", "Emergencia", "Solo el oficial médico"),
    M("Naloxona", "Emergencia", "Solo el oficial médico"),
  ],
  avisosBotiquin: ["La prometazina da sueño y baja el desempeño."],
  remedir: { minutos: 30, cierra: "Alerta y sin mareo" },
  escalar: [E("Confusión que no mejora en 30 min", "urgente"), E("Golpe en la cabeza con síntomas", "critico")],
  fuentes: ["news2", "nasa_sensoriomotor", "davis_mareo", "cowings", "prometazina_amhp2025", "nasa_botiquin", "wotring2015"],
};

const SUENO = {
  clave: "sueno", titulo: TITULOS.sueno,
  contexto: "La NASA programa 8.5 horas de sueño; el promedio real en la ISS fue de unas 6 horas.",
  contextoFuente: "barger2014",
  peligro: [
    { id: "dormido", texto: "Quedarte dormido en una tarea crítica" },
    { id: "lapsos", texto: "3 o más lapsos (355 ms o más) en la prueba de reacción antes de una caminata espacial o maniobra", dato: (c) => num(c.lapsos) >= 3 && !!c.tareaCritica },
  ],
  preguntas: [
    P("p1", "¿Cambió tu horario en los últimos 3 días (acoplamiento, caminata, turno)?", { horario: 4 }, {}, { marca: ["horario"] }),
    P("p2", "¿Hubo ruido, luz o calor en tu zona de descanso?", { ambiente: 3 }, {}, { marca: ["ambiente"] }),
    P("p3", "¿Te quedaste preocupado o pensando antes de dormir?", { estres: 3 }),
    P("p4", "¿Tomaste cafeína después de mediodía o modafinilo?", { estimulante: 3 }),
    P("p5", "¿Te despertó dolor de cabeza o de espalda?", { dolor: 2 }),
    P("p6", "¿Dormiste mal aunque tu zona estaba bien (sin ruido, luz ni calor) 3 noches o más esta semana?", { insomnio: 3 }, {}, { requiere: { p2: "no" } }),
  ],
  causas: [
    C("horario", "Cambio de horario", "Los cambios de turno mueven tu reloj biológico.", 2, "barger2014"),
    C("ambiente", "Ambiente de descanso", "El ruido, la luz y el calor cortan el sueño en la nave.", 2, "ochmo_tb041"),
    C("estres", "Preocupación", "Pensar o preocuparte al acostarte retrasa el sueño.", 1, "dsm5"),
    C("estimulante", "Cafeína o modafinilo", "La cafeína sigue activa varias horas.", 1, "barger2014"),
    C("dolor", "Dolor", "El dolor de cabeza o de espalda despierta.", 0, "barger2014"),
    C("insomnio", "Posible insomnio", "Solo se considera insomnio cuando duermes mal con buenas condiciones para dormir.", 0, "dsm5"),
  ],
  planes: {
    horario: [
      S("s.lentes", "Una hora antes de dormir, lentes que bloquean la luz azul y luz cálida", true),
      S("s.antifaz", "Antifaz y tapones"),
      S("s.zona", "Revisar temperatura y CO₂ de tu zona"),
      S("s.cafeina", "Nada de cafeína 6 horas antes de dormir"),
      S("s.despertar", "Al despertar, luz azul brillante y prueba de reacción de 3 min", true, null, { remedir: true, href: "/pruebas?t=reaccion" }),
    ],
    ambiente: "horario", estres: "horario", estimulante: "horario", dolor: "horario",
    insomnio: [
      S("s.lentes", "Una hora antes de dormir, lentes que bloquean la luz azul y luz cálida", true),
      S("s.antifaz", "Antifaz y tapones"),
      S("s.zona", "Revisar temperatura y CO₂ de tu zona"),
      S("s.cafeina", "Nada de cafeína 6 horas antes de dormir"),
      S("s.despertar", "Al despertar, luz azul brillante y prueba de reacción de 3 min", true, null, { remedir: true, href: "/pruebas?t=reaccion" }),
      S("s.insomnio", "Avisar al cirujano de vuelo: posible insomnio", true),
    ],
  },
  botiquin: [
    M("Melatonina 3 mg", "Conveniencia", "Dormir", true),
    M("Zaleplon 10 mg", "Conveniencia", "Dormir", true, { advertencia: "Se avisa si 2 o más tripulantes lo toman la misma noche." }),
    M("Zolpidem 5 mg", "Conveniencia", "Dormir", true, { advertencia: "Se avisa si 2 o más tripulantes lo toman la misma noche." }),
    M("Cafeína 200 mg", "Conveniencia", "Alerta", true),
    M("Modafinilo 200 mg", "Oral", "Alerta"),
  ],
  remedir: { minutos: null, cierra: "Reacción dentro de tu normal en la prueba de 3 min" },
  escalar: [E("3 noches seguidas debajo de tu base", "urgente"), E("Lapsos antes de una tarea crítica", "urgente")],
  fuentes: ["aasm", "pvtb", "barger2014", "dsm5", "ochmo_tb041", "wotring2015", "nasa_botiquin"],
};

const ANIMO = {
  clave: "animo", titulo: TITULOS.animo,
  contexto: "WHO-5 diario (52 % o menos = bienestar bajo). PHQ-9 y GAD-7 semanales (10 o más = moderado, 15 o más = alto). Son tamizaje, nunca diagnóstico.",
  contextoFuente: "who5,phq9,gad7",
  peligro: [{ id: "phq9", texto: "Cualquier respuesta distinta de 0 en la pregunta 9 del PHQ-9", conductual: true, dato: (c) => num(c.phq9Item9) > 0 }],
  preguntas: [
    P("p1", "¿Dormiste mal 2 o más noches esta semana?", { sueno: 3 }),
    P("p2", "¿Tuviste un conflicto o tensión con alguien de la tripulación o de Tierra?", { relaciones: 3 }),
    P("p3", "¿Estás preocupado por tu familia o por algo en la Tierra?", { familia: 3 }),
    P("p4", "¿Sientes que tienes demasiado trabajo o que los días son monótonos?", { carga: 3 }),
    P("p5", "¿Sientes miedo o nervios por algo de la misión?", { ansiedad: 3 }, {}, { marca: ["ansiedad"] }),
    P("p6", "¿Empezaste un medicamento nuevo en las últimas 2 semanas (prednisona, antibiótico, modafinilo, inhalador, somnífero)?", { medicamento: 4 }, {}, { marca: ["medicamento_nuevo"] }),
    P("p7", "¿Recibiste una mala noticia o perdiste a alguien recientemente?", { duelo: 4 }, {}, { marca: ["mala_noticia"] }),
    P("p8", "¿Viviste una emergencia o un susto fuerte a bordo en el último mes?", { estres_agudo: 4 }, {}, { marca: ["emergencia_bordo"] }),
    P("p9", "¿Te llega de golpe un miedo muy fuerte con el corazón acelerado o falta de aire?", { panico: 3 }, {}, { marca: ["panico"] }),
  ],
  causas: [
    C("sueno", "Mal sueño", "Dormir mal baja el ánimo al día siguiente.", 1, "basner2014"),
    C("relaciones", "Tensión con otros", "En un grupo aislado los conflictos pesan más.", 1, "nasa_salud_mental"),
    C("familia", "Preocupación por la familia", "La distancia con la familia es un estrés frecuente en misiones largas.", 1, "nasa_salud_mental"),
    C("carga", "Carga o monotonía", "Demasiado trabajo o días iguales desgastan el ánimo.", 1, "nasa_salud_mental"),
    C("ansiedad", "Nervios por la misión", "El miedo a algo de la misión sube el estrés.", 1, "gad7"),
    C("medicamento", "Medicamento", "Antes de pensar en un trastorno se descarta un medicamento: estimulantes, esteroides, antibióticos y salbutamol (el albuterol del inhalador).", 0, "dsm5"),
    C("duelo", "Duelo", "Una pérdida reciente explica el ánimo bajo; se trata como duelo.", 0, "dsm5"),
    C("estres_agudo", "Estrés después de una emergencia", "Después de una emergencia es común dormir mal o sobresaltarse unas semanas.", 0, "dsm5"),
    C("panico", "Ataque de pánico", "Miedo fuerte de golpe con el corazón acelerado; antes se descartan corazón y pulmones.", 0, "dsm5"),
  ],
  planes: {
    sueno: [
      S("an.conferencia", "Pedir una conferencia psicológica privada", true),
      S("an.familia", "Pedir una llamada privada con la familia"),
      S("an.ejercicio", "Completar el ejercicio del día"),
      S("an.libre", "Un tiempo libre: música, película o ver la Tierra"),
      S("an.resp", "Respiración lenta de 3 min si hay ansiedad", false, 3),
      S("an.who5", "Repetir el WHO-5 en 3 días", true, 4320, { remedir: true, href: "/pruebas?t=who5" }),
    ],
    relaciones: "sueno", familia: "sueno", carga: "sueno", ansiedad: "sueno",
    medicamento: [
      S("an.m.anotar", "Anotar el medicamento y desde cuándo", true),
      S("an.m.aviso", "Avisar al cirujano de vuelo para valorar cambiarlo", true, 60),
      S("an.who5", "Repetir el WHO-5 en 3 días", true, 4320, { remedir: true, href: "/pruebas?t=who5" }),
    ],
    duelo: [
      S("an.d.familia", "Llamada privada con la familia", true),
      S("an.d.conferencia", "Conferencia psicológica privada", true),
      S("an.d.carga", "Bajar la carga de trabajo ese día si es posible"),
      S("an.d.revisar", "Revisar en 1 semana", false, 10080, { remedir: true }),
    ],
    estres_agudo: [
      S("an.e.chequeo", "Chequeo de ánimo y sueño para toda la tripulación a los 3 días, 2 semanas y 1 mes"),
      S("an.e.conferencia", "Conferencia privada si hay recuerdos que se meten solos o sobresalto", true),
    ],
    panico: [
      S("an.p.companero", "Que un compañero se quede contigo", true),
      S("an.p.resp", "Respiración lenta 4-6 por 3 min", true, 3),
      S("an.p.medir", "Volver a medir FC, FR y SpO₂", true, 5, { remedir: true }),
      S("an.p.emergencia", "Si hay dolor de pecho o la SpO₂ baja, plan de emergencia"),
    ],
  },
  excluir: (c, marcas) => {
    const pecho = marcas.has("dolor_pecho");
    const sp = c.spo2Bajo2h;
    if (!pecho && !sp) return null;
    return { ids: ["panico"], abrir: pecho ? "fc" : "spo2", texto: pecho ? "Respondiste dolor de pecho: primero revisa tu corazón." : "Tu SpO₂ bajó de 94 % en las últimas 2 horas: primero revisa tu oxígeno." };
  },
  botiquin: [
    M("Sertralina", "Oral · salud conductual", "Ánimo"),
    M("Venlafaxina", "Oral · salud conductual", "Ánimo"),
    M("Lorazepam", "Oral · salud conductual", "Ansiedad"),
    M("Aripiprazol", "Oral · salud conductual", "Salud conductual"),
    M("Diazepam", "Inyectable", "Crisis"),
    M("Ziprasidona", "Inyectable", "Crisis"),
  ],
  textoNoLibre: "Solo los indica el cirujano de vuelo o el psiquiatra de Tierra",
  remedir: { minutos: 4320, cierra: "WHO-5 arriba de 52" },
  escalar: [E("PHQ-9 o GAD-7 de 15 o más, o WHO-5 bajo 2 semanas seguidas", "urgente"), E("Pregunta 9 del PHQ-9", "critico")],
  fuentes: ["who5", "phq9", "gad7", "dsm5", "nasa_salud_mental"],
};

const RADIACION = {
  clave: "radiacion", titulo: TITULOS.radiacion,
  contexto: "Límite NASA: 600 mSv en la carrera y 250 mSv por tormenta solar. La dosis acumulada es un riesgo de años y no sube el nivel por sí sola.",
  contextoFuente: "nasa3001,ochmo",
  peligro: [
    { id: "eva", texto: "Alerta de tormenta solar durante una caminata espacial", dato: (c) => !!c.tormentaActiva && !!c.tareaCritica },
    { id: "nausea", texto: "Náusea o vómito en las horas después de una tormenta" },
  ],
  preguntas: [
    P("p1", "¿Hubo alerta de tormenta solar en las últimas 48 horas?", { radiacion: 4 }, { radiacion: -4 }, { auto: (c) => (c.tormenta48h == null ? null : c.tormenta48h ? "si" : "no") }),
    P("p2", "¿Llevas menos de 3 días en el espacio?", { mareo: 4 }, {}, { auto: (c) => (num(c.diaMision) == null ? null : c.diaMision < 3 ? "si" : "no") }),
    P("p3", "¿La náusea empeora al mover la cabeza?", { mareo: 3 }),
    P("p4", "¿Tienes la piel roja o con ardor en una zona expuesta?", { radiacion: 3 }),
    P("p5", "¿Comiste algo distinto o tienes diarrea?", { estomago: 3 }, {}, { marca: ["estomago"] }),
  ],
  causas: [
    C("radiacion", "Radiación", "La náusea en las horas después de una dosis alta es la primera señal.", 1, "ochmo"),
    C("mareo", "Mareo espacial", "Es común en los primeros días en el espacio.", 1, "nasa_sensoriomotor"),
    C("estomago", "Estómago", "Algo que comiste o una infección del estómago.", 1, "crucian2016"),
  ],
  planes: {
    alerta: [
      S("r.blindada", "Ir a la zona blindada hasta que se levante la alerta", true, 10),
      S("r.eva", "Si estás en caminata, terminarla y volver a la nave", true),
      S("r.dosimetro", "Anotar la lectura del dosímetro", true),
      S("r.sintomas", "Encuesta de síntomas cada 6 horas por 2 días", false, 360),
    ],
    radiacion: [
      S("r.vomito", "Registrar la hora del primer vómito", true),
      S("r.agua", "Agua a sorbos"),
      S("r.aviso", "Aviso al cirujano de vuelo con la dosis medida", true, 30),
    ],
    mareo: abrir("conciencia"),
    estomago: [
      S("r.e.agua", "Tomar agua a sorbos", true),
      S("r.e.anotar", "Anotar qué comiste"),
      S("r.e.revisar", "Volver a evaluar en 6 horas", false, 360, { remedir: true }),
    ],
  },
  botiquin: [M("Ondansetrón 8 mg", "Oral", "Náusea"), M("Prometazina 25 mg", "Oral", "Náusea")],
  remedir: { minutos: 360, cierra: "Sin náusea y sin alerta activa" },
  escalar: [E("Dosis de la tormenta cerca de 250 mSv, o vómito después de la tormenta", "urgente"), E("Acercarte a 600 mSv de carrera", "info")],
  fuentes: ["nasa3001", "ochmo", "ochmo_tb020", "hera", "nasa_botiquin"],
};

const VISION = {
  clave: "vision", titulo: TITULOS.vision,
  contexto: "81 % de los astronautas revisados tras misiones largas tienen al menos una señal de SANS. Lo más común es ver borroso de cerca.",
  contextoFuente: "nasa_sans",
  peligro: [
    { id: "subita", texto: "Pérdida súbita de visión" },
    { id: "amsler", texto: "Mancha fija o líneas torcidas en la rejilla de Amsler", nivel: "urgente", sigue: true, dato: (c) => !!c.amslerAnormal },
    { id: "doble", texto: "Visión doble" },
  ],
  preguntas: [
    P("p1", "¿El cambio fue de repente, en minutos u horas?", {}, {}, { peligro: true, marca: ["organo_blanco", "perdida_vision"] }),
    P("p2", "¿Ves borroso solo de cerca?", { sans: 4 }),
    P("p3", "¿Tienes el ojo rojo, con dolor o sientes algo dentro?", { ojo: 4 }),
    P("p4", "¿Tienes los ojos secos o arenosos?", { seco: 3 }),
    P("p5", "¿Tienes dolor de cabeza y hay CO₂ alto en la cabina?", { co2: 3 }, {}, { marca: ["dolor_cabeza"] }),
  ],
  causas: [
    C("sans", "SANS", "Cambios del ojo por el líquido que sube a la cabeza en microgravedad.", 2, "nasa_sans"),
    C("seco", "Ojo seco", "El aire de la nave reseca los ojos.", 1, "nasa_ambiente"),
    C("ojo", "Ojo irritado o con algo dentro", "Una partícula o una infección del ojo.", 1, "nasa_botiquin"),
    C("co2", "CO₂ de la cabina", "El CO₂ alto da dolor de cabeza y visión borrosa.", 1, "ochmo_co2"),
  ],
  planes: {
    sans: [
      S("v.lentes", "Probar los lentes de anticipación espacial y anotar cuál aclara", true),
      S("v.amsler", "Prueba de agudeza y rejilla de Amsler", true, null, { href: "/pruebas?t=amsler" }),
      S("v.oct", "Reportar al cirujano de vuelo para adelantar el OCT", true, 1440),
      S("v.co2", "Revisar el CO₂ de la cabina"),
    ],
    ojo: [
      S("v.o.tallar", "No tallarte el ojo", true),
      S("v.o.lavar", "Lavar con solución salina o lágrimas artificiales", true),
      S("v.o.fluor", "Revisión con tira de fluoresceína por el oficial médico"),
    ],
    seco: [
      S("v.s.lagrimas", "Usar lágrimas artificiales", true),
      S("v.s.humedad", "Revisar la humedad de la cabina"),
      S("v.s.remedir", "Volver a revisar en 1 hora", false, 60, { remedir: true }),
    ],
    co2: abrir("cabina"),
  },
  botiquin: [
    M("Lágrimas artificiales Refresh y GenTeal", "Conveniencia", "Ojo seco", true),
    M("Moxifloxacino gotas", "Tópico e inyectable", "Infección del ojo"),
    M("Eritromicina pomada", "Tópico e inyectable", "Infección del ojo"),
    M("Tobramicina con dexametasona", "Tópico e inyectable", "Inflamación del ojo"),
    M("Tetracaína", "Tópico e inyectable", "Anestesia del ojo para revisión"),
    M("Fluoresceína", "Tópico e inyectable", "Revisión del ojo"),
  ],
  remedir: { minutos: 60, cierra: "Sin visión borrosa ni dolor de cabeza" },
  escalar: [E("Amsler anormal", "urgente"), E("Pérdida súbita", "critico")],
  fuentes: ["nasa_sans", "amsler", "ochmo_co2", "nasa_botiquin"],
};

const HUESOS = {
  clave: "huesos", titulo: TITULOS.huesos,
  contexto: "Se pierde 1–2 % de hueso por mes; el ejercicio diario es obligatorio. Al llegar al espacio, el 52–68 % tiene dolor de espalda, leve en la mayoría.",
  contextoFuente: "nasa_osea",
  peligro: [
    { id: "colico", texto: "Dolor fuerte en el costado o la espalda baja que baja a la ingle, con sangre en la orina o fiebre", nivel: "urgente" },
    { id: "orinar", texto: "No poder orinar", nivel: "urgente" },
    { id: "deformidad", texto: "Golpe con deformidad" },
  ],
  preguntas: [
    P("p1", "¿Tienes sangre en la orina, fiebre con dolor en el costado o no puedes orinar?", {}, {}, { peligro: true, nivel: "urgente", marca: ["sangre_orina"] }),
    P("p2", "¿El dolor es en la espalda baja y empezó en tus primeros días en el espacio?", { espalda: 4 }),
    P("p3", "¿El dolor va y viene en oleadas y baja hacia la ingle?", { rinon: 4 }, {}, { marca: ["costado"] }),
    P("p4", "¿Tu orina está oscura o tomaste poca agua?", { deshidratacion: 3, rinon: 1 }, {}, { marca: ["poca_agua"] }),
    P("p5", "¿Te lastimaste usando un equipo de ejercicio?", { lesion: 4 }),
    P("p6", "¿Te faltaron sesiones de ejercicio esta semana?", { condicion: 2 }),
  ],
  causas: [
    C("espalda", "Dolor de espalda espacial", "La columna se estira en microgravedad y duele en los primeros días.", 2, "nasa_osea"),
    C("condicion", "Falta de ejercicio", "Sin ejercicio se pierde hueso y músculo.", 1, "nasa_osea"),
    C("deshidratacion", "Poca agua", "Con poca agua la orina se concentra y favorece piedras.", 1, "nasem2018"),
    C("lesion", "Lesión con el equipo", "Un mal movimiento con el equipo de ejercicio.", 1, "nasa_osea"),
    C("rinon", "Piedra en el riñón", "El calcio que suelta el hueso sube en la orina y forma piedras.", 0, "nasem2018"),
  ],
  planes: {
    espalda: [
      S("h.fetal", "Posición fetal, rodillas al pecho 2 min, 3 veces", true),
      S("h.ibuprofeno", "Ibuprofeno si el dolor no deja trabajar"),
      S("h.core", "Ejercicios de abdomen y espalda en la sesión del día"),
      S("h.revisar", "Revisar mañana", false, 1440, { remedir: true }),
    ],
    rinon: [
      S("h.r.agua", "Tomar más agua", true),
      S("h.r.eco", "Aviso al cirujano de vuelo para ecografía a bordo", true, 30),
      S("h.r.analgesico", "Analgésico según indique el médico"),
    ],
    condicion: [S("h.c.ejercicio", "Completar el ejercicio del día", true, null, { remedir: true })],
    deshidratacion: [
      S("h.d.agua", "Tomar más agua", true),
      S("h.d.orina", "Revisar el color de la orina mañana", false, 1440, { remedir: true }),
    ],
    lesion: [
      S("h.l.equipo", "Dejar de usar ese equipo", true),
      S("h.l.reposo", "Reposo de la zona"),
      S("h.l.aviso", "Avisar al cirujano de vuelo", true, 60),
    ],
  },
  botiquin: [
    IBUPROFENO, PARACETAMOL,
    M("Ketorolaco", "Inyectable", "Dolor fuerte"),
    M("Hidrocodona con paracetamol", "Oral", "Dolor fuerte"),
    M("Tamsulosina", "Oral", "Piedra en el riñón"),
  ],
  avisosBotiquin: ["Contra piedras en el riñón, el citrato de potasio es la contramedida aprobada para vuelo."],
  remedir: { minutos: 1440, cierra: "Ejercicio del día al 80 % o más y sin dolor" },
  escalar: [E("Dolor tipo cólico con sangre o fiebre", "urgente"), E("No poder orinar", "urgente")],
  fuentes: ["nasa_osea", "nasem2018", "leblanc2013", "nasa_botiquin"],
};

const CABINA = {
  clave: "cabina", titulo: TITULOS.cabina,
  contexto: "Límite: CO₂ de 3 mmHg o menos en promedio por hora. De 2.8 a 4.5 mmHg da dolor de cabeza; arriba de 4.5, cansancio, mal sueño y náusea. Temperatura y humedad entre 18 °C con 75 % y 27 °C con 25 %.",
  contextoFuente: "ochmo_co2,nasa3001",
  compartida: true,
  peligro: [{ id: "alarma", texto: "Alarma de incendio, despresurización o tóxico (amoniaco)", alarma: true, dato: (c) => !!c.alarmaNave }],
  preguntas: [
    P("p1", "¿Tienes dolor de cabeza ahora?", { co2: 3 }, {}, { marca: ["dolor_cabeza"] }),
    P("p2", "¿Hay más de una persona haciendo ejercicio en el mismo módulo?", { co2: 3 }),
    P("p3", "¿El ventilador de tu zona suena distinto o no se siente aire?", { ventilacion: 3 }),
    P("p4", "¿Estás sudando o tienes frío sin hacer ejercicio?", { temperatura: 3 }),
  ],
  causas: [
    C("co2", "CO₂ alto", "Más gente o ejercicio en un módulo sube el CO₂.", 2, "ochmo_co2"),
    C("ventilacion", "Ventilación", "Sin flujo de aire el CO₂ se junta alrededor de tu cabeza.", 1, "ochmo_co2"),
    C("temperatura", "Temperatura o humedad", "Fuera de 18–27 °C el cuerpo se siente mal.", 1, "nasa3001"),
  ],
  planes: {
    co2: [
      S("cb.modulo", "Ir a un módulo con mejor ventilación", true),
      S("cb.pausa", "Pausar el ejercicio en ese módulo"),
      S("cb.sistema", "Revisar el sistema que limpia el CO₂ y reportar a Tierra", true, 30),
      S("cb.paracetamol", "Paracetamol si hay dolor de cabeza"),
      S("cb.remedir", "Volver a medir el CO₂ en 1 hora", true, 60, { remedir: true }),
    ],
    ventilacion: [
      S("cb.v.modulo", "Ir a otro módulo", true),
      S("cb.v.reporte", "Revisar el ventilador de tu zona y reportarlo", true, 30),
      S("cb.v.remedir", "Volver a medir el CO₂ en 1 hora", true, 60, { remedir: true }),
    ],
    temperatura: [
      S("cb.t.ajustar", "Ajustar la temperatura del módulo", true),
      S("cb.t.humedad", "Revisar la humedad"),
      S("cb.t.remedir", "Volver a medir en 30 min", false, 30, { remedir: true }),
    ],
  },
  botiquin: [PARACETAMOL],
  remedir: { minutos: 60, cierra: "CO₂ de 3 mmHg o menos" },
  escalar: [E("CO₂ arriba de 4.5 mmHg o síntomas en 2 o más tripulantes", "urgente"), E("Alarma de la nave", "critico")],
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
  if (m.nivelInicial && RANGO_NIVEL[ev.nivel] > RANGO_NIVEL[m.nivelInicial]) motivos.push("El nivel subió");
  if (m.peor || notas.some((n) => n.motivo === "peor")) motivos.push("Te sientes peor");
  if (ev.empate) motivos.push("Dos causas quedaron empatadas");
  if ((m.remediciones || []).some((r) => r.resultado !== "resuelto")) motivos.push("Volver a medir no lo resolvió");
  const sust = {};
  for (const n of notas) if (n.alt) sust[n.paso] = (sust[n.paso] || 0) + 1;
  if (Object.values(sust).some((x) => x >= 2) || Object.values(sust).reduce((a, b) => a + b, 0) >= 2) motivos.push("Cambiaste pasos por su alternativa");
  return { mostrar: motivos.length > 0, motivos, pruebas: ev.ficha.pruebasRecomendadas || PRUEBAS_RECOMENDADAS[ev.clave] || [] };
}

export const PLAN_EMERGENCIA = [
  S("em.avisar", "Avisar ahora al oficial médico de la tripulación", true, 2),
  S("em.acompanado", "Que un compañero se quede contigo", true),
  S("em.procedimiento", "Seguir el procedimiento de emergencia de la nave", true),
  S("em.remedir", "Volver a medir tus signos en 5 min", true, 5, { remedir: true }),
];
export const PLAN_CONDUCTUAL = [
  S("cd.conferencia", "Abrir la conferencia psicológica privada", true, 2),
  S("cd.oficial", "Avisar al oficial médico de la tripulación", true, 2),
];
export const PLAN_ALARMA = [S("al.salvo", "Confirmar \"estoy a salvo\"", true, 2)];

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
  return { ...f.ramas[rama], clave, titulo: rama === "baja" ? "Presión arterial baja" : "Presión arterial alta", rama };
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

const NOMBRE_CORTO = { fc: "FC", pa: "presión", fr: "FR", spo2: "SpO₂", temp: "temperatura" };

function contraBase(v, rango, unidad) {
  if (v == null || !rango || rango[0] == null) return "";
  const [lo, hi] = rango;
  const r = `${f1(lo)}–${f1(hi)}`;
  if (v > hi) return `, ${f1(v - hi)} ${unidad} arriba de tu base (${r})`;
  if (v < lo) return `, ${f1(lo - v)} ${unidad} abajo de tu base (${r})`;
  return `, dentro de tu base (${r})`;
}

export function frase(clave, ctx = {}) {
  const l = L(ctx), ci = CI(ctx), t = ctx.tarjeta || {};
  if (clave === "fc") return `Tu FC está en ${l.fc ?? "—"} lpm${contraBase(num(l.fc), ctx.rango, "lpm")}.`;
  if (clave === "pa") {
    const s = num(l.sistolica), d = num(l.diastolica);
    const b = contraBase(s, ctx.rango, "mmHg");
    return `Tu presión está en ${s ?? "—"}/${d ?? "—"} mmHg${b ? `; la sistólica está${b.slice(1)}` : ""}.`;
  }
  if (clave === "fr") return `Respiras ${l.frec_resp ?? "—"} veces por minuto${contraBase(num(l.frec_resp), ctx.rango, "rpm")}.`;
  if (clave === "spo2") return `Tu SpO₂ está en ${l.spo2 ?? "—"} %${contraBase(num(l.spo2), ctx.rango, "puntos")}${num(ctx.oximetro) != null ? `; el oxímetro de dedo marcó ${ctx.oximetro} %` : ""}.`;
  if (clave === "temp") return `Tu temperatura está en ${l.temperatura ?? "—"} °C${contraBase(num(l.temperatura), ctx.rango, "°C")}.`;
  if (clave === "conciencia") return ci.confusion ? "Reportaste confusión." : ci.mareo_de_pie ? "Reportaste mareo." : "Estás alerta y sin mareo.";
  if (clave === "sueno") {
    const h = num(ctx.horasSueno);
    const n = num(ctx.noches);
    const r = num(ctx.reaccion), rb = num(ctx.reaccionBase);
    const partes = [`Dormiste ${h != null ? f1(h) : "—"} h anoche`];
    if (n) partes.push(`llevas ${n} noches con menos de 7 h`);
    if (r != null && rb) {
      const pct = Math.round(((r - rb) / rb) * 100);
      partes.push(pct === 0 ? `tu reacción es ${Math.round(r)} ms, igual a tu normal` : `tu reacción es ${Math.round(r)} ms, ${Math.abs(pct)} % más ${pct > 0 ? "lenta" : "rápida"} que tu normal de ${Math.round(rb)} ms`);
    }
    return partes.join("; ") + ".";
  }
  if (clave === "animo") {
    const w = num(ctx.who5);
    return w != null ? `Tu WHO-5 es ${w}/100${w <= 52 ? ", bienestar bajo" : ""}${t.rangoPersonal ? contraBase(w, t.rangoPersonal, "puntos") : ""}.` : t.motivo ? `${t.motivo}.` : "Sin WHO-5 reciente.";
  }
  if (clave === "radiacion") {
    const r = ctx.radiacion || {};
    const base = `La tasa es ${Math.round(r.tasa || 0)} µSv/h (base ${Math.round(r.tasaBase || 0)})`;
    return `${base}. Dosis de carrera: ${Math.round(r.carrera || 0)} de 600 mSv, con ${Math.round(r.previa || 0)} mSv de misiones previas${ctx.tormentaActiva ? ". Tormenta solar activa" : ""}.`;
  }
  if (clave === "vision") return t.motivo ? `${t.motivo[0].toUpperCase()}${t.motivo.slice(1)}.` : "Sin cambios en tu visión.";
  if (clave === "huesos") return `Hoy llevas ${ctx.huesosPct ?? "—"} % de tu ejercicio prescrito${ctx.racha ? `; ${ctx.racha} días seguidos debajo` : ""}.`;
  if (clave === "cabina") {
    const ppm = num(ctx.co2_ppm);
    const extra = ctx.tempCabina != null ? ` La cabina está a ${f1(ctx.tempCabina)} °C con ${ctx.humedad ?? "—"} % de humedad.` : "";
    return `CO₂ de ${ppm != null ? ppm.toLocaleString("es-MX") : "—"} ppm (${mmhg(ppm) ?? "—"} mmHg); el límite es ${LIMITE_CO2_MMHG} mmHg.${extra}`;
  }
  return NOMBRE_CORTO[clave] ? `Revisa tu ${NOMBRE_CORTO[clave]}.` : "";
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
  if (modo === "conductual") planes = [{ causa: { id: "conductual", nombre: "Salud conductual" }, pasos: PLAN_CONDUCTUAL }];
  else if (modo === "alarma") planes = [{ causa: { id: "alarma", nombre: "Alarma de la nave" }, pasos: PLAN_ALARMA }];
  else if (modo === "emergencia") planes = [{ causa: { id: "emergencia", nombre: "Plan de emergencia" }, pasos: PLAN_EMERGENCIA }];
  else {
    if (ficha.planes.alerta && ctx.tormentaActiva) planes.push({ causa: { id: "alerta", nombre: "Alerta de tormenta solar" }, pasos: ficha.planes.alerta });
    for (const c of principales) planes.push({ causa: c, pasos: resolverPlan(ficha, c.id) });
    if (activos.length) planes.unshift({ causa: { id: "emergencia", nombre: "Mientras se confirma" }, pasos: PLAN_EMERGENCIA.slice(0, 1) });
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
    causaProbable: modo === "normal" && Object.keys(propias).length && principales.length ? `Causa probable: ${principales.map((c) => minuscula(c.nombre)).join(" o ")}` : null,
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
  fc: [{ campo: "fc", etiqueta: "FC", unidad: "lpm" }],
  pa: [{ campo: "sistolica", etiqueta: "Sistólica", unidad: "mmHg" }, { campo: "diastolica", etiqueta: "Diastólica", unidad: "mmHg" }],
  fr: [{ campo: "frec_resp", etiqueta: "FR", unidad: "rpm" }],
  spo2: [{ campo: "spo2", etiqueta: "Oxímetro de dedo", unidad: "%" }],
  temp: [{ campo: "temperatura", etiqueta: "Temperatura", unidad: "°C", paso: 0.1 }],
  cabina: [{ campo: "co2_ppm", etiqueta: "CO₂", unidad: "ppm", paso: 50 }],
  animo: [{ campo: "who5", etiqueta: "WHO-5", unidad: "/100" }],
  sueno: [{ campo: "reaccion", etiqueta: "Reacción", unidad: "ms" }],
  huesos: [{ campo: "huesosPct", etiqueta: "Ejercicio de hoy", unidad: "%" }],
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
  const ox = ultimos.spo2_confirmacion?.valor?.respuestas?.oximetro;
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
