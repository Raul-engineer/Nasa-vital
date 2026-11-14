export const UMBRALES = {
  provisional: true,
  vfcCaidaPct: 0.2,
  fcSubeLpm: 10,
  suenoMetaHoras: 7,
  suenoCriticoHoras: 6,
  pvtPeorPct: 0.1,
  ejercicioMinMin: 90,
  animoBajo: 2,
  estresAlto: 4,
  rachaVfc: 3,
  rachaSueno: 3,
  rachaEjercicio: 5,
  rachaAnimo: 3,
  diasMinLineaBase: 14,
  spo2Emergencia: 90,
  news2: {
    frecResp: [[8, 3], [11, 1], [20, 0], [24, 2], [Infinity, 3]],
    spo2: [[91, 3], [93, 2], [95, 1], [Infinity, 0]],
    sistolica: [[90, 3], [100, 2], [110, 1], [219, 0], [Infinity, 3]],
    pulso: [[40, 3], [50, 1], [90, 0], [110, 1], [130, 2], [Infinity, 3]],
    temperatura: [[35.0, 3], [36.0, 1], [38.0, 0], [39.0, 1], [Infinity, 2]],
    confusion: 3,
    medioMin: 5,
    altoMin: 7,
  },
  presion: { normalSis: 120, normalDia: 79, hipertensionSis: 140, hipertensionDia: 90, urgenciaSis: 180, urgenciaDia: 110, hipotensionSis: 100 },
  radiacion: {
    limiteCarrera: 600,
    limite30d: 250,
    atencionPct: 0.5,
    criticoPct: 0.8,
    tasaAtencionX: 3,
    refugioFactor: 0.5,
    multiplicador: { S1: 3, S2: 6, S3: 12, S4: 25, S5: 50 },
    escalaNOAA: [[100000, "S5"], [10000, "S4"], [1000, "S3"], [100, "S2"], [10, "S1"]],
  },
  estresVfc: { enBase: 25, caidaRef: 0.4, enCaidaRef: 85, moderado: 40, alto: 65 },
  ortostatica: { caidaSis: 20, caidaDia: 10 },
  pvt: { duracionS: 180, isiMinMs: 1000, isiMaxMs: 4000, lapsoMs: 355, falsaMs: 100, lapsosAtencion: 5, mejoraPct: 0.1, empeoraPct: 0.3 },
  who5: { sugierePhq9: 50, atencion: 28, cadaDias: 7 },
  phq9: { atencion: 10, cadaDias: 7 },
  gad7: { atencion: 10, cadaDias: 7 },
  ventanaTamizajeDias: 7,
  rangos: { fc: [51, 90], spo2: [96, 100], temperatura: [36.1, 38.0], frecResp: [12, 20], estres: [0, 39] },
};

export const FUENTES = {
  news2: "news2",
  presion: "pronam",
  radiacion: "nasa3001,ochmo",
  dosimetro: "hera,ochmo",
  noaa: "noaa",
  estresVfc: "Estimado por VFC vs. tu línea base",
  lineaBase: "Tu línea base personal (días −37 a −8)",
  ortostatica: "ortostatica",
  reaccion: "pvtb",
  sueno: "aasm",
  spo2: "news2,oms_oximetria",
  sans: "nasa_sans,amsler",
  amsler: "amsler,nasa_sans",
  who5: "who5",
  phq9: "phq9",
  gad7: "gad7",
  equipo: "Regla provisional del equipo",
  checkin: "Auto-reporte del check-in",
};

export const SISTEMAS = {
  cardiovascular: { nombre: "Cardiovascular", icono: "heart" },
  respiratorio: { nombre: "Respiratorio", icono: "lungs" },
  sueno: { nombre: "Sueño", icono: "moon" },
  radiacion: { nombre: "Radiación", icono: "rad" },
  hueso_musculo: { nombre: "Hueso y músculo", icono: "bone" },
  vision: { nombre: "Visión / SANS", icono: "eye" },
  salud_mental: { nombre: "Salud mental", icono: "brain" },
};

export const PRUEBAS = {
  checkin: { nombre: "Check-in diario completo", icono: "clipboard", duracion: "2 min", fuente: FUENTES.checkin },
  remedicion: { nombre: "Remedición en reposo", icono: "heart", duracion: "5 min", fuente: FUENTES.news2 },
  ortostatica: { nombre: "Prueba ortostática", icono: "standing", duracion: "4 min", fuente: FUENTES.ortostatica },
  reaccion: { nombre: "Prueba de reacción (PVT-B)", icono: "target", duracion: "3 min", fuente: FUENTES.reaccion },
  who5: { nombre: "Bienestar WHO-5", icono: "smile", duracion: "1 min", fuente: FUENTES.who5 },
  phq9: { nombre: "Tamizaje PHQ-9", icono: "brain", duracion: "3 min", fuente: FUENTES.phq9 },
  gad7: { nombre: "Tamizaje GAD-7", icono: "bolt", duracion: "2 min", fuente: FUENTES.gad7 },
  amsler: { nombre: "Rejilla de Amsler", icono: "eye", duracion: "2 min", fuente: FUENTES.amsler },
};

const ORDEN = { critico: 0, atencion: 1, normal: 2 };
const PRIORIDAD = { radiacion_tormenta: 0, spo2_emergencia: 1, phq9_item9: 2, news2_alto: 3, presion_urgencia: 4, confusion: 5 };
export const peor = (...e) => e.filter(Boolean).sort((a, b) => ORDEN[a] - ORDEN[b])[0] || "normal";

const num = (x) => (x == null || x === "" || Number.isNaN(Number(x)) ? null : Number(x));
const avg = (arr) => {
  const v = arr.map(num).filter((x) => x != null);
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0;
};
const sd = (arr) => {
  const v = arr.map(num).filter((x) => x != null);
  const m = avg(v);
  return Math.sqrt(avg(v.map((x) => (x - m) ** 2)));
};
const mediana = (arr) => {
  const v = arr.map(num).filter((x) => x != null).sort((a, b) => a - b);
  if (!v.length) return 0;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};
const last = (arr, n) => arr.slice(-n);
const pct = (a, b) => (a == null || b == null || !b ? null : (a - b) / b);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export function fechaLocal(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const fechaDe = fechaLocal;
const diasEntre = (a, b) => Math.round((new Date(a + "T12:00:00") - new Date(b + "T12:00:00")) / 864e5);
export { mediana };

function baselineSerie(serie) {
  const ventana = serie.slice(-37, -7).map(num).filter((x) => x != null);
  const m = avg(ventana);
  const s = sd(ventana);
  return { media: m, sd: s, min: m - s, max: m + s, n: ventana.length };
}

export function baseline(rows, campo) {
  return baselineSerie(rows.map((r) => r[campo]));
}

function racha(rows, cond) {
  let n = 0;
  for (let i = rows.length - 1; i >= 0; i--) {
    if (cond(rows[i])) n++;
    else break;
  }
  return n;
}

export function diaMision(astronaut, fecha) {
  const hoy = new Date();
  hoy.setHours(12, 0, 0, 0);
  const f = new Date(fecha + "T12:00:00");
  const diff = Math.round((hoy - f) / 864e5);
  return (astronaut?.dia_mision || 142) - diff;
}

export function puntosNews2(tabla, valor) {
  const v = num(valor);
  if (v == null) return null;
  for (const [max, p] of tabla) if (v <= max) return p;
  return 0;
}

export function estadoPorPuntos(p) {
  return p == null || p === 0 ? "normal" : p >= 3 ? "critico" : "atencion";
}

export function nivelNOAA(flujo) {
  const f = num(flujo);
  if (f == null) return "Normal";
  for (const [min, s] of UMBRALES.radiacion.escalaNOAA) if (f >= min) return s;
  return "Normal";
}

export function calcularNews2(lectura, ci = {}) {
  const N = UMBRALES.news2;
  const desglose = [
    { k: "fr", nombre: "Frecuencia respiratoria", valor: num(lectura.frec_resp), unidad: "rpm", puntos: puntosNews2(N.frecResp, lectura.frec_resp), sistema: "respiratorio" },
    { k: "spo2", nombre: "SpO₂", valor: num(lectura.spo2), unidad: "%", puntos: puntosNews2(N.spo2, lectura.spo2), sistema: "respiratorio" },
    { k: "sistolica", nombre: "Presión sistólica", valor: num(lectura.sistolica), unidad: "mmHg", puntos: puntosNews2(N.sistolica, lectura.sistolica), sistema: "cardiovascular" },
    { k: "pulso", nombre: "Pulso", valor: num(lectura.fc), unidad: "lpm", puntos: puntosNews2(N.pulso, lectura.fc), sistema: "cardiovascular" },
    { k: "temperatura", nombre: "Temperatura", valor: num(lectura.temperatura), unidad: "°C", puntos: puntosNews2(N.temperatura, lectura.temperatura), sistema: "respiratorio" },
    { k: "conciencia", nombre: "Conciencia", valor: ci.confusion ? "Confusión" : "Alerta", unidad: "", puntos: ci.confusion ? N.confusion : 0, sistema: "salud_mental" },
  ];
  const total = desglose.reduce((s, d) => s + (d.puntos || 0), 0);
  const algun3 = desglose.some((d) => d.puntos === 3);
  let nivel = { clave: "bajo", txt: "Riesgo bajo", estado: "normal" };
  if (total >= N.altoMin) nivel = { clave: "alto", txt: "Riesgo alto, emergencia", estado: "critico" };
  else if (total >= N.medioMin) nivel = { clave: "medio", txt: "Riesgo medio, urgente", estado: "atencion" };
  else if (algun3) nivel = { clave: "urgente", txt: "Respuesta urgente", estado: "atencion" };
  return { total, nivel, desglose, algun3, fuente: FUENTES.news2 };
}

export function clasificarPresion(sis, dia) {
  const P = UMBRALES.presion;
  const s = num(sis);
  const d = num(dia);
  if (s == null || d == null) return { clave: "sin", txt: "Sin dato", estado: "normal", rango: 0 };
  if (s >= P.urgenciaSis || d >= P.urgenciaDia) return { clave: "urgencia", txt: "Urgencia hipertensiva", estado: "critico", rango: 3 };
  if (s >= P.hipertensionSis || d >= P.hipertensionDia) return { clave: "hipertension", txt: "Hipertensión", estado: "atencion", rango: 2 };
  if (s > P.normalSis || d > P.normalDia) return { clave: "limitrofe", txt: "Limítrofe", estado: "atencion", rango: 1 };
  return { clave: "normal", txt: "Normal", estado: "normal", rango: 0 };
}

export function estresPorVfc(vfc, base) {
  const v = num(vfc);
  if (v == null || !base) return null;
  const E = UMBRALES.estresVfc;
  const caida = (base - v) / base;
  return Math.round(clamp(E.enBase + (caida * (E.enCaidaRef - E.enBase)) / E.caidaRef, 0, 100));
}

export function etiquetaEstres(p) {
  const E = UMBRALES.estresVfc;
  if (p == null) return { txt: "Sin dato", estado: "normal" };
  if (p >= E.alto) return { txt: "Alto", estado: "atencion" };
  if (p >= E.moderado) return { txt: "Moderado", estado: "atencion" };
  return { txt: "Relajado", estado: "normal" };
}

function cambios(serie) {
  const v = serie.map(num);
  const n = v.length;
  const hoy = v[n - 1];
  return { cambioAyer: pct(hoy, v[n - 2]), cambio7: pct(hoy, avg(v.slice(-8, -1))) };
}

function fueraDe(v, [a, b]) {
  return v != null && (v < a || v > b);
}

function construirSignos({ vitals, lectura, bVfc }) {
  const R = UMBRALES.rangos;
  const N = UMBRALES.news2;
  const serieDe = (campo) => vitals.map((r, i) => (i === vitals.length - 1 ? num(lectura[campo]) : num(r[campo])));
  const base = (serie) => baselineSerie(serie);
  const out = {};

  const fcS = serieDe("fc");
  const fcP = puntosNews2(N.pulso, lectura.fc);
  out.fc = {
    k: "fc", nombre: "Frecuencia cardiaca", corto: "FC", icono: "heart", unidad: "lpm", campo: "fc", sistema: "cardiovascular",
    valor: num(lectura.fc), texto: `${num(lectura.fc) ?? "—"}`, rango: `${R.fc[0]}–${R.fc[1]}`, puntos: fcP,
    estado: estadoPorPuntos(fcP), etiqueta: lectura.fc < R.fc[0] ? "Baja" : lectura.fc > R.fc[1] ? "Elevada" : "Normal",
    fuera: fueraDe(num(lectura.fc), R.fc), serie: fcS, base: base(fcS), fuente: FUENTES.news2, dec: 0, ...cambios(fcS),
  };

  const spS = serieDe("spo2");
  const spP = puntosNews2(N.spo2, lectura.spo2);
  const spEmerg = num(lectura.spo2) != null && lectura.spo2 < UMBRALES.spo2Emergencia;
  out.spo2 = {
    k: "spo2", nombre: "Saturación de oxígeno", corto: "SpO₂", icono: "o2", unidad: "%", campo: "spo2", sistema: "respiratorio",
    valor: num(lectura.spo2), texto: `${num(lectura.spo2) ?? "—"}`, rango: `≥ ${R.spo2[0]}`, puntos: spP,
    estado: spEmerg ? "critico" : estadoPorPuntos(spP), etiqueta: spEmerg ? "Emergencia" : lectura.spo2 < R.spo2[0] ? "Baja" : "Normal",
    fuera: fueraDe(num(lectura.spo2), R.spo2), serie: spS, base: base(spS), fuente: FUENTES.spo2, dec: 1, ...cambios(spS),
  };

  const tS = serieDe("temperatura");
  const tP = puntosNews2(N.temperatura, lectura.temperatura);
  out.temperatura = {
    k: "temperatura", nombre: "Temperatura", corto: "Temp", icono: "thermo", unidad: "°C", campo: "temperatura", sistema: "respiratorio",
    valor: num(lectura.temperatura), texto: `${num(lectura.temperatura) ?? "—"}`, rango: `${R.temperatura[0]}–${R.temperatura[1].toFixed(1)}`, puntos: tP,
    estado: estadoPorPuntos(tP), etiqueta: lectura.temperatura < R.temperatura[0] ? "Baja" : lectura.temperatura > R.temperatura[1] ? "Elevada" : "Normal",
    fuera: fueraDe(num(lectura.temperatura), R.temperatura), serie: tS, base: base(tS), fuente: FUENTES.news2, dec: 1, ...cambios(tS),
  };

  const sS = serieDe("sistolica");
  const dS = serieDe("diastolica");
  const pa = clasificarPresion(lectura.sistolica, lectura.diastolica);
  const sP = puntosNews2(N.sistolica, lectura.sistolica);
  const hipo = num(lectura.sistolica) != null && lectura.sistolica <= UMBRALES.presion.hipotensionSis;
  out.pa = {
    k: "pa", nombre: "Presión arterial", corto: "PA", icono: "bp", unidad: "mmHg", campo: "sistolica", campo2: "diastolica", sistema: "cardiovascular",
    valor: num(lectura.sistolica), valor2: num(lectura.diastolica), texto: `${num(lectura.sistolica) ?? "—"}/${num(lectura.diastolica) ?? "—"}`,
    rango: `≤ ${UMBRALES.presion.normalSis}/${UMBRALES.presion.normalDia}`, puntos: sP, clasificacion: pa,
    estado: peor(pa.estado, hipo ? estadoPorPuntos(sP) : null), etiqueta: hipo ? "Baja" : pa.txt,
    fuera: hipo || pa.clave !== "normal", serie: sS, serie2: dS, base: base(sS), base2: base(dS), fuente: FUENTES.presion, dec: 0, ...cambios(sS),
  };

  const frS = serieDe("frec_resp");
  const frP = puntosNews2(N.frecResp, lectura.frec_resp);
  out.fr = {
    k: "fr", nombre: "Frecuencia respiratoria", corto: "FR", icono: "lungs", unidad: "rpm", campo: "frec_resp", sistema: "respiratorio",
    valor: num(lectura.frec_resp), texto: `${num(lectura.frec_resp) ?? "—"}`, rango: `${R.frecResp[0]}–${R.frecResp[1]}`, puntos: frP,
    estado: estadoPorPuntos(frP), etiqueta: lectura.frec_resp < R.frecResp[0] ? "Baja" : lectura.frec_resp > R.frecResp[1] ? "Elevada" : "Normal",
    fuera: fueraDe(num(lectura.frec_resp), R.frecResp), serie: frS, base: base(frS), fuente: FUENTES.news2, dec: 0, ...cambios(frS),
  };

  const eS = vitals.map((r) => estresPorVfc(r.vfc, bVfc.media));
  const eHoy = eS[eS.length - 1];
  const eEt = etiquetaEstres(eHoy);
  out.estres = {
    k: "estres", nombre: "Estrés (estimado por VFC)", corto: "Estrés", icono: "brain", unidad: "%", campo: "estres", sistema: "salud_mental",
    valor: eHoy, texto: `${eHoy ?? "—"}`, rango: `< ${UMBRALES.estresVfc.moderado}`, puntos: null,
    estado: eEt.estado, etiqueta: eEt.txt, fuera: eHoy != null && eHoy >= UMBRALES.estresVfc.moderado,
    serie: eS, base: base(eS), fuente: FUENTES.estresVfc, dec: 0, ...cambios(eS), vfc: num(vitals.at(-1)?.vfc), vfcBase: bVfc.media,
  };
  return out;
}

function construirMetricas({ vitals, signos, profile, radiacion }) {
  const serie = (campo) => vitals.map((r) => num(r[campo]));
  const estatura = num(profile?.estatura_cm) ? profile.estatura_cm / 100 : null;
  const imcS = estatura ? vitals.map((r) => (num(r.peso) ? Math.round((r.peso / estatura ** 2) * 10) / 10 : null)) : [];
  const m = (k, nombre, grupo, unidad, s, opts = {}) => {
    const v = s.map(num);
    const validos = v.filter((x) => x != null);
    return {
      k, nombre, grupo, unidad, serie: s, n: validos.length, prom: avg(validos), base: baselineSerie(s),
      prom30: avg(v.slice(-30)), valor: v[v.length - 1], ...cambios(s), dec: 0, ...opts,
    };
  };
  return [
    m("fc", "Frecuencia cardiaca", "Corazón", "lpm", signos.fc.serie, { sub: "última lectura", estado: signos.fc.estado }),
    m("fc_reposo", "FC en reposo", "Corazón", "lpm", serie("fc"), { sub: "registro diario" }),
    m("vfc", "VFC", "Corazón", "ms", serie("vfc"), { sub: "variabilidad (RMSSD)" }),
    m("pa", "Presión arterial", "Corazón", "mmHg", signos.pa.serie, { texto: signos.pa.texto, sub: "sistólica en la gráfica", estado: signos.pa.estado }),
    m("spo2", "SpO₂", "Respiratorio", "%", signos.spo2.serie, { dec: 1, estado: signos.spo2.estado }),
    m("fr", "Frecuencia respiratoria", "Respiratorio", "rpm", signos.fr.serie, { estado: signos.fr.estado }),
    m("temperatura", "Temperatura", "Cuerpo", "°C", signos.temperatura.serie, { dec: 1, estado: signos.temperatura.estado }),
    m("peso", "Peso", "Cuerpo", "kg", serie("peso"), { dec: 1 }),
    m("imc", "IMC", "Cuerpo", "kg/m²", imcS, { dec: 1, sub: estatura ? `estatura ${profile.estatura_cm} cm` : "falta estatura en Perfil" }),
    m("ejercicio", "Ejercicio", "Actividad", "min", serie("minutos_ejercicio"), { sub: "resistencia" }),
    m("sueno", "Sueño", "Espacial", "h", serie("horas_sueno"), { dec: 1 }),
    m("radiacion", "Radiación", "Espacial", "mSv", serie("dosis_dia_msv"), {
      dec: 2, texto: `${Math.round(radiacion.carrera)}`, sub: `carrera vs. ${UMBRALES.radiacion.limiteCarrera} mSv · gráfica: dosis diaria`, estado: radiacion.estado,
    }),
  ];
}

export function tasaAuSvh(dosisDiaMsv) {
  return ((num(dosisDiaMsv) || 0) / 24) * 1000;
}

export function dosisEvento(evento, astronautId, { baseDiaMsv, dosisPorFecha, fechaHoy, ahora = Date.now() }) {
  const R = UMBRALES.radiacion;
  const ini = fechaDe(evento.inicio);
  if (evento.fin && fechaHoy && ini !== fechaHoy && dosisPorFecha) {
    const finF = fechaDe(evento.fin);
    let s = 0;
    for (const [f, d] of dosisPorFecha) if (f >= ini && f <= finF) s += d;
    if (s > 0) return s;
  }
  const t0 = new Date(evento.inicio).getTime();
  const t1 = evento.fin ? new Date(evento.fin).getTime() : ahora;
  const tr = evento.refugio?.[astronautId] ? new Date(evento.refugio[astronautId]).getTime() : null;
  const horas = tr && tr < t1 ? (Math.max(0, tr - t0) + R.refugioFactor * (t1 - tr)) / 36e5 : Math.max(0, t1 - t0) / 36e5;
  return (tasaAuSvh(baseDiaMsv) * (R.multiplicador[evento.nivel] || 1) * horas) / 1000;
}

function evaluarRadiacion({ astronaut, vitals, profile, eventos = [], fechaHoy, historico }) {
  const R = UMBRALES.radiacion;
  const aid = astronaut?.id;
  const dosis = vitals.map((v) => num(v.dosis_dia_msv) ?? 0);
  const dosisPorFecha = vitals.map((v) => [v.fecha, num(v.dosis_dia_msv) ?? 0]);
  const ventanaBase = dosis.slice(-37, -7);
  const baseDia = mediana(ventanaBase.length ? ventanaBase : dosis);
  const hoyDia = dosis[dosis.length - 1] ?? 0;
  const ahora = Date.now();
  const eventosDia = eventos.filter((e) => fechaDe(e.inicio) <= fechaHoy && (!e.fin || fechaDe(e.fin) >= fechaHoy));
  const activo = historico ? eventosDia[0] || null : eventos.find((e) => !e.fin) || null;
  const ctx = { baseDiaMsv: historico ? baseDia : hoyDia || baseDia, dosisPorFecha, fechaHoy, ahora };
  const eventosHoy = historico ? [] : eventos.filter((e) => fechaDe(e.inicio) === fechaHoy);
  const dosisEventosHoy = eventosHoy.reduce((s, e) => s + dosisEvento(e, aid, ctx), 0);
  const diasPrevios = Math.max(0, (astronaut?.dia_mision || 142) - vitals.length);
  const mision = diasPrevios * baseDia + dosis.reduce((s, x) => s + x, 0) + dosisEventosHoy;
  const previa = num(profile?.dosis_carrera_previa_msv) || 0;
  const carrera = previa + mision;
  const ventana30 = dosis.slice(-30).reduce((s, x) => s + x, 0) + dosisEventosHoy;
  const pctCarrera = carrera / R.limiteCarrera;
  const pct30 = ventana30 / R.limite30d;
  const mult = activo ? R.multiplicador[activo.nivel] || 1 : 1;
  const refugio = !!(activo && activo.refugio?.[aid]);
  const tasaBase = tasaAuSvh(baseDia);
  const tasa = historico ? tasaAuSvh(hoyDia) : tasaAuSvh(hoyDia) * mult * (refugio ? R.refugioFactor : 1);
  let estado = "normal";
  let motivo = null;
  if (activo) {
    estado = "critico";
    motivo = `Alarma de radiación: tormenta solar ${activo.nivel}${refugio ? " (en refugio)" : ""}`;
  } else if (pctCarrera >= R.criticoPct || pct30 >= R.criticoPct) {
    estado = "critico";
    motivo = pctCarrera >= R.criticoPct ? `Dosis de carrera al ${Math.round(pctCarrera * 100)} % del límite` : `Dosis de 30 días al ${Math.round(pct30 * 100)} % del límite`;
  } else if (pctCarrera >= R.atencionPct || pct30 >= R.atencionPct || tasa > R.tasaAtencionX * tasaBase) {
    estado = "atencion";
    motivo = pctCarrera >= R.atencionPct ? `Dosis de carrera al ${Math.round(pctCarrera * 100)} % de 600 mSv` : pct30 >= R.atencionPct ? `Dosis de 30 días al ${Math.round(pct30 * 100)} % de 250 mSv` : `Tasa del dosímetro ${Math.round(tasa)} µSv/h, más de 3 veces tu línea base`;
  }
  const terminados = eventos.filter((e) => e.fin).sort((a, b) => String(b.fin).localeCompare(String(a.fin)));
  const ultimo = terminados[0] ? { ...terminados[0], dosis: dosisEvento(terminados[0], aid, ctx) } : null;
  return {
    estado, motivo, baseDia, hoyDia, hoy: hoyDia + dosisEventosHoy, tasa, tasaBase, mult, refugio,
    activo: activo ? { ...activo, dosis: dosisEvento(activo, aid, ctx) } : null, ultimoEvento: ultimo, eventosDia,
    mision, previa, carrera, ventana30, pct: pctCarrera, pct30, limite: R.limiteCarrera, limite30: R.limite30d,
    dosisEvento: (e) => dosisEvento(e, aid, ctx),
  };
}

function lecturaActual(hoy, pruebasDia) {
  const rem = [...pruebasDia].reverse().find((p) => p.tipo === "remedicion" && p.resultado?.despues);
  if (!rem) return { ...hoy };
  const d = rem.resultado.despues;
  return { ...hoy, fc: num(d.fc) ?? hoy.fc, spo2: num(d.spo2) ?? hoy.spo2, sistolica: num(d.sistolica) ?? hoy.sistolica, diastolica: num(d.diastolica) ?? hoy.diastolica, remedida: true };
}

function ultimaPrueba(pruebas, tipo, fechaHoy, dias) {
  return [...pruebas].filter((p) => p.tipo === tipo && p.fecha <= fechaHoy && diasEntre(fechaHoy, p.fecha) < dias)
    .sort((a, b) => String(b.creada_en || b.fecha).localeCompare(String(a.creada_en || a.fecha)))[0] || null;
}

export function analizar({ astronaut, vitals, checkins, alerts = [], pruebas = [], profile = {}, eventos = [], historico = false }) {
  const U = UMBRALES;
  const hoyBase = vitals[vitals.length - 1] || {};
  const fechaHoy = hoyBase.fecha;
  const pruebasDia = pruebas.filter((p) => p.fecha === fechaHoy);
  const hoy = lecturaActual(hoyBase, pruebasDia);
  const ci = checkins.find((c) => c.fecha === fechaHoy) || checkins[checkins.length - 1] || {};
  const bVfc = baseline(vitals, "vfc");
  const bFc = baseline(vitals, "fc");
  const bSueno = baseline(vitals, "horas_sueno");
  const bReac = baseline(checkins, "tiempo_reaccion_ms");
  const suficiente = vitals.length >= U.diasMinLineaBase;

  const news2 = calcularNews2(hoy, ci);
  const signos = construirSignos({ vitals, lectura: hoy, bVfc });
  const radiacion = evaluarRadiacion({ astronaut, vitals, profile, eventos, fechaHoy, historico });
  const reglas = [];
  const add = (a) => reglas.push({ fuente: FUENTES.equipo, ...a, id: a.id || a.clave });

  const pvtHoy = [...pruebasDia].reverse().find((p) => p.tipo === "reaccion" && p.resultado?.mediana_ms);
  const reaccionHoy = num(pvtHoy?.resultado?.mediana_ms) ?? num(ci.tiempo_reaccion_ms);
  const reaccionCambio = bReac.media && reaccionHoy != null ? (reaccionHoy - bReac.media) / bReac.media : null;
  const pvtPeor = reaccionCambio != null && reaccionCambio > U.pvtPeorPct;

  const rachaVfc = suficiente ? racha(vitals, (r) => r.vfc < bVfc.media * (1 - U.vfcCaidaPct)) : 0;
  const rachaCorto = racha(vitals, (x) => num(x.horas_sueno) < U.suenoMetaHoras);
  const rachaMuyCorto = racha(vitals, (x) => num(x.horas_sueno) <= U.suenoCriticoHoras);
  const rachaEj = racha(vitals, (x) => x.minutos_ejercicio < U.ejercicioMinMin);
  const rachaAnimo = racha(checkins, (x) => x.animo <= U.animoBajo || x.estres >= U.estresAlto);
  const vfc7 = avg(last(vitals, 7).map((r) => r.vfc));
  const vfcCambioPct = bVfc.media ? (vfc7 - bVfc.media) / bVfc.media : 0;

  if (news2.nivel.clave !== "bajo") {
    const top = [...news2.desglose].sort((a, b) => (b.puntos || 0) - (a.puntos || 0))[0];
    add({
      clave: news2.nivel.clave === "alto" ? "news2_alto" : "news2", sistema: top.sistema, estado: news2.nivel.estado, capa: "aguda",
      motivo: `NEWS2 ${news2.total}: ${news2.nivel.txt.toLowerCase()} (${top.nombre.toLowerCase()} con ${top.puntos} pts)`, fuente: FUENTES.news2,
    });
  }
  if (num(hoy.spo2) != null && hoy.spo2 < U.spo2Emergencia) {
    add({ clave: "spo2_emergencia", sistema: "respiratorio", estado: "critico", capa: "aguda", motivo: `SpO₂ de ${hoy.spo2} %: emergencia, avisa al médico de tripulación`, fuente: FUENTES.spo2 });
  }
  const pa = signos.pa.clasificacion;
  if (pa.clave === "urgencia") add({ clave: "presion_urgencia", sistema: "cardiovascular", estado: "critico", capa: "aguda", motivo: `Presión ${signos.pa.texto} mmHg: urgencia hipertensiva`, fuente: FUENTES.presion });
  else if (pa.clave === "hipertension") add({ clave: "presion_alta", sistema: "cardiovascular", estado: "atencion", capa: "aguda", motivo: `Presión ${signos.pa.texto} mmHg: hipertensión`, fuente: FUENTES.presion });

  if (rachaVfc >= U.rachaVfc) add({ clave: "vfc", sistema: "cardiovascular", estado: "atencion", capa: "tendencia", rachaDias: rachaVfc, motivo: `VFC por debajo de tu línea base ${rachaVfc} días seguidos`, fuente: FUENTES.lineaBase });
  if (suficiente && rachaVfc < U.rachaVfc && num(hoy.fc) > bFc.media + U.fcSubeLpm) add({ clave: "fc_base", sistema: "cardiovascular", estado: "atencion", capa: "tendencia", motivo: `FC en reposo ${Math.round(hoy.fc - bFc.media)} lpm sobre tu línea base`, fuente: FUENTES.lineaBase });
  if (rachaMuyCorto >= U.rachaSueno && pvtPeor) {
    add({ clave: "sueno", sistema: "sueno", estado: "critico", capa: "tendencia", rachaDias: rachaMuyCorto, motivo: `${U.suenoCriticoHoras} h de sueño o menos ${rachaMuyCorto} noches y reacción ${Math.round(reaccionCambio * 100)} % más lenta que tu línea base`, fuente: "aasm,pvtb" });
  } else if (rachaCorto >= U.rachaSueno) {
    add({ clave: "sueno", sistema: "sueno", estado: "atencion", capa: "tendencia", rachaDias: rachaCorto, motivo: `Menos de ${U.suenoMetaHoras} h de sueño ${rachaCorto} noches seguidas`, fuente: FUENTES.sueno });
  }
  if (rachaEj >= U.rachaEjercicio) add({ clave: "hueso", sistema: "hueso_musculo", estado: "atencion", capa: "tendencia", rachaDias: rachaEj, motivo: `Ejercicio de resistencia bajo ${rachaEj} días seguidos` });
  if (rachaAnimo >= U.rachaAnimo) add({ clave: "salud_mental", sistema: "salud_mental", estado: "atencion", capa: "tendencia", rachaDias: rachaAnimo, motivo: `Ánimo bajo o estrés alto ${rachaAnimo} días seguidos`, fuente: FUENTES.checkin });

  const R = U.radiacion;
  if (radiacion.activo) add({ clave: "radiacion_tormenta", sistema: "radiacion", estado: "critico", capa: "radiacion", motivo: radiacion.motivo, fuente: "nasa3001,ochmo,hera", eventoId: radiacion.activo.id });
  if (radiacion.pct >= R.atencionPct) add({ clave: "radiacion_carrera", sistema: "radiacion", estado: radiacion.pct >= R.criticoPct ? "critico" : "atencion", capa: "radiacion", motivo: `Dosis de carrera ${Math.round(radiacion.carrera)} mSv: ${Math.round(radiacion.pct * 100)} % del límite de 600 mSv`, fuente: FUENTES.radiacion });
  if (radiacion.pct30 >= R.atencionPct) add({ clave: "radiacion_30d", sistema: "radiacion", estado: radiacion.pct30 >= R.criticoPct ? "critico" : "atencion", capa: "radiacion", motivo: `Dosis de 30 días ${Math.round(radiacion.ventana30)} mSv: ${Math.round(radiacion.pct30 * 100)} % del límite de 250 mSv`, fuente: FUENTES.radiacion });
  if (!radiacion.activo && radiacion.tasa > R.tasaAtencionX * radiacion.tasaBase) add({ clave: "radiacion_tasa", sistema: "radiacion", estado: "atencion", capa: "radiacion", motivo: `Tasa del dosímetro ${Math.round(radiacion.tasa)} µSv/h, más de 3 veces tu línea base`, fuente: FUENTES.dosimetro });

  const amsler = ultimaPrueba(pruebas, "amsler", fechaHoy, U.ventanaTamizajeDias);
  const amslerDist = !!(amsler && (amsler.resultado?.od || amsler.resultado?.oi));
  if (ci.confusion) add({ clave: "confusion", sistema: "salud_mental", estado: "critico", capa: "checkin", motivo: "Reportaste confusión o desorientación", fuente: FUENTES.news2 });
  if (ci.vision_cefalea) add({ clave: "sans", sistema: "vision", estado: "atencion", capa: "checkin", motivo: amslerDist ? "Visión borrosa o dolor de cabeza, con distorsión en la rejilla de Amsler" : "Reportaste visión borrosa o dolor de cabeza", fuente: FUENTES.sans });
  else if (amslerDist) add({ clave: "amsler", sistema: "vision", estado: "atencion", capa: "checkin", motivo: "Distorsión en la rejilla de Amsler (complemento; revísalo con el médico)", fuente: FUENTES.amsler });
  if (ci.mareo_de_pie) add({ clave: "ortostatica", sistema: "cardiovascular", estado: "atencion", capa: "checkin", motivo: "Reportaste mareo al ponerte de pie: haz la prueba ortostática", fuente: FUENTES.ortostatica });

  const who5 = ultimaPrueba(pruebas, "who5", fechaHoy, U.who5.cadaDias);
  const phq9 = ultimaPrueba(pruebas, "phq9", fechaHoy, U.phq9.cadaDias);
  const gad7 = ultimaPrueba(pruebas, "gad7", fechaHoy, U.gad7.cadaDias);
  const sugerencias = [];
  if (who5) {
    const p = num(who5.resultado?.puntaje);
    if (p <= U.who5.atencion) add({ clave: "who5", sistema: "salud_mental", estado: "atencion", capa: "checkin", motivo: `WHO-5 de ${p}/100: bienestar bajo. Medic avisó al médico de tripulación`, fuente: FUENTES.who5 });
    if (p <= U.who5.sugierePhq9 && !(phq9 && String(phq9.creada_en || phq9.fecha) >= String(who5.creada_en || who5.fecha)))
      sugerencias.push({ texto: `Tu WHO-5 fue ${p}/100: te sugiero contestar el PHQ-9.`, href: "/pruebas?t=phq9", fuente: FUENTES.who5 });
  }
  if (phq9) {
    const p = num(phq9.resultado?.puntaje);
    if (num(phq9.resultado?.item9) > 0) add({ clave: "phq9_item9", sistema: "salud_mental", estado: "critico", capa: "checkin", motivo: "PHQ-9: respuesta en la pregunta 9. Aviso inmediato al médico de tripulación", fuente: FUENTES.phq9 });
    if (p >= U.phq9.atencion) add({ clave: "phq9", sistema: "salud_mental", estado: "atencion", capa: "checkin", motivo: `PHQ-9 de ${p} (tamizaje, no diagnóstico). Medic avisó al médico de tripulación`, fuente: FUENTES.phq9 });
  }
  if (gad7 && num(gad7.resultado?.puntaje) >= U.gad7.atencion) add({ clave: "gad7", sistema: "salud_mental", estado: "atencion", capa: "checkin", motivo: `GAD-7 de ${gad7.resultado.puntaje} (tamizaje, no diagnóstico). Medic avisó al médico de tripulación`, fuente: FUENTES.gad7 });
  if (!phq9 || !gad7) sugerencias.push({ texto: "Toca tu tamizaje semanal de ánimo (PHQ-9 y GAD-7).", href: `/pruebas?t=${!phq9 ? "phq9" : "gad7"}`, fuente: "phq9,gad7" });

  for (const a of alerts) {
    if (a.resuelta || a.sistema === "radiacion") continue;
    const estado = a.nivel === "critico" ? "critico" : "atencion";
    add({ id: `reportada-${a.id}`, clave: a.clave || (estado === "critico" ? "escalada" : a.sistema), sistema: a.sistema in SISTEMAS ? a.sistema : "cardiovascular", estado, capa: "reportada", motivo: a.mensaje, alertaId: a.id, fuente: "Aviso al médico de tripulación" });
  }

  const vfcR = reglas.find((r) => r.clave === "vfc");
  const suenoR = reglas.find((r) => r.clave === "sueno");
  let lista = reglas;
  if (vfcR && suenoR) {
    lista = [
      {
        id: "vfc_sueno", clave: "vfc_sueno", sistema: "sueno", sistemas: ["cardiovascular", "sueno"], estado: suenoR.estado, capa: "tendencia",
        rachaDias: Math.min(vfcR.rachaDias, suenoR.rachaDias),
        motivo: suenoR.estado === "critico" ? `VFC baja + sueño ≤ ${U.suenoCriticoHoras} h y reacción más lenta que tu línea base` : `VFC por debajo de tu línea base + sueño < ${U.suenoMetaHoras} h`,
        fuente: "aasm,pvtb,Tu línea base personal",
      },
      ...reglas.filter((r) => r !== vfcR && r !== suenoR),
    ];
  }

  const cerradasIds = new Set(pruebasDia.filter((p) => p.desenlace === "mejoro" && p.resultado?.alerta && p.resultado?.alertaEstado !== "critico").map((p) => p.resultado.alerta));
  const cerradas = lista.filter((a) => a.capa !== "reportada" && a.estado !== "critico" && cerradasIds.has(a.id));
  const activas = lista.filter((a) => !cerradas.includes(a)).sort((a, b) => ORDEN[a.estado] - ORDEN[b.estado] || (PRIORIDAD[a.clave] ?? 9) - (PRIORIDAD[b.clave] ?? 9));

  const estadoSis = Object.fromEntries(Object.keys(SISTEMAS).map((k) => [k, "normal"]));
  const motivoSis = {};
  for (const a of activas) {
    for (const s of a.sistemas || [a.sistema]) {
      if (!(s in estadoSis)) continue;
      if (ORDEN[a.estado] < ORDEN[estadoSis[s]] || !motivoSis[s]) motivoSis[s] = a.motivo;
      estadoSis[s] = peor(estadoSis[s], a.estado);
    }
  }
  const sistemas = {
    cardiovascular: {
      estado: estadoSis.cardiovascular, motivo: motivoSis.cardiovascular || null, rachaDias: rachaVfc,
      valor: hoy.fc, unidad: "lpm", etiqueta: "FC en reposo", serie: signos.fc.serie,
      extra: { vfc: hoy.vfc, vfc7, vfcBase: bVfc.media, vfcCambioPct, fcBase: bFc.media, temperatura: { estado: signos.temperatura.estado }, frecResp: { estado: signos.fr.estado } },
    },
    respiratorio: { estado: estadoSis.respiratorio, motivo: motivoSis.respiratorio || null, valor: hoy.spo2, unidad: "%", etiqueta: "SpO₂", serie: signos.spo2.serie, extra: {} },
    sueno: {
      estado: estadoSis.sueno, motivo: motivoSis.sueno || null, rachaDias: rachaCorto, rachaCritica: rachaMuyCorto, valor: num(hoy.horas_sueno), unidad: "h", etiqueta: "Última noche",
      serie: vitals.map((x) => num(x.horas_sueno)), extra: { prom7: avg(last(vitals, 7).map((x) => x.horas_sueno)), base: bSueno.media, reaccionCambio, pvtPeor },
    },
    radiacion: {
      estado: estadoSis.radiacion, motivo: motivoSis.radiacion || null, valor: radiacion.carrera, unidad: "mSv", etiqueta: "Dosis de carrera",
      serie: vitals.map((x) => num(x.dosis_dia_msv)), extra: { hoy: radiacion.hoy, limite: radiacion.limite, pct: radiacion.pct, mision: radiacion.mision, previa: radiacion.previa },
    },
    hueso_musculo: {
      estado: estadoSis.hueso_musculo, motivo: motivoSis.hueso_musculo || null, rachaDias: rachaEj, valor: hoy.minutos_ejercicio, unidad: "min", etiqueta: "Ejercicio hoy",
      serie: vitals.map((x) => num(x.minutos_ejercicio)), extra: { prom7: avg(last(vitals, 7).map((x) => x.minutos_ejercicio)) },
    },
    vision: { estado: estadoSis.vision, motivo: motivoSis.vision || null, valor: ci.vision_cefalea ? "Sí" : "No", unidad: "", etiqueta: "Visión o cefalea", serie: [], extra: { amsler: amslerDist } },
    salud_mental: {
      estado: estadoSis.salud_mental, motivo: motivoSis.salud_mental || null, rachaDias: rachaAnimo, valor: ci.estres, unidad: "/ 5", etiqueta: "Estrés (auto-reporte)",
      serie: checkins.map((x) => num(x.estres)), extra: { animo: ci.animo, fatiga: ci.fatiga, reaccion: ci.tiempo_reaccion_ms, reacBase: bReac.media },
    },
  };

  const general = activas.length ? activas[0].estado : "normal";
  const capa = (c) => peor(...activas.filter((a) => a.capa === c).map((a) => a.estado));
  const urgencia = {
    estado: general,
    capas: { aguda: peor(news2.nivel.estado, capa("aguda")), tendencia: capa("tendencia"), radiacion: radiacion.estado, checkin: capa("checkin") },
  };

  const preparacion = indicePreparacion({ hoy, ci, vitals, bVfc, bFc, bReac });
  const hayCritico = activas.some((a) => a.estado === "critico");
  if (hayCritico) preparacion.etiqueta = "Precaución";
  else if (activas.length && preparacion.etiqueta === "Óptimo") preparacion.etiqueta = "Estable";

  return {
    fecha: fechaHoy, suficiente, sistemas, activas, cerradas, general, urgencia, hoy, checkinHoy: ci, preparacion, hayCritico,
    news2, signos, radiacion, pruebasDia, sugerencias,
    tamizaje: { who5, phq9, gad7, amsler, who5Pendiente: !who5 },
    reaccion: { hoy: reaccionHoy, cambio: reaccionCambio, peor: pvtPeor },
    metricas: construirMetricas({ vitals, signos, profile, radiacion }),
    baselines: { vfc: bVfc, fc: bFc, sueno: bSueno, reaccion: bReac },
  };
}

export function analizarDia(data, fecha) {
  const i = data.vitals.findIndex((v) => v.fecha === fecha);
  if (i < 0) return null;
  return analizar({
    ...data,
    historico: true,
    astronaut: { ...data.astronaut, dia_mision: diaMision(data.astronaut, fecha) },
    vitals: data.vitals.slice(0, i + 1),
    checkins: data.checkins.filter((c) => c.fecha <= fecha),
    alerts: data.alerts.filter((a) => a.fecha === fecha && a.sistema !== "radiacion").map((a) => ({ ...a, resuelta: false })),
    pruebas: (data.pruebas || []).filter((p) => p.fecha <= fecha),
    eventos: (data.eventos || []).filter((e) => fechaDe(e.inicio) <= fecha),
  });
}

const clamp01 = (x) => (Number.isFinite(x) ? Math.max(0, Math.min(1, x)) : 0);
function indicePreparacion({ hoy, ci, vitals, bVfc, bFc, bReac }) {
  const vfc3 = avg(last(vitals, 3).map((r) => r.vfc));
  const reac = ci.tiempo_reaccion_ms || bReac.media;
  const cognitivo = 25 * clamp01(1 - ((reac - bReac.media) / bReac.media) * 1.5);
  const fisico = 25 * (0.5 * clamp01(hoy.minutos_ejercicio / 120) + 0.5 * clamp01(1 - Math.max(0, hoy.fc - bFc.media) / 25));
  const recuperacion = 25 * (0.5 * clamp01((vfc3 / bVfc.media - 0.5) / 0.5) + 0.5 * clamp01((Number(hoy.horas_sueno) - 4) / 3));
  const estres = 25 * (0.4 * clamp01((5 - ci.estres) / 4) + 0.4 * clamp01((ci.animo - 1) / 4) + 0.2 * clamp01((5 - ci.fatiga) / 4));
  const comp = { cognitivo, fisico, recuperacion, estres };
  const estadoDe = (v) => (v >= 18 ? "normal" : v >= 12 ? "atencion" : "critico");
  const total = Math.round(cognitivo + fisico + recuperacion + estres);
  return {
    total,
    componentes: Object.fromEntries(Object.entries(comp).map(([k, v]) => [k, { puntos: Math.round(v), estado: estadoDe(v) }])),
    etiqueta: total >= 80 ? "Óptimo" : total >= 65 ? "Estable" : total >= 50 ? "Recuperación necesaria" : "Precaución",
  };
}

export function protocoloPara(protocols, sistema, nivel) {
  return protocols.find((p) => p.sistema === sistema && p.nivel === nivel) || protocols.find((p) => p.sistema === sistema) || null;
}

export function protocoloDeAlerta(protocols, alerta) {
  if (!alerta) return null;
  return (
    protocols.find((p) => p.clave === alerta.clave) ||
    protocols.find((p) => p.sistema === alerta.sistema && p.nivel === alerta.estado) ||
    (alerta.estado === "critico" ? protocols.find((p) => p.clave === "escalada") : null) ||
    protocoloPara(protocols, alerta.sistema, "atencion")
  );
}

const f0 = (x) => Math.round(x);
export function explicar(alerta, analisis) {
  const s = analisis.sistemas;
  const n = analisis.news2;
  const r = analisis.radiacion;
  switch (alerta.clave) {
    case "vfc_sueno": {
      const p = Math.round(Math.abs(s.cardiovascular.extra.vfcCambioPct) * 100);
      const rc = analisis.reaccion.cambio;
      return alerta.estado === "critico"
        ? `Has dormido 6 h o menos ${alerta.rachaDias} noches, tu VFC está ${p}% bajo tu línea base y tu tiempo de reacción está ${Math.round(rc * 100)}% más lento. Según AASM/SRS un adulto necesita 7 h o más; la falta de sueño sostenida, junto con una reacción más lenta (PVT), aumenta el riesgo de errores en tareas críticas.`
        : `En los últimos ${alerta.rachaDias} días tu VFC se ha mantenido por debajo de tu línea base (−${p}% esta semana) y has dormido menos de 7 h por noche. Esta combinación suele indicar estrés acumulado y recuperación insuficiente.`;
    }
    case "vfc":
      return `Tu VFC lleva ${alerta.rachaDias} días más de 20 % abajo de tu línea base. Una VFC baja sostenida indica que tu sistema nervioso no se está recuperando: puede deberse a mal sueño, carga de trabajo o el inicio de una infección.`;
    case "fc_base":
      return "Tu frecuencia cardiaca en reposo está más de 10 lpm arriba de tu línea base. Puede ser por deshidratación, mal descanso, estrés o fiebre. Una remedición en reposo ayuda a confirmar si fue algo pasajero.";
    case "news2":
    case "news2_alto": {
      const pts = n.desglose.filter((d) => d.puntos).map((d) => `${d.nombre.toLowerCase()} ${d.puntos}`).join(", ");
      return `El puntaje NEWS2 suma puntos cuando un signo vital se aleja del rango normal. Hoy sumas ${n.total} (${pts}). Con este nivel la recomendación es "${n.nivel.txt.toLowerCase()}": revisar de nuevo tus signos y avisar al médico de tripulación.`;
    }
    case "spo2_emergencia":
      return "Una saturación de oxígeno menor a 90 % es una emergencia: tu sangre no está llevando suficiente oxígeno. Avisa al médico de tripulación ahora y repite la medición con el dedo tibio y sin moverte.";
    case "presion_alta":
      return "Tu presión está en rango de hipertensión según PRONAM. Una sola lectura alta puede deberse a esfuerzo, estrés o cafeína: repite la medición en reposo. Si se mantiene, el médico de tripulación ajusta tu plan.";
    case "presion_urgencia":
      return "Tu presión llegó a rango de urgencia hipertensiva (≥ 180/110). Requiere reposo inmediato y revisión del médico de tripulación, aunque te sientas bien.";
    case "ortostatica":
      return "El mareo al ponerte de pie es común en vuelo espacial porque la microgravedad redistribuye los líquidos del cuerpo. La prueba ortostática mide si tu presión cae 20 mmHg o más (sistólica) o 10 o más (diastólica) en los primeros 3 minutos de pie.";
    case "sans":
      return "En misiones largas, el cambio de líquidos hacia la cabeza puede afectar el ojo y la visión (SANS). Una visión borrosa o un dolor de cabeza nuevos deben revisarse temprano; la rejilla de Amsler ayuda como complemento.";
    case "amsler":
      return "La rejilla de Amsler mostró distorsión. Es una prueba de apoyo: por sí sola no confirma un problema, pero conviene repetirla y revisar tu visión con el médico de tripulación.";
    case "confusion":
      return "La confusión o desorientación nueva suma 3 puntos en NEWS2 por sí sola y requiere respuesta urgente: el médico de tripulación debe evaluarte ahora.";
    case "radiacion_tormenta":
      return `La alarma de la nave detectó una tormenta solar ${r.activo?.nivel || ""}. Tu dosímetro marca ${f0(r.tasa)} µSv/h, ${r.refugio ? "ya reducida a la mitad por el blindaje del refugio" : `${r.mult} veces lo normal`}. Llevas ${r.activo ? (r.activo.dosis * 1000).toFixed(0) : 0} µSv en este evento. En el refugio el blindaje reduce la dosis cerca de 50 %.`;
    case "radiacion_carrera":
      return `Tu dosis de carrera es de ${f0(r.carrera)} mSv (${f0(r.previa)} de misiones anteriores + ${f0(r.mision)} de esta). El límite de NASA-STD-3001 es 600 mSv para toda tu carrera; vas en ${f0(r.pct * 100)} %. Conviene reducir exposiciones evitables.`;
    case "radiacion_30d":
      return `En los últimos 30 días recibiste ${f0(r.ventana30)} mSv. El límite de corto plazo es 250 mSv en 30 días para evitar efectos inmediatos; vas en ${f0(r.pct30 * 100)} %.`;
    case "radiacion_tasa":
      return `Tu dosímetro marca ${f0(r.tasa)} µSv/h, más de 3 veces tu línea base de ${f0(r.tasaBase)} µSv/h, sin alarma de la nave. Revisa el dosímetro y muévete a una zona con más blindaje.`;
    case "hueso":
      return `Llevas ${alerta.rachaDias} días con menos de 90 min de ejercicio de resistencia. En microgravedad los huesos pueden perder alrededor de 1–1.5% de densidad por mes sin ejercicio; mantener la rutina es la principal protección.`;
    case "salud_mental":
      return `Tus check-ins muestran ánimo bajo o estrés alto ${alerta.rachaDias} días seguidos. El aislamiento y el confinamiento son factores de riesgo conocidos en misiones largas; detectarlo temprano permite actuar antes de que afecte el desempeño.`;
    case "sueno":
      return alerta.estado === "critico"
        ? `Has dormido 6 h o menos ${alerta.rachaDias} noches y tu reacción está más lenta que tu línea base. AASM/SRS recomiendan 7 h o más; la prueba PVT confirma que el cansancio ya afecta tu atención.`
        : `Has dormido menos de 7 h por ${alerta.rachaDias} noches seguidas. AASM/SRS recomiendan 7 h o más para adultos; la falta de sueño afecta la atención, el tiempo de reacción y la recuperación.`;
    case "who5":
      return "El WHO-5 mide tu bienestar de las últimas dos semanas. Un puntaje de 28 o menos indica bienestar bajo: Medic avisó al médico de tripulación. Es un tamizaje, no un diagnóstico.";
    case "phq9":
      return "El PHQ-9 es un tamizaje de ánimo. Un puntaje de 10 o más merece una conversación con el médico de tripulación. Es un tamizaje, no un diagnóstico.";
    case "phq9_item9":
      return "Respondiste que has tenido pensamientos de que estarías mejor muerto(a) o de lastimarte. Gracias por decirlo. Medic avisó de inmediato al médico de tripulación; no tienes que enfrentarlo solo(a). Es un tamizaje, no un diagnóstico.";
    case "gad7":
      return "El GAD-7 es un tamizaje de ansiedad. Un puntaje de 10 o más merece una conversación con el médico de tripulación. Es un tamizaje, no un diagnóstico.";
    case "escalada":
      return "Una prueba salió peor que la anterior o se reportó un evento grave. Medic ya avisó al médico de tripulación; sigue sus indicaciones.";
    default:
      return alerta.motivo;
  }
}

function puntosLectura(l) {
  const N = UMBRALES.news2;
  return (puntosNews2(N.pulso, l.fc) || 0) + (puntosNews2(N.spo2, l.spo2) || 0) + (puntosNews2(N.sistolica, l.sistolica) || 0);
}

export function evaluarOrtostatica(r) {
  const O = UMBRALES.ortostatica;
  const caidas = ["min1", "min3"].map((k) => ({
    k, sis: num(r.acostado?.sistolica) - num(r[k]?.sistolica), dia: num(r.acostado?.diastolica) - num(r[k]?.diastolica), fc: num(r[k]?.fc) - num(r.acostado?.fc),
  }));
  const pos = caidas.find((c) => c.sis >= O.caidaSis || c.dia >= O.caidaDia);
  return { positiva: !!pos, caidas, momento: pos?.k === "min1" ? "1 min" : pos ? "3 min" : null };
}

export function resumenPvt(respuestas) {
  const P = UMBRALES.pvt;
  const validas = respuestas.filter((r) => r.ms != null && r.ms >= P.falsaMs).map((r) => r.ms);
  const falsas = respuestas.filter((r) => r.falsa || (r.ms != null && r.ms < P.falsaMs)).length;
  const lapsos = validas.filter((ms) => ms >= P.lapsoMs).length;
  return { estimulos: respuestas.filter((r) => !r.falsa || r.ms != null).length, validas: validas.length, lapsos, falsas, mediana_ms: Math.round(mediana(validas)) || null };
}

export function evaluarPrueba(tipo, resultado, analisis) {
  if (tipo === "remedicion") {
    const a = resultado.antes || {};
    const d = resultado.despues || {};
    const pa = puntosLectura(a);
    const pd = puntosLectura(d);
    const ra = clasificarPresion(a.sistolica, a.diastolica).rango;
    const rd = clasificarPresion(d.sistolica, d.diastolica).rango;
    let desenlace = "igual";
    if (pd > pa || rd > ra || (num(d.spo2) != null && d.spo2 < UMBRALES.spo2Emergencia)) desenlace = "empeoro";
    else if ((pd === 0 && rd <= 1) || pd < pa || rd < ra) desenlace = "mejoro";
    return {
      desenlace, nivelAlerta: "critico",
      interpretacion: `FC ${a.fc}→${d.fc} lpm · SpO₂ ${a.spo2}→${d.spo2} % · PA ${a.sistolica}/${a.diastolica}→${d.sistolica}/${d.diastolica} · puntos NEWS2 de estos signos ${pa}→${pd}`,
    };
  }
  if (tipo === "ortostatica") {
    const e = evaluarOrtostatica(resultado);
    const peorC = [...e.caidas].sort((x, y) => y.sis - x.sis)[0];
    return {
      desenlace: e.positiva ? "empeoro" : "mejoro",
      nivelAlerta: "atencion",
      positiva: e.positiva,
      interpretacion: e.positiva
        ? `Positiva: la presión cayó ${Math.max(...e.caidas.map((c) => c.sis))} mmHg sistólica / ${Math.max(...e.caidas.map((c) => c.dia))} mmHg diastólica a los ${e.momento} de pie (hipotensión ortostática).`
        : `Negativa: la caída máxima fue de ${Math.max(0, peorC.sis)} mmHg sistólica; no hay hipotensión ortostática.`,
    };
  }
  if (tipo === "reaccion") {
    const P = UMBRALES.pvt;
    const base = analisis?.baselines?.reaccion?.media || num(resultado.mediana_ms) || num(resultado.promedio_ms);
    const valor = num(resultado.mediana_ms) ?? num(resultado.promedio_ms);
    const lapsos = num(resultado.lapsos) ?? 0;
    let desenlace = "igual";
    if (valor > base * (1 + P.empeoraPct) || lapsos > P.lapsosAtencion) desenlace = "empeoro";
    else if (valor <= base * (1 + P.mejoraPct) && lapsos <= 2) desenlace = "mejoro";
    const det = resultado.lapsos != null ? ` · ${resultado.lapsos} lapsos (≥ 355 ms) · ${resultado.falsas} falsas alarmas` : "";
    return { desenlace, nivelAlerta: "critico", interpretacion: `Mediana ${valor} ms vs. tu línea base ${Math.round(base)} ms${det}` };
  }
  if (tipo === "checkin") {
    const f = [resultado.confusion && "confusión", resultado.vision_cefalea && "visión borrosa o cefalea", resultado.mareo_de_pie && "mareo de pie"].filter(Boolean);
    return { desenlace: null, interpretacion: `Ánimo ${resultado.animo}/5 · estrés ${resultado.estres}/5 · fatiga ${resultado.fatiga}/5${f.length ? ` · reporta ${f.join(", ")}` : " · sin síntomas de alarma"}` };
  }
  if (tipo === "who5") {
    const p = num(resultado.puntaje);
    const txt = p <= UMBRALES.who5.atencion ? "bienestar bajo: Medic avisó al médico de tripulación" : p <= UMBRALES.who5.sugierePhq9 ? "te sugiero contestar el PHQ-9" : "bienestar adecuado";
    return { desenlace: null, interpretacion: `WHO-5: ${p}/100 · ${txt} · tamizaje, no diagnóstico` };
  }
  if (tipo === "phq9") {
    const p = num(resultado.puntaje);
    const i9 = num(resultado.item9) > 0;
    return { desenlace: null, interpretacion: `PHQ-9: ${p}/27${p >= UMBRALES.phq9.atencion ? " · Medic avisó al médico de tripulación" : ""}${i9 ? " · aviso inmediato por la pregunta 9" : ""} · tamizaje, no diagnóstico` };
  }
  if (tipo === "gad7") {
    const p = num(resultado.puntaje);
    return { desenlace: null, interpretacion: `GAD-7: ${p}/21${p >= UMBRALES.gad7.atencion ? " · Medic avisó al médico de tripulación" : ""} · tamizaje, no diagnóstico` };
  }
  if (tipo === "amsler") {
    const ojos = [resultado.od && "ojo derecho", resultado.oi && "ojo izquierdo"].filter(Boolean);
    return { desenlace: null, interpretacion: ojos.length ? `Distorsión en ${ojos.join(" y ")} · complemento, se combina con tus preguntas de visión` : "Sin distorsión en ninguno de los dos ojos" };
  }
  return { desenlace: null, interpretacion: "" };
}
