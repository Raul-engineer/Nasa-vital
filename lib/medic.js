import { protocoloDeAlerta } from "./analysis";

export const MEDIC = {
  nombre: "Medic · asistente de salud",
  aviso: "Medic no diagnostica. Lo grave lo escala al médico de tripulación.",
};

const FAMILIAS = {
  penicilina: ["penicilina", "amoxicilina", "ampicilina", "dicloxacilina"],
  aine: ["ibuprofeno", "naproxeno", "diclofenaco", "ketorolaco", "aspirina", "acido acetilsalicilico"],
  paracetamol: ["paracetamol", "acetaminofen"],
  sulfa: ["sulfametoxazol", "trimetoprim"],
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
  return `${h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches"}, ${corto}.`;
}

export function mensajeMedic(analisis, astronaut, { planAjustado, protocols = [], alergias = [] } = {}) {
  const a = analisis.activas[0];
  const s = analisis.sistemas;
  const plan = a ? planDeAlerta(protocols, a, alergias) : null;
  const acciones = plan ? [...plan.bloques.ahora, ...plan.bloques.hoy].slice(0, 3) : [];
  if (!a) {
    return {
      texto: `${saludo(astronaut?.nombre)} Todos tus sistemas están dentro de tu rango y tu línea base. Buen día para tareas exigentes.`,
      pregunta: analisis.checkinHoy?.animo ? null : "¿Hacemos tu check-in de hoy?",
      accion: "checkin",
      acciones: ["Hidratación ≥ 2.5 L durante el día", "Ejercicio de resistencia 90+ min", "Dormir 7–8 h (22:00 – 06:00)"],
      sistema: null,
    };
  }
  const base = { alerta: a, acciones, omitidas: plan?.omitidas || [], sistema: a.sistema, critico: a.estado === "critico" };
  const r = analisis.radiacion;
  if (a.clave === "radiacion_tormenta") {
    return {
      ...base,
      texto: r.refugio
        ? `Estás en el refugio. Tu dosímetro bajó a ${Math.round(r.tasa)} µSv/h gracias al blindaje. Espera el aviso de fin de evento.`
        : `Alarma de radiación: tormenta solar ${r.activo?.nivel}. Tu dosímetro marca ${Math.round(r.tasa)} µSv/h, ${r.mult} veces lo normal. Ve al refugio ahora.`,
      pregunta: r.refugio ? null : "¿Ya estás en el refugio?",
      accion: "refugio",
    };
  }
  if (a.sistemas?.includes("cardiovascular")) {
    const pct = Math.round(Math.abs(s.cardiovascular.extra.vfcCambioPct) * 100);
    const rc = analisis.reaccion?.cambio;
    const texto = a.estado === "critico"
      ? `${saludo(astronaut?.nombre)} Has dormido 6 h o menos ${a.rachaDias} noches, tu VFC está ${pct}% bajo tu línea base y tu reacción está ${Math.round((rc || 0) * 100)}% más lenta. Tu cuerpo no se está recuperando y ya afecta tu atención.`
      : `${saludo(astronaut?.nombre)} Has dormido menos de 7 h ${a.rachaDias} noches y tu VFC está ${pct}% bajo tu línea base. Tu cuerpo no se está recuperando bien.`;
    return { ...base, texto, pregunta: planAjustado ? null : "¿Quieres que ajuste tu plan de recuperación para hoy?", accion: "plan" };
  }
  if (a.estado === "critico") {
    return { ...base, texto: `${a.motivo}. Avisé al médico de tripulación; mientras tanto sigue estos pasos.`, pregunta: null, accion: "plan" };
  }
  if (a.sistema === "radiacion") {
    return {
      ...base,
      texto: `${saludo(astronaut?.nombre)} ${a.motivo}. Tu dosis de carrera es ${Math.round(r.carrera)} de 600 mSv y la de 30 días ${Math.round(r.ventana30)} de 250 mSv.`,
      pregunta: planAjustado ? null : "¿Quieres que ajuste tu plan de hoy?",
      accion: "plan",
    };
  }
  return {
    ...base,
    texto: `${saludo(astronaut?.nombre)} ${a.motivo}. Te dejé un plan para hoy.`,
    pregunta: planAjustado ? null : "¿Quieres que ajuste tu plan de hoy?",
    accion: "plan",
  };
}

const fmtPct = (p) => (p == null ? "" : `${p >= 0 ? "+" : "−"}${Math.abs(Math.round(p * 100))} % vs. tu promedio de 7 días`);

export function explicarSigno(sg) {
  if (!sg) return "";
  const fuera = sg.fuera;
  const cambio = fmtPct(sg.cambio7);
  switch (sg.k) {
    case "fc":
      return fuera
        ? `Tu pulso (${sg.texto} lpm) está fuera del rango ${sg.rango}; repite la medición en reposo antes de cualquier esfuerzo.`
        : `Tu pulso de ${sg.texto} lpm está en rango (${sg.rango}); ${cambio}.`;
    case "spo2":
      return fuera
        ? `Tu oxigenación (${sg.texto} %) está por debajo de 96 %: respira lento, repite la medición y avisa si baja de 92 %.`
        : `Tu sangre lleva oxígeno de sobra (${sg.texto} %). En microgravedad es normal mantenerse arriba de 96 %.`;
    case "temperatura":
      return fuera
        ? `Tu temperatura (${sg.texto} °C) está fuera de 36.1–38.0 °C; puede ser el inicio de una infección o falta de abrigo.`
        : `Tu temperatura de ${sg.texto} °C es normal. En el espacio la temperatura central suele ser un poco más alta.`;
    case "pa":
      return fuera
        ? `Tu presión (${sg.texto} mmHg) se clasifica como ${sg.etiqueta.toLowerCase()} según PRONAM; repítela tras 5 min sentado.`
        : `Tu presión de ${sg.texto} mmHg es normal. En microgravedad los líquidos suben a la cabeza, por eso la vigilamos a diario.`;
    case "fr":
      return fuera
        ? `Respiras ${sg.texto} veces por minuto, fuera de 12–20; si sientes falta de aire avisa al médico de tripulación.`
        : `Respiras ${sg.texto} veces por minuto, un ritmo tranquilo dentro de 12–20.`;
    case "estres":
      return sg.valor == null
        ? "Aún no hay suficiente VFC para estimar tu estrés."
        : `Tu estrés estimado es ${sg.etiqueta.toLowerCase()} (${sg.texto} %): tu VFC está ${sg.vfc} ms frente a ${Math.round(sg.vfcBase)} ms de tu línea base.`;
    default:
      return "";
  }
}

export const MENSAJE_DESENLACE = {
  mejoro: "Tus valores regresaron a tu rango; cierro la alerta.",
  igual: "Continúa con el plan y repite la prueba en 2 h.",
  empeoro: "Avisé al médico de tripulación.",
};
