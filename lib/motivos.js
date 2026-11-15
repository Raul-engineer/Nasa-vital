export const TIPOS_PASO = ["beber", "medir", "reposo", "comunicar", "medicamento", "equipo", "postura", "otro"];

const PEOR = { id: "peor", texto: "I feel worse" };

export const MOTIVOS = {
  beber: [{ id: "nausea", texto: "I have nausea or vomiting" }, { id: "tragar", texto: "I can't swallow" }],
  medir: [{ id: "sensor", texto: "The sensor is not responding" }, { id: "tarea", texto: "I'm on a task I can't leave" }],
  reposo: [{ id: "tarea_critica", texto: "I'm on a critical task" }],
  comunicar: [{ id: "sin_tierra", texto: "There is no communication with Earth" }],
  medicamento: [{ id: "no_hay", texto: "It's not in the kit or it ran out" }, { id: "ya_tome", texto: "I already took it recently" }],
  equipo: [{ id: "no_a_mano", texto: "I don't have the equipment at hand" }, { id: "no_se", texto: "I don't know how to use it" }],
  postura: [{ id: "duele", texto: "It hurts to do it" }],
  otro: [],
};

const REGLAS = [
  ["postura", /posición fetal|piernas arriba|contrapresión|cruzar las piernas|rodillas al pecho|fetal position|legs up|counter-pressure|cross your legs|knees to chest/i],
  ["comunicar", /^(avisar|aviso|reportar|enviar|pedir una|pedir|llamada|conferencia|alarma|que otro tripulante|que un compañero|notify|notice|report|send|ask|private call|private psychological conference|private conference|conference|alarm|have another crew member|have a crewmate)/i],
  ["medicamento", /paracetamol|ibuprofeno|analgésico|inhalador|lágrimas|medicamento|dosis|acetaminophen|ibuprofen|analgesic|inhaler|tears|medication|\bdose\b/i],
  ["equipo", /lentes de anticipación|dosímetro|ecograf|fluoresceína|máscara|tira de|anticipation glasses|dosimeter|ultrasound|fluorescein|oxygen mask|strip/i],
  ["medir", /medir|oxímetro|prueba de reacción|who-5|volver a evaluar|volver a revisar|revisar mañana|repetir el|agudeza|rejilla|prueba ortostática|cada 4 horas|measure|oximeter|reaction test|reassess|check again|check tomorrow|repeat the who-5|acuity|grid|orthostatic test|every 4 hours/i],
  ["beber", /agua|electrolitos|sorbos|líquidos|water|electrolytes|\bsips?\b|fluids/i],
  ["reposo", /quiet|reposo|sentarte|acostarte|detener el ejercicio|pausar|no hacer tareas|fijar la cabeza|respir|ir a un módulo|ir a otro módulo|zona blindada|\bstill\b|\brest\b|\bsit\b|lie down|stop exercising|pause|no critical tasks|hold your head|breath|go to a module|go to another module|shielded area/i],
];

export function inferirTipo(texto = "") {
  for (const [tipo, re] of REGLAS) if (re.test(texto)) return tipo;
  return "otro";
}

export function motivosDe(paso) {
  return [...(MOTIVOS[paso?.tipo] || []), PEOR];
}

const SUAVE = {
  "fetal position": "Lie on your side and bend your knees only as far as it doesn't hurt",
  "legs up": "Rest your legs on something low, without forcing",
  "counter-pressure": "Squeeze only your hands and thighs, without crossing your legs",
};

export function alternativaSuave(texto = "") {
  const t = texto.toLowerCase();
  for (const [k, v] of Object.entries(SUAVE)) if (t.includes(k)) return v;
  return "Do it more gently, only as far as it doesn't hurt";
}

export function contarMotivo(notas = [], pasoId, motivoId) {
  return notas.filter((n) => n && n.paso === pasoId && n.motivo === motivoId).length;
}

export function resolverMotivo(paso, motivoId, { previos = 0, alternativaBotiquin = null } = {}) {
  const r = { motivo: motivoId, alternativa: null, abrir: null, escalar: null, avisoOficial: false, posponerMin: null, pedirHora: false, bloquear: false, mostrarPeligro: false, recomendarPrueba: false, cola: false, texto: "" };
  const alt = (sufijo, texto, tipo, extra = {}) => ({ id: `${paso.id}~${sufijo}`, texto, tipo, obligatorio: !!paso.obligatorio, minutos: null, alterno: true, base: paso.id, ...extra });
  if (motivoId === "peor") return { ...r, mostrarPeligro: true, recomendarPrueba: true, texto: "Check the danger signs. We recommend the full test." };
  if (paso.tipo === "beber" && motivoId === "nausea") return { ...r, alternativa: alt("sorbos", "Sip water every 5 min", "beber"), abrir: "conciencia", texto: "We changed the step to sips and opened the dizziness card." };
  if (paso.tipo === "beber" && motivoId === "tragar") return { ...r, escalar: "urgente", avisoOficial: true, texto: "It goes up to urgent. We notified the medical officer." };
  if (paso.tipo === "medir" && motivoId === "sensor") return { ...r, alternativa: alt("manual", "Manual reading: count your pulse for 30 s and multiply by 2, or use the backup equipment", "medir"), texto: "Use the manual reading." };
  if (paso.tipo === "medir" && motivoId === "tarea") {
    if (previos >= 1) return { ...r, escalar: "subir", avisoOficial: true, texto: "This is the second time: it goes up one level." };
    return { ...r, posponerMin: 10, texto: "Postponed 10 min. It can only be done once." };
  }
  if (paso.tipo === "reposo" && motivoId === "tarea_critica") return { ...r, alternativa: alt("relevo", "Ask the nearest crewmate or the commander to relieve you", "comunicar", { obligatorio: true, minutos: 10 }), texto: "Ask to be relieved. If there is no relief in 10 min, it goes up one level." };
  if (paso.tipo === "comunicar" && motivoId === "sin_tierra") return { ...r, alternativa: alt("abordo", "Notify the medical officer on board", "comunicar"), cola: true, texto: "The report is queued until the signal returns." };
  if (paso.tipo === "medicamento" && motivoId === "no_hay") return { ...r, alternativa: alt("alterno", alternativaBotiquin ? `Use the alternative: ${alternativaBotiquin}` : "Use the kit alternative the medical officer indicates", "medicamento"), avisoOficial: true, texto: "We notified the medical officer." };
  if (paso.tipo === "medicamento" && motivoId === "ya_tome") return { ...r, pedirHora: true, bloquear: true, texto: "Write down the time. Do not repeat the dose." };
  if (paso.tipo === "equipo" && (motivoId === "no_a_mano" || motivoId === "no_se")) return { ...r, alternativa: alt("oficial", motivoId === "no_se" ? "Ask the medical officer to use it with you" : "Ask the medical officer to bring it", "comunicar"), texto: "The level does not go up because of this." };
  if (paso.tipo === "postura" && motivoId === "duele") return { ...r, alternativa: alt("suave", alternativaSuave(paso.texto), "postura"), texto: "Say so if the pain is strong." };
  return { ...r, texto: "Recorded." };
}

export function notaMotivo(paso, res, extra = {}) {
  return `no:${JSON.stringify({ paso: paso.id, motivo: res.motivo, alt: res.alternativa ? { id: res.alternativa.id, texto: res.alternativa.texto, tipo: res.alternativa.tipo, obligatorio: res.alternativa.obligatorio, minutos: res.alternativa.minutos } : null, posponer: res.posponerMin, cola: res.cola || undefined, t: new Date().toISOString(), ...extra })}`;
}

export function leerNota(nota) {
  const s = String(nota || "");
  if (!s.startsWith("no:")) return null;
  const cuerpo = s.slice(3);
  if (cuerpo.startsWith("{")) {
    try {
      return JSON.parse(cuerpo);
    } catch {
      return { motivo: "otro" };
    }
  }
  return { motivo: cuerpo };
}

export function textoMotivo(id) {
  for (const lista of Object.values(MOTIVOS)) {
    const m = lista.find((x) => x.id === id);
    if (m) return m.texto;
  }
  return id === "peor" ? PEOR.texto : id === "equipo" ? "I don't have the equipment" : id === "otro" ? "Other" : id;
}
