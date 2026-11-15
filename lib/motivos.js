export const TIPOS_PASO = ["beber", "medir", "reposo", "comunicar", "medicamento", "equipo", "postura", "otro"];

const PEOR = { id: "peor", texto: "Me siento peor" };

export const MOTIVOS = {
  beber: [{ id: "nausea", texto: "Tengo náusea o vómito" }, { id: "tragar", texto: "No puedo tragar" }],
  medir: [{ id: "sensor", texto: "El sensor no responde" }, { id: "tarea", texto: "Estoy en una tarea que no puedo dejar" }],
  reposo: [{ id: "tarea_critica", texto: "Estoy en una tarea crítica" }],
  comunicar: [{ id: "sin_tierra", texto: "No hay comunicación con Tierra" }],
  medicamento: [{ id: "no_hay", texto: "No está en el botiquín o se acabó" }, { id: "ya_tome", texto: "Ya lo tomé hace poco" }],
  equipo: [{ id: "no_a_mano", texto: "No tengo el equipo a la mano" }, { id: "no_se", texto: "No sé usarlo" }],
  postura: [{ id: "duele", texto: "Me duele hacerlo" }],
  otro: [],
};

const REGLAS = [
  ["postura", /posición fetal|piernas arriba|contrapresión|cruzar las piernas|rodillas al pecho/i],
  ["comunicar", /^(avisar|aviso|reportar|enviar|pedir una|pedir|llamada|conferencia|alarma|que otro tripulante|que un compañero)/i],
  ["medicamento", /paracetamol|ibuprofeno|analgésico|inhalador|lágrimas|medicamento|dosis/i],
  ["equipo", /lentes de anticipación|dosímetro|ecograf|fluoresceína|máscara|tira de/i],
  ["medir", /medir|oxímetro|prueba de reacción|who-5|volver a evaluar|volver a revisar|revisar mañana|repetir el|agudeza|rejilla|prueba ortostática|cada 4 horas/i],
  ["beber", /agua|electrolitos|sorbos|líquidos/i],
  ["reposo", /quiet|reposo|sentarte|acostarte|detener el ejercicio|pausar|no hacer tareas|fijar la cabeza|respir|ir a un módulo|ir a otro módulo|zona blindada/i],
];

export function inferirTipo(texto = "") {
  for (const [tipo, re] of REGLAS) if (re.test(texto)) return tipo;
  return "otro";
}

export function motivosDe(paso) {
  return [...(MOTIVOS[paso?.tipo] || []), PEOR];
}

const SUAVE = {
  "posición fetal": "Acuéstate de lado y dobla las rodillas solo hasta donde no duela",
  "piernas arriba": "Apoya las piernas en algo bajo, sin forzar",
  "contrapresión": "Aprieta solo las manos y los muslos, sin cruzar las piernas",
};

export function alternativaSuave(texto = "") {
  const t = texto.toLowerCase();
  for (const [k, v] of Object.entries(SUAVE)) if (t.includes(k)) return v;
  return "Hazlo más suave, solo hasta donde no duela";
}

export function contarMotivo(notas = [], pasoId, motivoId) {
  return notas.filter((n) => n && n.paso === pasoId && n.motivo === motivoId).length;
}

export function resolverMotivo(paso, motivoId, { previos = 0, alternativaBotiquin = null } = {}) {
  const r = { motivo: motivoId, alternativa: null, abrir: null, escalar: null, avisoOficial: false, posponerMin: null, pedirHora: false, bloquear: false, mostrarPeligro: false, recomendarPrueba: false, cola: false, texto: "" };
  const alt = (sufijo, texto, tipo, extra = {}) => ({ id: `${paso.id}~${sufijo}`, texto, tipo, obligatorio: !!paso.obligatorio, minutos: null, alterno: true, base: paso.id, ...extra });
  if (motivoId === "peor") return { ...r, mostrarPeligro: true, recomendarPrueba: true, texto: "Revisa las señales de peligro. Te recomendamos la prueba completa." };
  if (paso.tipo === "beber" && motivoId === "nausea") return { ...r, alternativa: alt("sorbos", "Agua a sorbos cada 5 min", "beber"), abrir: "conciencia", texto: "Cambiamos el paso a sorbos y abrimos la ficha de mareo." };
  if (paso.tipo === "beber" && motivoId === "tragar") return { ...r, escalar: "urgente", avisoOficial: true, texto: "Sube a urgente. Avisamos al oficial médico." };
  if (paso.tipo === "medir" && motivoId === "sensor") return { ...r, alternativa: alt("manual", "Medición manual: cuenta el pulso 30 s y multiplica por 2, o usa el equipo de respaldo", "medir"), texto: "Usa la medición manual." };
  if (paso.tipo === "medir" && motivoId === "tarea") {
    if (previos >= 1) return { ...r, escalar: "subir", avisoOficial: true, texto: "Es la segunda vez: sube un nivel." };
    return { ...r, posponerMin: 10, texto: "Pospuesto 10 min. Solo se puede una vez." };
  }
  if (paso.tipo === "reposo" && motivoId === "tarea_critica") return { ...r, alternativa: alt("relevo", "Pide relevo al compañero más cercano o al comandante", "comunicar", { obligatorio: true, minutos: 10 }), texto: "Avisa para que te releven. Si no hay relevo en 10 min, sube un nivel." };
  if (paso.tipo === "comunicar" && motivoId === "sin_tierra") return { ...r, alternativa: alt("abordo", "Avisar al oficial médico a bordo", "comunicar"), cola: true, texto: "El reporte queda en cola para cuando regrese la señal." };
  if (paso.tipo === "medicamento" && motivoId === "no_hay") return { ...r, alternativa: alt("alterno", alternativaBotiquin ? `Usar la alternativa: ${alternativaBotiquin}` : "Usar la alternativa del botiquín que indique el oficial médico", "medicamento"), avisoOficial: true, texto: "Avisamos al oficial médico." };
  if (paso.tipo === "medicamento" && motivoId === "ya_tome") return { ...r, pedirHora: true, bloquear: true, texto: "Anota la hora. No repitas la dosis." };
  if (paso.tipo === "equipo" && (motivoId === "no_a_mano" || motivoId === "no_se")) return { ...r, alternativa: alt("oficial", motivoId === "no_se" ? "Pide al oficial médico que lo use contigo" : "Pide al oficial médico que lo traiga", "comunicar"), texto: "No sube el nivel por esto." };
  if (paso.tipo === "postura" && motivoId === "duele") return { ...r, alternativa: alt("suave", alternativaSuave(paso.texto), "postura"), texto: "Avisa si el dolor es fuerte." };
  return { ...r, texto: "Registrado." };
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
  return id === "peor" ? PEOR.texto : id === "equipo" ? "No tengo el equipo" : id === "otro" ? "Otro" : id;
}
