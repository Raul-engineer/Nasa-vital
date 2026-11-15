import { calcularNews2, evaluarOrtostatica } from "./analysis.js";
import { evaluarFicha, marcasDe, mayorNivel, mmhg, RANGO_NIVEL, CO2_ALTO_MMHG, LIMITE_CO2_MMHG } from "./fichas.js";

const num = (x) => (x == null || x === "" || Number.isNaN(Number(x)) ? null : Number(x));
const HORA = 36e5;
const SOMNIFEROS = /zolpidem|zaleplon/i;
const PROMETAZINA = /prometazina|promethazine/i;
const MED_ANIMO = /prednisona|antibi|amoxicilina|azitromicina|doxiciclina|levofloxacino|nitrofurantoína|trimetoprim|modafinilo|albuterol|salbutamol|fluticasona|zolpidem|zaleplon|prednisone|amoxicillin|azithromycin|doxycycline|levofloxacin|nitrofurantoin|trimethoprim|modafinil|fluticasone/i;
const VAR_NEWS2 = { fr: "fr", spo2: "spo2", sistolica: "pa", pulso: "fc", temperatura: "temp", conciencia: "conciencia" };

const R = (id, titulo, significado, nivel, fuente, fichas, extra = {}) => ({ id, titulo, significado, nivel, fuente, fichas, ...extra });

function co2mmhg(cabina = {}) {
  if (num(cabina.co2_mmhg) != null) return num(cabina.co2_mmhg);
  return mmhg(cabina.co2_ppm);
}

export function evaluarCombinaciones({ astronauta = {}, tripulacion = [], cabina = {}, eventosRecientes = [], respuestas = {}, ahora = Date.now() } = {}) {
  const a = astronauta || {};
  const l = a.lectura || {};
  const ci = a.ci || {};
  const g = a.gravedades || {};
  const marcas = marcasDe(respuestas);
  const causas = a.causas || {};
  const meds = a.medicamentos || [];
  const sint = Array.isArray(ci.sintomas) ? ci.sintomas : [];
  const fc = num(l.fc), fr = num(l.frec_resp), sp = num(l.spo2), sis = num(l.sistolica), dia = num(l.diastolica), t = num(l.temperatura);
  const co2 = co2mmhg(cabina);
  const horas = num(a.horasSueno);
  const fatiga = num(ci.fatiga);
  const malSueno = horas != null && horas < 7;
  const nausea = !!a.nausea || sint.includes("estomago") || sint.includes("nausea") || sint.includes("vomito") || marcas.has("estomago");
  const cansancio = fatiga != null && fatiga >= 4;
  const animoBajo = (num(a.who5) != null && a.who5 <= 52) || (num(ci.animo) != null && ci.animo <= 2) || ["critico", "urgente", "moderado"].includes(g.animo);
  const dolorPecho = marcas.has("dolor_pecho");
  const tomado = (re, horasAtras) => meds.some((m) => re.test(m.nombre) && ahora - Date.parse(m.tomado_en) <= horasAtras * HORA);
  const out = [];

  let news2 = num(a.news2);
  let desglose = a.news2Desglose || null;
  if (news2 == null && Object.keys(l).length) {
    const n = calcularNews2(l, ci);
    news2 = n.total;
    desglose = n.desglose;
  }
  if (news2 != null && news2 >= 5) {
    const fichas = (desglose || []).filter((x) => x.puntos).map((x) => VAR_NEWS2[x.k]).filter(Boolean);
    out.push(R(1, `NEWS2 of ${news2}`, news2 >= 7 ? "Several signs out of range at once: high risk." : "Several signs out of range at once: medium risk.", news2 >= 7 ? "critico" : "urgente", "news2", fichas.length ? fichas : ["fc", "fr", "spo2", "pa", "temp", "conciencia"]));
  }

  const otros = Object.entries(g).filter(([k, v]) => k !== "conciencia" && v && v !== "ok" && v !== "info").length;
  if (ci.confusion && (otros > 0 || (desglose || []).some((x) => x.k !== "conciencia" && x.puntos > 0))) {
    out.push(R(2, "Confusion with another sign", "New confusion together with another abnormal sign needs an urgent response.", "urgente", "news2", ["conciencia"]));
  }

  const paMuyAlta = (sis != null && sis >= 180) || (dia != null && dia >= 110);
  if (paMuyAlta && marcas.has("organo_blanco")) out.push(R(3, "Very high blood pressure with symptoms", "Blood pressure of 180/110 or more with symptoms of organ damage: hypertensive emergency.", "critico", "pronam", ["pa", "fc", "vision"]));
  else if (paMuyAlta) out.push(R(4, "Very high blood pressure without symptoms", "Blood pressure of 180/110 or more without symptoms: hypertensive urgency; lower it gradually.", "urgente", "pronam", ["pa"]));

  const orto = a.ortostatica;
  if (orto && (orto.caidaSis >= 20 || orto.caidaDia >= 10) && (ci.mareo_de_pie || marcas.has("desmayo"))) {
    out.push(R(5, "Positive orthostatic test with dizziness", `Your blood pressure dropped ${Math.round(orto.caidaSis || 0)}/${Math.round(orto.caidaDia || 0)} when you stood up and you are dizzy.`, marcas.has("desmayo") ? "urgente" : "moderado", "pronam,ortostatica", ["pa", "conciencia"]));
  }

  if (sis != null && sis <= 100 && causas.pa === "vasovagal") out.push(R(6, "Low blood pressure from a vasovagal reaction", "The most likely cause is a fright or pain; it is almost always benign.", "moderado", "esc2018", ["pa"]));

  const oxi = num(a.oximetro);
  if (oxi != null && oxi < 90) out.push(R(7, "SpO₂ below 90 % confirmed", "The finger oximeter confirmed the low SpO₂.", "critico", "oms_oximetria", ["spo2"]));

  const dolorCabeza = !!ci.dolor_cabeza || !!ci.vision_cefalea || marcas.has("dolor_cabeza");
  if (dolorCabeza && ci.vision_borrosa && co2 != null && co2 > LIMITE_CO2_MMHG) {
    out.push(R(8, "Headache, blurred vision and high CO₂", `With CO₂ at ${co2} mmHg the headache and blurred vision have a cause in the cabin.`, co2 > CO2_ALTO_MMHG ? "urgente" : "moderado", "ochmo_co2", ["vision", "cabina"]));
  }

  const conDolor = (dolorCabeza ? 1 : 0) + (tripulacion || []).filter((x) => x.id !== a.id && (x.ci?.dolor_cabeza || x.ci?.vision_cefalea || x.enVivo?.dolor_cabeza === true)).length;
  if (conDolor >= 2 || (dolorCabeza && marcas.has("sintomas_tripulacion"))) {
    out.push(R(9, "Headache across the crew", `${Math.max(conDolor, 2)} crew members with a headache: check the cabin air.`, "urgente", "ochmo_co2", ["cabina", "vision", "conciencia"], { todos: true }));
  }

  if (co2 != null && co2 > CO2_ALTO_MMHG && malSueno && (cansancio || nausea)) {
    out.push(R(10, "High CO₂ with poor sleep and tiredness", `CO₂ at ${co2} mmHg with poor sleep and ${nausea ? "nausea" : "tiredness"}: an effect of the cabin air.`, "urgente", "ochmo_co2", ["cabina", "sueno"], { todos: true }));
  }

  const tormentaReciente = !!a.tormentaActiva || !!a.tormenta48h || (eventosRecientes || []).some((e) => e.tipo === "tormenta" && ahora - (e.fin ? Date.parse(e.fin) : ahora) <= 48 * HORA && Date.parse(e.inicio) <= ahora);
  if (tormentaReciente && (nausea || cansancio)) {
    out.push(R(11, "Solar storm and symptoms", `${nausea ? "Nausea" : "Tiredness"} in the 48 hours after a solar storm.`, "urgente", "ochmo_tb020", ["radiacion"]));
  }

  const ejercicio = a.actividad === "ejercicio" || a.actividad === "recuperacion" || marcas.has("ejercicio");
  if (ejercicio && t != null && t >= 38.1) {
    const pausa = t >= 39.5;
    out.push(R(12, pausa ? "Pause exercise" : "Heat from exercise", pausa ? `Temperature of ${t} °C during exercise: pause exercise now.` : `Temperature of ${t} °C during exercise: in flight the body takes longer to cool down.`, "moderado", "stahn2017", ["temp"], { pausa }));
  }

  const estres = num(ci.estres) >= 4 || (horas != null && horas < 6);
  if (estres && (sint.includes("llagas") || sint.includes("ronchas") || (t != null && t >= 38.1) || marcas.has("piel"))) {
    out.push(R(13, "Stress and low defenses", "Stress or little sleep lower your defenses and reactivate viruses such as herpes.", "moderado", "crucian2016,mehta", ["temp", "animo", "sueno"]));
  }

  const somniferos = new Set((a.medicamentosTripulacion || meds.map((m) => ({ ...m, astronaut_id: a.id }))).filter((m) => SOMNIFEROS.test(m.nombre) && ahora - Date.parse(m.tomado_en) <= 12 * HORA).map((m) => m.astronaut_id));
  if (somniferos.size >= 2) out.push(R(14, "Sleeping pill in several crew members", `${somniferos.size} crew members took a sleeping pill tonight: someone must stay alert.`, "info", "barger2014", ["sueno"], { todos: true }));

  if (tomado(PROMETAZINA, 8) && a.tareaCritica) out.push(R(15, "Promethazine and a critical task", "Promethazine in the last 8 hours lowers performance; change the critical task.", "info", "cowings", ["conciencia"]));

  if (marcas.has("poca_agua") && marcas.has("costado")) {
    const grave = marcas.has("sangre_orina") || (t != null && t >= 38.1);
    out.push(R(16, "Little water and flank pain", "Together they suggest a kidney stone.", grave ? "urgente" : "moderado", "nasem2018", ["huesos"]));
  }

  if (num(a.nochesBajoBase) >= 7 && animoBajo) {
    out.push(R(17, "Accumulated load", `${a.nochesBajoBase} nights of sleep below your baseline in the last 2 weeks, with low mood.`, "moderado", "basner2013,basner2014", ["sueno", "animo", "fc"]));
  }

  if (["luna", "marte", "regreso"].includes(a.fase) && ((sis != null && sis <= 100) || ci.mareo_de_pie || (orto && (orto.caidaSis >= 20 || orto.caidaDia >= 10)))) {
    out.push(R(18, "Return to gravity: Phase 1", "When you return to gravity, do the orthostatic test every day.", "moderado", "nasa_hrp", ["pa", "conciencia"]));
  }

  if (fc != null && fc > 100 && fr != null && fr >= 21 && marcas.has("panico")) {
    const grave = dolorPecho || (sp != null && sp < 94) || !!a.spo2Bajo2h;
    out.push(R(19, grave ? "Fear with chest pain or low oxygen" : "Possible panic attack", grave ? "With chest pain or low SpO₂, the heart and lungs are ruled out first." : "High HR and RR with sudden fear, normal SpO₂ and no chest pain.", grave ? "critico" : "moderado", "dsm5", ["animo", "fc", "fr"]));
  }

  const ansiedad = marcas.has("ansiedad") || marcas.has("panico");
  const medNuevo = marcas.has("medicamento_nuevo") || meds.some((m) => MED_ANIMO.test(m.nombre) && ahora - Date.parse(m.tomado_en) <= 14 * 24 * HORA);
  if ((animoBajo || ansiedad) && medNuevo) out.push(R(20, "Mood and a new medication", "A new medication can change your mood: tell the flight surgeon.", "moderado", "dsm5", ["animo"], { avisoCirujano: true }));

  const emergenciaBordo = marcas.has("emergencia_bordo") || (eventosRecientes || []).some((e) => e.tipo === "emergencia" && ahora - Date.parse(e.inicio) <= 30 * 24 * HORA);
  if (emergenciaBordo && (malSueno || marcas.has("sobresalto"))) out.push(R(21, "Stress after an emergency", "Sleeping badly or being startled after an onboard emergency is common; keep an eye on it.", "moderado", "dsm5", ["animo", "sueno"]));

  if (marcas.has("mala_noticia") && animoBajo) out.push(R(22, "Grief", "Low mood after bad news is treated as grief.", "moderado", "dsm5", ["animo"]));

  const malDormir = malSueno || ["critico", "urgente", "moderado"].includes(g.sueno) || num(a.nochesBajoBase) >= 3;
  if (malDormir && (marcas.has("ambiente") || marcas.has("horario"))) {
    out.push(R(23, "Environment", `You sleep badly because of ${marcas.has("ambiente") ? "noise, light or heat" : "the schedule change"}: it is the environment, not insomnia.`, "moderado", "dsm5,ochmo_tb041", ["sueno"]));
  }

  return out;
}

export function aplicarCombinaciones(nivel, combinaciones = [], clave = null) {
  const propias = combinaciones.filter((c) => !clave || !c.fichas?.length || c.fichas.includes(clave));
  return mayorNivel(nivel, ...propias.map((c) => c.nivel));
}

export function nochesBajoBase(vitals = [], base = null, dias = 14) {
  const ult = vitals.slice(-dias);
  const lim = base ? Math.min(7, base - 0.5) : 7;
  return ult.filter((v) => num(v.horas_sueno) != null && v.horas_sueno < lim).length;
}

export function entradaCombinaciones({ analisis, data, tripulacion = [], medicamentos = [], medicamentosTripulacion = null, respuestas = {}, causas = {}, oximetro = null, ahora = Date.now() } = {}) {
  const porK = Object.fromEntries((analisis?.tarjetas || []).map((t) => [t.k, t]));
  const ev = data?.enVivo || {};
  const fecha = analisis?.fecha;
  const orto = [...(data?.pruebas || [])].filter((p) => p.tipo === "ortostatica" && p.fecha === fecha).sort((x, y) => String(y.creada_en || "").localeCompare(String(x.creada_en || "")))[0];
  let ortostatica = null;
  if (orto) {
    const e = evaluarOrtostatica(orto.resultado || {});
    const peor = [...e.caidas].sort((x, y) => (y.sis || 0) - (x.sis || 0))[0] || {};
    ortostatica = { caidaSis: peor.sis || 0, caidaDia: Math.max(...e.caidas.map((c) => c.dia || 0)) };
  }
  const rad = analisis?.radiacion || {};
  const eventos = (data?.eventos || []).map((e) => ({ tipo: "tormenta", inicio: e.inicio, fin: e.fin }));
  const cab = porK.cabina?.cabinaHoy || {};
  return {
    astronauta: {
      id: data?.astronaut?.id, lectura: analisis?.hoy || {}, ci: analisis?.checkinHoy || {}, gravedades: analisis?.gravedades || {},
      news2: analisis?.news2?.total ?? null, news2Desglose: analisis?.news2?.desglose || null,
      who5: num(porK.animo?.valor), horasSueno: num(porK.sueno?.valor), nochesBajoBase: nochesBajoBase(data?.vitals || [], analisis?.baselines?.sueno?.media),
      actividad: analisis?.actividad?.estado || "reposo", fase: ev.fase_mision || "orbita", diaMision: data?.astronaut?.dia_mision ?? null,
      tareaCritica: !!ev.tarea_critica, oximetro: num(oximetro), ortostatica, medicamentos, medicamentosTripulacion,
      tormentaActiva: !!rad.activo, spo2Bajo2h: num(analisis?.hoy?.spo2) != null && analisis.hoy.spo2 < 94, causas,
    },
    tripulacion,
    cabina: { co2_ppm: num(cab.co2_ppm), temp_c: num(cab.temp_c), humedad: num(cab.humedad) },
    eventosRecientes: eventos,
    respuestas,
    ahora,
  };
}

export function evaluarConCombinaciones(clave, { contexto, respuestas = {}, todas = {}, entrada = {} } = {}) {
  const todasR = { ...todas, [clave]: respuestas };
  const primera = evaluarFicha(clave, { contexto, respuestas, todas: todasR });
  if (!primera) return { ficha: null, combinaciones: [] };
  const causas = { ...(entrada.astronauta?.causas || {}), [clave]: primera.principales[0]?.id || null };
  const combinaciones = evaluarCombinaciones({ ...entrada, astronauta: { ...(entrada.astronauta || {}), causas }, respuestas: { ...(entrada.respuestas || {}), ...todasR } });
  const ficha = evaluarFicha(clave, { contexto, respuestas, todas: todasR, combinaciones });
  return { ficha, combinaciones };
}

export function nivelNoBaja(antes, despues) {
  return RANGO_NIVEL[despues] >= RANGO_NIVEL[antes];
}
