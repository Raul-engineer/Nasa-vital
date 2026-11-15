import { protocoloDeAlerta } from "./analysis";

export const MEDIC = {
  nombre: "Medic · health assistant",
  aviso: "Medic does not diagnose. Anything serious is escalated to the crew physician.",
};

const FAMILIAS = {
  penicilina: ["penicilina", "amoxicilina", "ampicilina", "dicloxacilina", "penicillin", "amoxicillin", "ampicillin", "dicloxacillin"],
  aine: ["ibuprofeno", "naproxeno", "diclofenaco", "ketorolaco", "aspirina", "acido acetilsalicilico", "ibuprofen", "naproxen", "diclofenac", "ketorolac", "aspirin", "acetylsalicylic", "nsaid"],
  paracetamol: ["paracetamol", "acetaminofen", "acetaminophen"],
  sulfa: ["sulfametoxazol", "trimetoprim", "sulfamethoxazole", "trimethoprim"],
  latex: ["latex"],
};

const normal = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function terminosAlergia(sustancia) {
  const s = normal(sustancia);
  const palabras = s.split(/[^a-z]+/).filter((w) => w.length >= 4);
  const t = new Set(palabras);
  for (const [fam, miembros] of Object.entries(FAMILIAS)) {
    if (palabras.includes(fam) || miembros.some((m) => s.includes(m))) miembros.forEach((m) => t.add(m));
  }
  return [...t];
}

export function filtrarPorAlergias(acciones = [], alergias = []) {
  const reglas = (alergias || []).filter((a) => a?.sustancia).map((a) => ({ a, t: terminosAlergia(a.sustancia) }));
  const ok = [];
  const omitidas = [];
  for (const acc of acciones) {
    const n = normal(acc);
    const choque = reglas.find(({ t }) => t.some((w) => new RegExp(`\\b${w}\\b`).test(n)));
    if (choque) omitidas.push({ accion: acc, sustancia: choque.a.sustancia });
    else ok.push(acc);
  }
  return { acciones: ok, omitidas };
}

export function planDeAlerta(protocols, alerta, alergias) {
  const p = protocoloDeAlerta(protocols, alerta);
  if (!p) return null;
  const bloques = {};
  const omitidas = [];
  for (const k of ["ahora", "hoy", "prevenir", "escalar"]) {
    const r = filtrarPorAlergias(p[k] || [], alergias);
    bloques[k] = r.acciones;
    omitidas.push(...r.omitidas);
  }
  return { protocolo: p, bloques, omitidas, prueba: p.prueba_sugerida || null, fuente: p.fuente };
}

function saludo(nombre) {
  const h = new Date().getHours();
  const corto = nombre?.split(" ").slice(-1)[0] ?? "";
  return `${h < 12 ? "Good morning" : h < 19 ? "Good afternoon" : "Good evening"}, ${corto}.`;
}

export function mensajeMedic(analisis, astronaut, { planAjustado, protocols = [], alergias = [] } = {}) {
  const a = analisis.activas[0];
  const s = analisis.sistemas;
  const plan = a ? planDeAlerta(protocols, a, alergias) : null;
  const acciones = plan ? [...plan.bloques.ahora, ...plan.bloques.hoy].slice(0, 3) : [];
  if (!a) {
    return {
      texto: `${saludo(astronaut?.nombre)} All your systems are within your range and your baseline. A good day for demanding tasks.`,
      pregunta: analisis.checkinHoy?.animo ? null : "Shall we do today's check-in?",
      accion: "checkin",
      acciones: ["Hydration ≥ 2.5 L during the day", "Resistance exercise 90+ min", "Sleep 7–8 h (22:00 – 06:00)"],
      sistema: null,
    };
  }
  const base = { alerta: a, acciones, omitidas: plan?.omitidas || [], sistema: a.sistema, critico: a.estado === "critico" };
  const r = analisis.radiacion;
  if (a.clave === "radiacion_tormenta") {
    return {
      ...base,
      texto: r.refugio
        ? `You are in the shelter. Your dosimeter dropped to ${Math.round(r.tasa)} µSv/h thanks to the shielding. Wait for the end-of-event notice.`
        : `Radiation alarm: solar storm ${r.activo?.nivel}. Your dosimeter reads ${Math.round(r.tasa)} µSv/h, ${r.mult} times normal. Go to the shelter now.`,
      pregunta: r.refugio ? null : "Are you in the shelter yet?",
      accion: "refugio",
    };
  }
  if (a.sistemas?.includes("cardiovascular")) {
    const pct = Math.round(Math.abs(s.cardiovascular.extra.vfcCambioPct) * 100);
    const rc = analisis.reaccion?.cambio;
    const texto = a.estado === "critico"
      ? `${saludo(astronaut?.nombre)} You have slept 6 h or less for ${a.rachaDias} nights, your HRV is ${pct}% below your baseline and your reaction is ${Math.round((rc || 0) * 100)}% slower. Your body is not recovering and it is already affecting your attention.`
      : `${saludo(astronaut?.nombre)} You have slept less than 7 h for ${a.rachaDias} nights and your HRV is ${pct}% below your baseline. Your body is not recovering well.`;
    return { ...base, texto, pregunta: planAjustado ? null : "Do you want me to adjust your recovery plan for today?", accion: "plan" };
  }
  if (a.estado === "critico") {
    return { ...base, texto: `${a.motivo}. I notified the crew physician; in the meantime follow these steps.`, pregunta: null, accion: "plan" };
  }
  if (a.sistema === "radiacion") {
    return {
      ...base,
      texto: `${saludo(astronaut?.nombre)} ${a.motivo}. Your career dose is ${Math.round(r.carrera)} of 600 mSv and your 30-day dose ${Math.round(r.ventana30)} of 250 mSv.`,
      pregunta: planAjustado ? null : "Do you want me to adjust today's plan?",
      accion: "plan",
    };
  }
  return {
    ...base,
    texto: `${saludo(astronaut?.nombre)} ${a.motivo}. I left you a plan for today.`,
    pregunta: planAjustado ? null : "Do you want me to adjust today's plan?",
    accion: "plan",
  };
}

const fmtPct = (p) => (p == null ? "" : `${p >= 0 ? "+" : "−"}${Math.abs(Math.round(p * 100))} % vs. your 7-day average`);

export function explicarSigno(sg) {
  if (!sg) return "";
  const fuera = sg.fuera;
  const cambio = fmtPct(sg.cambio7);
  switch (sg.k) {
    case "fc":
      return fuera
        ? `Your pulse (${sg.texto} bpm) is outside the range ${sg.rango}; repeat the reading at rest before any exertion.`
        : `Your pulse of ${sg.texto} bpm is in range (${sg.rango}); ${cambio}.`;
    case "spo2":
      return fuera
        ? `Your oxygenation (${sg.texto} %) is below 96 %: breathe slowly, repeat the reading and report it if it drops below 92 %.`
        : `Your blood carries plenty of oxygen (${sg.texto} %). In microgravity it is normal to stay above 96 %.`;
    case "temperatura":
      return fuera
        ? `Your temperature (${sg.texto} °C) is outside 36.1–38.0 °C; it may be the start of an infection or lack of warm clothing.`
        : `Your temperature of ${sg.texto} °C is normal. In space core temperature tends to be a little higher.`;
    case "pa":
      return fuera
        ? `Your blood pressure (${sg.texto} mmHg) is classified as ${sg.etiqueta.toLowerCase()} according to PRONAM; repeat it after 5 min seated.`
        : `Your blood pressure of ${sg.texto} mmHg is normal. In microgravity fluids shift toward the head, so we check it daily.`;
    case "fr":
      return fuera
        ? `You breathe ${sg.texto} times per minute, outside 12–20; if you feel short of breath tell the crew physician.`
        : `You breathe ${sg.texto} times per minute, a calm rate within 12–20.`;
    case "estres":
      return sg.valor == null
        ? "There is not enough HRV yet to estimate your stress."
        : `Your estimated stress is ${sg.etiqueta.toLowerCase()} (${sg.texto} %): your HRV is ${sg.vfc} ms versus ${Math.round(sg.vfcBase)} ms at your baseline.`;
    default:
      return "";
  }
}

export const MENSAJE_DESENLACE = {
  mejoro: "Your values are back in your range; I am closing the alert.",
  igual: "Keep following the plan and repeat the test in 2 h.",
  empeoro: "I notified the crew physician.",
};

const CONSEJO = {
  fc: "Your resting heart and your HRV show how well you are recovering. Always measure seated and calm.",
  pa: "Blood pressure is classified with PRONAM. In microgravity fluids shift toward the head; the orthostatic test checks whether it drops when you stand up.",
  fr: "Calm breathing at rest ranges from 12 to 20 per minute. If it goes outside that range, also check your SpO₂ and the module CO₂.",
  temp: "Temperature together with symptoms (throat, sores, rash, slow-healing wounds, stomach) helps detect an infection early; in flight the immune system changes.",
  spo2: "SpO₂ shows how much oxygen your blood carries. From 90 to 94 % calls for a repeat reading; below 90 % is an emergency.",
  conciencia: "Being alert and free of dizziness is essential for critical tasks. Dizziness is common while adapting to gravity; new confusion needs immediate attention.",
  radiacion: "Your dosimeter measures the radiation you receive. It is compared with 600 mSv over your whole career and 250 mSv in 30 days; in a storm, the shelter cuts the dose in half.",
  sueno: "Sleeping 7 h or more (AASM) protects your attention. The reaction test (PVT) shows whether tiredness is already affecting your performance.",
  animo: "The WHO-5 sums up your well-being over the last two weeks; together with your stress and your relationship with the crew it helps detect early when you need support. It is screening, not diagnosis.",
  vision: "On long missions the fluid shift can affect vision (SANS). The Amsler grid is a complement: on its own it never raises a red alert.",
  huesos: "In microgravity bones and muscles are lost quickly without exercise. Meeting your prescribed strength and cardio exercise is the best protection.",
  cabina: "In a closed spacecraft high CO₂ causes headache, tiredness and lower concentration. The CO₂ thresholds in this demo are for demonstration.",
};

export function explicarTarjeta(t) {
  if (!t) return "";
  const base = CONSEJO[t.k] || "";
  if (t.estado === "normal") return `Your ${t.nombre.toLowerCase()} is in your range (${t.texto}${t.unidad ? ` ${t.unidad}` : ""}). ${base}`;
  return `${t.motivo}. ${base}`;
}
