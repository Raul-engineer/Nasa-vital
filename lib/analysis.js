export const UMBRALES = {
  provisional: true,
  vfcCaidaPct: 0.2,
  fcSubeLpm: 10,
  suenoMetaHoras: 7,
  suenoCriticoHoras: 6,
  pvtPeorPct: 0.15,
  ejercicioMinMin: 90,
  animoBajo: 2,
  estresAlto: 4,
  rachaVfc: 3,
  rachaSueno: 3,
  rachaEjercicio: 5,
  rachaAnimo: 3,
  diasMinLineaBase: 14,
  spo2Emergencia: 90,
  tarjetas: {
    fc: { atencionMax: 91, rojoMax: 100, atencionMin: 50, rojoMin: 40, vfcCaida: 0.2 },
    pa: { atencionSis: 130, atencionDia: 85, rojoSis: 140, rojoDia: 90, bajaAtencion: 100, bajaRojo: 90 },
    fr: { atencion: [[9, 11], [21, 24]], rojoMin: 8, rojoMax: 25 },
    temp: { fiebre: 38.1, rojoAlta: 39.1, atencionBaja: 36.0, rojoBaja: 35.0, sintomasRojo: 2 },
    spo2: { atencion: 95, rojo: 90 },
    sueno: { reaccionLentaPct: 0.15, fatigaAlta: 4 },
    animo: { who5Atencion: 50, who5Rojo: 28, animoBajo: 2, estresAlto: 4, tripulacionBaja: 2 },
    huesos: { atencionPct: 80, rachaRojo: 5, prescritoPorDefecto: 120 },
  },
  cabina: { umbralesDeDemo: true, co2AtencionPpm: 3500, co2RojoPpm: 5000, co2Normal: [2200, 3000], tempNormal: [21, 24], humedadNormal: [35, 55] },
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
  actividad: { subidaS: 12, normalizaMin: 10, recuperacionMin: 30, fiebreC: 38.4, fiebreFcPorC: 10, fiebreSintoma: "garganta" },
  rangoPersonal: { pBajo: 0.1, pAlto: 0.9 },
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
  cabina: { nombre: "Cabina", icono: "cabina" },
};

export const PRUEBAS = {
  checkin: { nombre: "Check-in diario · 30 segundos", icono: "clipboard", duracion: "30 s", fuente: FUENTES.checkin },
  remedicion: { nombre: "Remedición en reposo", icono: "heart", duracion: "5 min", fuente: FUENTES.news2 },
  ortostatica: { nombre: "Prueba ortostática", icono: "standing", duracion: "4 min", fuente: FUENTES.ortostatica },
  reaccion: { nombre: "Prueba de reacción (PVT-B)", icono: "target", duracion: "3 min", fuente: FUENTES.reaccion },
  who5: { nombre: "Bienestar WHO-5", icono: "smile", duracion: "1 min", fuente: FUENTES.who5 },
  phq9: { nombre: "Tamizaje PHQ-9", icono: "brain", duracion: "3 min", fuente: FUENTES.phq9 },
  gad7: { nombre: "Tamizaje GAD-7", icono: "bolt", duracion: "2 min", fuente: FUENTES.gad7 },
  amsler: { nombre: "Rejilla de Amsler", icono: "eye", duracion: "2 min", fuente: FUENTES.amsler },
  presion: { nombre: "Presión arterial (brazalete)", icono: "bp", duracion: "1 min", fuente: FUENTES.presion },
};

const ORDEN = { critico: 0, atencion: 1, info: 2, normal: 3 };
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

export function percentil(valores, p) {
  const v = valores.map(num).filter((x) => x != null).sort((a, b) => a - b);
  if (!v.length) return null;
  const i = (v.length - 1) * p;
  const a = Math.floor(i);
  const b = Math.ceil(i);
  return v[a] + (v[b] - v[a]) * (i - a);
}

export function rangoPersonal(serie, minimo = 5) {
  const v = (serie || []).slice(-37, -7).map(num).filter((x) => x != null);
  if (v.length < minimo) return null;
  const P = UMBRALES.rangoPersonal;
  return [percentil(v, P.pBajo), percentil(v, P.pAlto)];
}

export function estadoActividad(actividad, ahora = Date.now()) {
  if (!actividad) return { estado: "reposo", minutos: null, fiebre: false };
  const t0 = actividad.desde ? new Date(actividad.desde).getTime() : ahora;
  const minutos = Math.max(0, (ahora - t0) / 6e4);
  let estado = actividad.estado || "reposo";
  if (estado === "recuperacion" && minutos >= UMBRALES.actividad.recuperacionMin) estado = "reposo";
  return { estado, minutos, desde: actividad.desde, fiebre: !!actividad.fiebre };
}

export function efectoActividad(act) {
  const A = UMBRALES.actividad;
  if (!act || act.minutos == null) return null;
  const s = act.minutos * 60;
  if (act.estado === "ejercicio") {
    const k = Math.min(1, s / A.subidaS);
    return { fc: k * (40 + Math.sin(s / 37) * 10), fr: k * (8 + Math.sin(s / 53) * 2), temperatura: Math.min(1, s / 300) * (0.45 + Math.sin(s / 97) * 0.15), sistolica: k * 20, diastolica: k * 5 };
  }
  if (act.estado === "recuperacion") {
    const k = Math.max(0, 1 - s / (A.normalizaMin * 60));
    return k > 0 ? { fc: 40 * k, fr: 8 * k, temperatura: 0.45 * k, sistolica: 20 * k, diastolica: 5 * k } : null;
  }
  return null;
}

function aplicarActividad(lectura, act) {
  const A = UMBRALES.actividad;
  const e = efectoActividad(act);
  const l = { ...lectura };
  if (act?.fiebre) {
    const sube = Math.max(0, A.fiebreC - (num(l.temperatura) ?? 36.8));
    l.temperatura = A.fiebreC;
    l.fc = num(l.fc) != null ? Math.round(l.fc + sube * A.fiebreFcPorC) : l.fc;
  }
  if (e) {
    if (num(l.fc) != null) l.fc = Math.round(l.fc + e.fc);
    if (num(l.frec_resp) != null) l.frec_resp = Math.round(l.frec_resp + e.fr);
    if (num(l.temperatura) != null) l.temperatura = Math.round((l.temperatura + e.temperatura) * 10) / 10;
  }
  return l;
}

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

export const VARIABLES = {
  fc: { nombre: "Frecuencia cardiaca", icono: "heart", sistema: "cardiovascular", lado: "izq", prueba: "remedicion" },
  pa: { nombre: "Presión arterial", icono: "bp", sistema: "cardiovascular", lado: "izq", prueba: "ortostatica" },
  fr: { nombre: "Frecuencia respiratoria", icono: "lungs", sistema: "respiratorio", lado: "izq", prueba: "remedicion" },
  temp: { nombre: "Temperatura", icono: "thermo", sistema: "respiratorio", lado: "izq", prueba: "checkin" },
  spo2: { nombre: "SpO₂", icono: "o2", sistema: "respiratorio", lado: "izq", prueba: "remedicion" },
  conciencia: { nombre: "Conciencia", icono: "brain", sistema: "salud_mental", lado: "izq", prueba: "checkin" },
  radiacion: { nombre: "Radiación", icono: "rad", sistema: "radiacion", lado: "der", prueba: null },
  sueno: { nombre: "Sueño y alerta", icono: "moon", sistema: "sueno", lado: "der", prueba: "reaccion" },
  animo: { nombre: "Ánimo", icono: "smile", sistema: "salud_mental", lado: "der", prueba: "who5" },
  vision: { nombre: "Visión (SANS)", icono: "eye", sistema: "vision", lado: "der", prueba: "amsler" },
  huesos: { nombre: "Huesos y músculos", icono: "bone", sistema: "hueso_musculo", lado: "der", prueba: null },
  cabina: { nombre: "Cabina", icono: "cabina", sistema: "cabina", lado: "der", prueba: null },
};

const VAR_DE_CLAVE = {
  vfc: "fc", fc_base: "fc", fc_rango: "fc", presion_alta: "pa", presion_urgencia: "pa", presion_limitrofe: "pa", fr_rango: "fr",
  temperatura: "temp", spo2_emergencia: "spo2", spo2_baja: "spo2", confusion: "conciencia", sueno: "sueno", vfc_sueno: "sueno",
  hueso: "huesos", salud_mental: "animo", who5: "animo", phq9: "animo", phq9_item9: "animo", gad7: "animo", tripulacion: "animo",
  sans: "vision", amsler: "vision", cabina_co2: "cabina", radiacion_tormenta: "radiacion", radiacion_carrera: "radiacion",
  radiacion_30d: "radiacion", radiacion_tasa: "radiacion", ortostatica: "pa",
};
const VAR_DE_SIGNO_NEWS2 = { fr: "fr", spo2: "spo2", sistolica: "pa", pulso: "fc", temperatura: "temp", conciencia: "conciencia" };

function fechaCorta(f) {
  return f ? new Date(f + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" }) : "";
}

function construirTarjetas({ vitals, checkins, ci, hoy, pruebas, profile, radiacion, cabina, bVfc, bReac, reaccionHoy, fechaHoy }) {
  const T = UMBRALES.tarjetas;
  const C = UMBRALES.cabina;
  const porFecha = new Map(checkins.map((c) => [c.fecha, c]));
  const serieC = (fn) => vitals.map((v) => (porFecha.has(v.fecha) ? fn(porFecha.get(v.fecha)) : null));
  const serieV = (campo) => vitals.map((v, i) => (i === vitals.length - 1 && hoy[campo] != null ? num(hoy[campo]) : num(v[campo])));
  const out = {};
  const mk = (k, o) => {
    const serie = o.serie || [];
    const s7 = o.serie7 || serie.slice(-7);
    out[k] = { k, ...VARIABLES[k], ...o, etiqueta: o.estado === "normal" ? "Normal" : o.etiqueta, serie, serie7: s7, ...cambios(o.serieCambio || serie) };
  };

  const fc = num(hoy.fc);
  const vfcHoy = num(vitals.at(-1)?.vfc);
  const vfcPct = bVfc.media && vfcHoy != null ? (vfcHoy - bVfc.media) / bVfc.media : null;
  let e = "normal", et = "", mot = "";
  if (fc != null && (fc > T.fc.rojoMax || fc <= T.fc.rojoMin)) [e, et, mot] = ["critico", fc > T.fc.rojoMax ? "Muy alta" : "Muy baja", `FC de ${fc} lpm en reposo`];
  else if (fc != null && ((fc >= T.fc.atencionMax && fc <= T.fc.rojoMax) || fc <= T.fc.atencionMin)) [e, et, mot] = ["atencion", fc <= T.fc.atencionMin ? "Baja" : "Alta", `FC de ${fc} lpm fuera de 51–90`];
  else if (vfcPct != null && vfcPct <= -T.fc.vfcCaida) [e, et, mot] = ["atencion", "VFC baja", `VFC ${Math.round(-vfcPct * 100)} % abajo de tu línea base`];
  mk("fc", { valor: fc, texto: `${fc ?? "—"}`, unidad: "lpm", rango: "51–90", secundario: `VFC ${vfcHoy ?? "—"} ms · normal ${Math.round(bVfc.media) || "—"}`, estado: e, etiqueta: et, motivo: mot, serie: serieV("fc"), fuente: "news2", unidadSerie: "lpm", dir: fc != null && fc > T.fc.atencionMin && et !== "VFC baja" ? "up" : "down", vfc: vfcHoy, vfcBase: bVfc.media });

  const s = num(hoy.sistolica);
  const d = num(hoy.diastolica);
  const orto = [...pruebas].filter((p) => p.tipo === "ortostatica" && p.fecha <= fechaHoy).sort((a, b) => String(b.creada_en || b.fecha).localeCompare(String(a.creada_en || a.fecha)))[0];
  const ortoPos = orto ? evaluarOrtostatica(orto.resultado || {}).positiva : null;
  e = "normal"; et = ""; mot = "";
  if (s != null && (s >= T.pa.rojoSis || d >= T.pa.rojoDia || s <= T.pa.bajaRojo)) [e, et, mot] = ["critico", s <= T.pa.bajaRojo ? "Muy baja" : "Alta", `Presión de ${s}/${d} mmHg`];
  else if (s != null && (s >= T.pa.atencionSis || d >= T.pa.atencionDia || s <= T.pa.bajaAtencion)) [e, et, mot] = ["atencion", s <= T.pa.bajaAtencion ? "Baja" : "Elevada", `Presión de ${s}/${d} mmHg fuera de tu rango`];
  mk("pa", {
    valor: s, valor2: d, texto: `${s ?? "—"}/${d ?? "—"}`, unidad: "mmHg", rango: "< 130/85",
    secundario: orto ? `Ortostática: ${ortoPos ? "positiva" : "negativa"} (${fechaCorta(orto.fecha)})` : "Ortostática: sin registro",
    estado: e, etiqueta: et, motivo: mot, serie: serieV("sistolica"), serie2: serieV("diastolica"), fuente: "pronam,news2", dir: s != null && s <= T.pa.bajaAtencion ? "down" : "up",
  });

  const fr = num(hoy.frec_resp);
  e = "normal"; et = ""; mot = "";
  if (fr != null && (fr <= T.fr.rojoMin || fr >= T.fr.rojoMax)) [e, et, mot] = ["critico", fr <= T.fr.rojoMin ? "Muy baja" : "Muy alta", `${fr} respiraciones por minuto`];
  else if (fr != null && T.fr.atencion.some(([a, b]) => fr >= a && fr <= b)) [e, et, mot] = ["atencion", fr < 12 ? "Baja" : "Alta", `${fr} respiraciones por minuto, fuera de 12–20`];
  mk("fr", { valor: fr, texto: `${fr ?? "—"}`, unidad: "resp/min", rango: "12–20", secundario: "En reposo", estado: e, etiqueta: et, motivo: mot, serie: serieV("frec_resp"), fuente: "news2", dir: fr != null && fr < 12 ? "down" : "up" });

  const t = num(hoy.temperatura);
  const sint = Array.isArray(ci.sintomas) ? ci.sintomas : [];
  const fiebre = t != null && t >= T.temp.fiebre;
  e = "normal"; et = ""; mot = "";
  if (t != null && (t >= T.temp.rojoAlta || t <= T.temp.rojoBaja || (fiebre && sint.length >= T.temp.sintomasRojo))) [e, et, mot] = ["critico", fiebre ? "Fiebre" : "Muy baja", fiebre && sint.length >= 2 ? `Fiebre de ${t} °C con ${sint.length} síntomas` : `Temperatura de ${t} °C`];
  else if (t != null && (fiebre || t <= T.temp.atencionBaja || sint.length)) [e, et, mot] = ["atencion", fiebre ? "Fiebre" : t <= T.temp.atencionBaja ? "Baja" : "Síntomas", sint.length && !fiebre && t > T.temp.atencionBaja ? `Síntomas de infección: ${sint.map((x) => NOMBRE_SINTOMA[x] || x).join(", ")}` : `Temperatura de ${t} °C`];
  mk("temp", { valor: t, texto: `${t ?? "—"}`, unidad: "°C", rango: "36.1–38.0", secundario: sint.length ? `Síntomas: ${sint.length} (${sint.map((x) => NOMBRE_SINTOMA[x] || x).join(", ")})` : "Síntomas: ninguno", estado: e, etiqueta: et, motivo: mot, serie: serieV("temperatura"), fuente: "news2,nasa_inmune", sintomas: sint, dir: fiebre ? "up" : t != null && t <= T.temp.atencionBaja ? "down" : null });

  const sp = num(hoy.spo2);
  e = "normal"; et = ""; mot = "";
  if (sp != null && sp < T.spo2.rojo) [e, et, mot] = ["critico", "Emergencia", `SpO₂ de ${sp} %`];
  else if (sp != null && sp < T.spo2.atencion) [e, et, mot] = ["atencion", "Baja", `SpO₂ de ${sp} %, entre 90 y 94`];
  mk("spo2", { valor: sp, texto: `${sp ?? "—"}`, unidad: "%", rango: "≥ 95", secundario: "Oximetría en reposo", estado: e, etiqueta: et, motivo: mot, serie: serieV("spo2"), fuente: "oms_oximetria,news2", dir: "down" });

  const confuso = !!ci.confusion;
  const mareo = !!ci.mareo_de_pie;
  mk("conciencia", {
    valor: confuso ? 2 : mareo ? 1 : 0, texto: confuso ? "Confuso" : "Alerta", unidad: "", rango: "Alerta", secundario: `Mareo: ${mareo ? "sí" : "no"}`,
    estado: confuso ? "critico" : mareo ? "atencion" : "normal", etiqueta: confuso ? "Confusión" : "Mareo",
    motivo: confuso ? "Reportaste confusión o desorientación nueva" : mareo ? "Reportaste mareo" : "",
    serie: serieC((c) => (c.confusion ? 2 : c.mareo_de_pie ? 1 : 0)), fuente: "news2,nasa_sensoriomotor", categorica: true,
  });

  const r = radiacion;
  const pmax = Math.max(r.pct, r.pct30);
  e = "normal"; et = ""; mot = "";
  if ((r.activo && !r.refugio) || pmax >= UMBRALES.radiacion.criticoPct) [e, et, mot] = ["critico", r.activo ? `Tormenta ${r.activo.nivel}` : "Límite", r.activo ? `Tormenta solar ${r.activo.nivel} sin refugio` : `Dosis al ${Math.round(pmax * 100)} % de un límite`];
  else if ((r.activo && r.refugio) || pmax >= UMBRALES.radiacion.atencionPct) [e, et, mot] = ["atencion", r.activo ? "En refugio" : "Acumulado", r.activo ? `Tormenta solar ${r.activo.nivel}, ya en refugio` : `Dosis al ${Math.round(pmax * 100)} % de un límite`];
  mk("radiacion", { dir: "up",
    valor: Math.round(r.tasa), texto: `${Math.round(r.tasa)}`, unidad: "µSv/h", rango: `base ${Math.round(r.tasaBase)}`,
    secundario: `Carrera ${Math.round(r.carrera)} / 600 mSv`, estado: e, etiqueta: et, motivo: mot,
    serie: vitals.map((v) => Math.round(tasaAuSvh(v.dosis_dia_msv))), fuente: "nasa3001,ochmo",
  });

  const horas = num(vitals.at(-1)?.horas_sueno);
  const corto = racha(vitals, (x) => num(x.horas_sueno) < UMBRALES.suenoMetaHoras);
  const muyCorto = racha(vitals, (x) => num(x.horas_sueno) <= UMBRALES.suenoCriticoHoras);
  const reacPct = bReac.media && reaccionHoy != null ? (reaccionHoy - bReac.media) / bReac.media : null;
  const lenta = reacPct != null && reacPct > T.sueno.reaccionLentaPct;
  const fat = num(ci.fatiga);
  e = "normal"; et = ""; mot = "";
  if (muyCorto >= UMBRALES.rachaSueno && lenta) [e, et, mot] = ["critico", "Sueño y reacción", `${muyCorto} noches de 6 h o menos y reacción ${Math.round(reacPct * 100)} % más lenta`];
  else if (corto >= UMBRALES.rachaSueno || lenta || fat >= T.sueno.fatigaAlta) [e, et, mot] = ["atencion", corto >= 3 ? "Sueño corto" : lenta ? "Reacción lenta" : "Fatiga", corto >= 3 ? `${corto} noches con menos de 7 h` : lenta ? `Reacción ${Math.round(reacPct * 100)} % más lenta que tu normal` : `Fatiga de ${fat}/5`];
  mk("sueno", { valor: horas, texto: `${horas ?? "—"}`, unidad: "h", rango: "≥ 7 h", secundario: `Reacción ${reaccionHoy ?? "—"} ms · normal ${Math.round(bReac.media) || "—"}`, estado: e, etiqueta: et, motivo: mot, serie: vitals.map((v) => num(v.horas_sueno)), fuente: "aasm,pvtb", dir: "down", noches: corto, reaccion: reaccionHoy, reaccionBase: bReac.media, reaccionPct: reacPct, fatiga: fat });

  const who5s = [...pruebas].filter((p) => p.tipo === "who5" && p.fecha <= fechaHoy).sort((a, b) => String(a.creada_en || a.fecha).localeCompare(String(b.creada_en || b.fecha)));
  const w = who5s.at(-1);
  const wp = w ? num(w.resultado?.puntaje) : null;
  const est = num(ci.estres), trip = num(ci.tripulacion), an = num(ci.animo);
  const A = T.animo;
  e = "normal"; et = ""; mot = "";
  if (wp != null && wp <= A.who5Rojo) [e, et, mot] = ["critico", "Bienestar bajo", `WHO-5 de ${wp}/100`];
  else if ((wp != null && wp <= A.who5Atencion) || an <= A.animoBajo || est >= A.estresAlto || (trip != null && trip <= A.tripulacionBaja)) {
    const m = [wp != null && wp <= A.who5Atencion && `WHO-5 de ${wp}/100`, an <= A.animoBajo && `ánimo ${an}/5`, est >= A.estresAlto && `estrés ${est}/5`, trip != null && trip <= A.tripulacionBaja && `tripulación ${trip}/5`].filter(Boolean);
    [e, et, mot] = ["atencion", wp != null && wp <= A.who5Atencion ? "WHO-5 bajo" : est >= A.estresAlto ? "Estrés alto" : trip <= A.tripulacionBaja ? "Tripulación" : "Ánimo bajo", m.join(" · ")];
  }
  const serieWho5 = vitals.map((v) => { const x = who5s.find((p) => p.fecha === v.fecha); return x ? num(x.resultado?.puntaje) : null; });
  mk("animo", {
    valor: wp, texto: wp != null ? `${wp}` : "—", unidad: "/100", rango: "> 50", secundario: `Estrés ${est ?? "—"}/5 · tripulación ${trip ?? "—"}/5`,
    estado: e, etiqueta: et, motivo: mot, serie: serieWho5, serie7: serieC((c) => num(c.animo)).slice(-7), serieCambio: serieC((c) => num(c.animo)),
    fuente: "who5,nasa_salud_mental", who5Fecha: w?.fecha, dir: "down", estres: est, tripulacion: trip, animoHoy: an,
  });

  const vb = !!(ci.vision_borrosa || ci.vision_cefalea);
  const dc = !!(ci.dolor_cabeza || ci.vision_cefalea);
  const am = [...pruebas].filter((p) => p.tipo === "amsler" && p.fecha <= fechaHoy).sort((a, b) => String(b.creada_en || b.fecha).localeCompare(String(a.creada_en || a.fecha)))[0];
  const amDist = !!(am && (am.resultado?.od || am.resultado?.oi));
  const amReciente = am && diasEntre(fechaHoy, am.fecha) < UMBRALES.ventanaTamizajeDias;
  const visAt = vb || dc || (amDist && amReciente);
  mk("vision", {
    valor: visAt ? 1 : 0, texto: visAt ? "Revisar" : "OK", unidad: "", rango: "OK",
    secundario: am ? `Amsler: ${amDist ? "con distorsión" : "sin distorsión"} (${fechaCorta(am.fecha)})` : "Amsler: sin registro",
    estado: visAt ? "atencion" : "normal", etiqueta: vb && dc ? "Borrosa y dolor" : vb ? "Visión borrosa" : dc ? "Dolor de cabeza" : "Amsler",
    motivo: [vb && "visión borrosa", dc && "dolor de cabeza", amDist && amReciente && "distorsión en la rejilla de Amsler"].filter(Boolean).join(" · "),
    serie: serieC((c) => (c.vision_borrosa || c.dolor_cabeza || c.vision_cefalea ? 1 : 0)), fuente: "nasa_sans,amsler", categorica: true,
  });

  const presc = num(profile?.ejercicio_prescrito_min) || T.huesos.prescritoPorDefecto;
  const totalDe = (v) => (num(v.ejercicio_fuerza_min) != null || num(v.ejercicio_cardio_min) != null ? (num(v.ejercicio_fuerza_min) || 0) + (num(v.ejercicio_cardio_min) || 0) : num(v.minutos_ejercicio) || 0);
  const vh = vitals.at(-1) || {};
  const fza = num(vh.ejercicio_fuerza_min) ?? Math.round((num(vh.minutos_ejercicio) || 0) * 0.55);
  const car = num(vh.ejercicio_cardio_min) ?? (num(vh.minutos_ejercicio) || 0) - fza;
  const pctEj = Math.round((totalDe(vh) / presc) * 100);
  const bajo = racha(vitals, (v) => totalDe(v) < presc);
  e = "normal"; et = ""; mot = "";
  if (bajo >= T.huesos.rachaRojo) [e, et, mot] = ["critico", `${bajo} días bajo`, `${bajo} días seguidos debajo de tu ejercicio prescrito (${presc} min)`];
  else if (pctEj < T.huesos.atencionPct) [e, et, mot] = ["atencion", "Bajo", `Hoy llevas ${pctEj} % de tu ejercicio prescrito`];
  mk("huesos", { valor: pctEj, texto: `${pctEj}`, unidad: "%", rango: "≥ 80 %", secundario: `Fuerza ${fza} min · cardio ${car} min`, estado: e, etiqueta: et, motivo: mot, serie: vitals.map((v) => Math.round((totalDe(v) / presc) * 100)), fuente: "nasa_osea", prescrito: presc, racha: bajo, fuerza: fza, cardio: car, dir: "down" });

  const cabPorFecha = new Map((cabina || []).map((c) => [c.fecha, c]));
  const ch = cabPorFecha.get(fechaHoy) || (cabina || []).at(-1) || {};
  const co2 = num(ch.co2_ppm);
  e = "normal"; et = ""; mot = "";
  if (co2 != null && co2 >= C.co2RojoPpm) [e, et, mot] = ["critico", "CO₂ muy alto", `CO₂ de ${co2.toLocaleString("es-MX")} ppm en tu módulo`];
  else if (co2 != null && co2 >= C.co2AtencionPpm) [e, et, mot] = ["atencion", "CO₂ alto", `CO₂ de ${co2.toLocaleString("es-MX")} ppm en tu módulo`];
  mk("cabina", {
    valor: co2, texto: co2 != null ? co2.toLocaleString("es-MX") : "—", unidad: "ppm", rango: "2,200–3,000",
    secundario: ch.temp_c != null ? `${ch.temp_c} °C · ${ch.humedad} % humedad` : "Sin datos de cabina", estado: e, etiqueta: et, motivo: mot,
    serie: vitals.map((v) => num(cabPorFecha.get(v.fecha)?.co2_ppm)), fuente: "nasa_ambiente", cabinaHoy: ch, dir: "up",
  });

  for (const k of Object.keys(out)) {
    const t = out[k];
    if (t.categorica) continue;
    const med = k === "radiacion" ? mediana(t.serie.slice(-37, -7)) : null;
    t.rangoPersonal = rangoPersonal(k === "radiacion" ? t.serie.map((x) => (x != null && x > med * 3 ? null : x)) : t.serie, k === "animo" ? 3 : 5);
    if (t.serie2) t.rangoPersonal2 = rangoPersonal(t.serie2);
  }
  return Object.keys(VARIABLES).map((k) => out[k]);
}

export const NOMBRE_SINTOMA = { garganta: "garganta", llagas: "llagas o herpes", ronchas: "ronchas", heridas: "heridas lentas", estomago: "estómago" };

function lecturaActual(hoy, pruebasDia) {
  const orden = pruebasDia
    .filter((p) => (p.tipo === "remedicion" && p.resultado?.despues) || (p.tipo === "presion" && p.resultado?.sistolica != null))
    .sort((a, b) => String(a.creada_en || "").localeCompare(String(b.creada_en || "")));
  let l = { ...hoy };
  for (const p of orden) {
    if (p.tipo === "presion") {
      l = { ...l, sistolica: num(p.resultado.sistolica) ?? l.sistolica, diastolica: num(p.resultado.diastolica) ?? l.diastolica, horaPa: p.creada_en };
      continue;
    }
    const d = p.resultado.despues;
    l = { ...l, fc: num(d.fc) ?? l.fc, spo2: num(d.spo2) ?? l.spo2, sistolica: num(d.sistolica) ?? l.sistolica, diastolica: num(d.diastolica) ?? l.diastolica, remedida: true, horaPa: d.sistolica != null ? p.creada_en : l.horaPa };
  }
  return l;
}

function ultimaPrueba(pruebas, tipo, fechaHoy, dias) {
  return [...pruebas].filter((p) => p.tipo === tipo && p.fecha <= fechaHoy && diasEntre(fechaHoy, p.fecha) < dias)
    .sort((a, b) => String(b.creada_en || b.fecha).localeCompare(String(a.creada_en || a.fecha)))[0] || null;
}

export function analizar({ astronaut, vitals, checkins, alerts = [], pruebas = [], profile = {}, eventos = [], cabina = [], actividad = null, historico = false, ahora = Date.now() }) {
  const U = UMBRALES;
  const hoyBase = vitals[vitals.length - 1] || {};
  const fechaHoy = hoyBase.fecha;
  const pruebasDia = pruebas.filter((p) => p.fecha === fechaHoy);
  const act = historico ? estadoActividad(null) : estadoActividad(actividad, ahora);
  const hoyReposo = lecturaActual(hoyBase, pruebasDia);
  const hoy = aplicarActividad(hoyReposo, act);
  const ciBase = checkins.find((c) => c.fecha === fechaHoy) || checkins[checkins.length - 1] || {};
  const ci = act.fiebre ? { ...ciBase, sintomas: [...new Set([...(Array.isArray(ciBase.sintomas) ? ciBase.sintomas : []), U.actividad.fiebreSintoma])] } : ciBase;
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
  else if (pa.clave === "hipertension") add({ clave: "presion_alta", sistema: "cardiovascular", estado: "critico", capa: "aguda", motivo: `Presión ${signos.pa.texto} mmHg: hipertensión`, fuente: FUENTES.presion });

  if (rachaVfc >= U.rachaVfc) add({ clave: "vfc", sistema: "cardiovascular", estado: "atencion", capa: "tendencia", rachaDias: rachaVfc, motivo: `VFC por debajo de tu línea base ${rachaVfc} días seguidos`, fuente: FUENTES.lineaBase });
  if (suficiente && rachaVfc < U.rachaVfc && num(hoy.fc) > bFc.media + U.fcSubeLpm) add({ clave: "fc_base", sistema: "cardiovascular", estado: "atencion", capa: "tendencia", motivo: `FC en reposo ${Math.round(hoy.fc - bFc.media)} lpm sobre tu línea base`, fuente: FUENTES.lineaBase });
  const fatigaAlta = num(ci.fatiga) >= U.tarjetas.sueno.fatigaAlta;
  const presc = num(profile?.ejercicio_prescrito_min) || U.tarjetas.huesos.prescritoPorDefecto;
  const totalEj = (v) => (num(v.ejercicio_fuerza_min) != null ? (num(v.ejercicio_fuerza_min) || 0) + (num(v.ejercicio_cardio_min) || 0) : num(v.minutos_ejercicio) || 0);
  const rachaBajoEj = racha(vitals, (v) => totalEj(v) < presc);
  const pctEjHoy = vitals.length ? (totalEj(vitals.at(-1)) / presc) * 100 : 100;
  if (rachaBajoEj >= U.tarjetas.huesos.rachaRojo) add({ clave: "hueso", sistema: "hueso_musculo", estado: "critico", capa: "tendencia", rachaDias: rachaBajoEj, motivo: `${rachaBajoEj} días seguidos debajo de tu ejercicio prescrito (${presc} min)`, fuente: "nasa_osea" });
  else if (pctEjHoy < U.tarjetas.huesos.atencionPct) add({ clave: "hueso", sistema: "hueso_musculo", estado: "atencion", capa: "tendencia", rachaDias: rachaBajoEj, motivo: `Hoy llevas ${Math.round(pctEjHoy)} % de tu ejercicio prescrito`, fuente: "nasa_osea" });
  const cabHoy = (cabina || []).find((c) => c.fecha === fechaHoy);
  if (cabHoy && num(cabHoy.co2_ppm) >= U.cabina.co2AtencionPpm) add({ clave: "cabina_co2", sistema: "cabina", estado: cabHoy.co2_ppm >= U.cabina.co2RojoPpm ? "critico" : "atencion", capa: "aguda", motivo: `CO₂ de ${Number(cabHoy.co2_ppm).toLocaleString("es-MX")} ppm en tu módulo`, fuente: "nasa_ambiente" });
  const sintHoy = Array.isArray(ci.sintomas) ? ci.sintomas : [];
  const tHoy = num(hoy.temperatura);
  if (tHoy != null && (tHoy >= 38.1 || tHoy <= 36.0 || sintHoy.length)) {
    const rojo = tHoy >= 39.1 || tHoy <= 35.0 || (tHoy >= 38.1 && sintHoy.length >= 2);
    add({ clave: "temperatura", sistema: "respiratorio", estado: rojo ? "critico" : "atencion", capa: "checkin", motivo: sintHoy.length ? `Temperatura ${tHoy} °C con síntomas: ${sintHoy.map((x) => NOMBRE_SINTOMA[x] || x).join(", ")}` : `Temperatura de ${tHoy} °C`, fuente: "news2,nasa_inmune" });
  }
  if (rachaMuyCorto >= U.rachaSueno && pvtPeor) {
    add({ clave: "sueno", sistema: "sueno", estado: "critico", capa: "tendencia", rachaDias: rachaMuyCorto, motivo: `${U.suenoCriticoHoras} h de sueño o menos ${rachaMuyCorto} noches y reacción ${Math.round(reaccionCambio * 100)} % más lenta que tu línea base`, fuente: "aasm,pvtb" });
  } else if (rachaCorto >= U.rachaSueno || pvtPeor || fatigaAlta) {
    add({ clave: "sueno", sistema: "sueno", estado: "atencion", capa: "tendencia", rachaDias: rachaCorto, motivo: rachaCorto >= U.rachaSueno ? `Menos de ${U.suenoMetaHoras} h de sueño ${rachaCorto} noches seguidas` : pvtPeor ? `Reacción ${Math.round(reaccionCambio * 100)} % más lenta que tu normal` : `Fatiga de ${ci.fatiga}/5`, fuente: "aasm,pvtb" });
  }
  if (rachaAnimo >= U.rachaAnimo) add({ clave: "salud_mental", sistema: "salud_mental", estado: "atencion", capa: "tendencia", rachaDias: rachaAnimo, motivo: `Ánimo bajo o estrés alto ${rachaAnimo} días seguidos`, fuente: FUENTES.checkin });

  const R = U.radiacion;
  if (radiacion.activo) add({ clave: "radiacion_tormenta", sistema: "radiacion", estado: radiacion.refugio ? "atencion" : "critico", capa: "radiacion", motivo: radiacion.motivo, fuente: "nasa3001,ochmo,hera", eventoId: radiacion.activo.id });
  if (radiacion.pct >= R.atencionPct) add({ clave: "radiacion_carrera", sistema: "radiacion", estado: radiacion.pct >= R.criticoPct ? "critico" : "atencion", capa: "radiacion", motivo: `Dosis de carrera ${Math.round(radiacion.carrera)} mSv: ${Math.round(radiacion.pct * 100)} % del límite de 600 mSv`, fuente: FUENTES.radiacion });
  if (radiacion.pct30 >= R.atencionPct) add({ clave: "radiacion_30d", sistema: "radiacion", estado: radiacion.pct30 >= R.criticoPct ? "critico" : "atencion", capa: "radiacion", motivo: `Dosis de 30 días ${Math.round(radiacion.ventana30)} mSv: ${Math.round(radiacion.pct30 * 100)} % del límite de 250 mSv`, fuente: FUENTES.radiacion });
  if (!radiacion.activo && radiacion.tasa > R.tasaAtencionX * radiacion.tasaBase) add({ clave: "radiacion_tasa", sistema: "radiacion", estado: "atencion", capa: "radiacion", motivo: `Tasa del dosímetro ${Math.round(radiacion.tasa)} µSv/h, más de 3 veces tu línea base`, fuente: FUENTES.dosimetro });

  const amsler = ultimaPrueba(pruebas, "amsler", fechaHoy, U.ventanaTamizajeDias);
  const amslerDist = !!(amsler && (amsler.resultado?.od || amsler.resultado?.oi));
  if (ci.confusion) add({ clave: "confusion", sistema: "salud_mental", estado: "critico", capa: "checkin", motivo: "Reportaste confusión o desorientación", fuente: FUENTES.news2 });
  const visCi = ci.vision_borrosa || ci.dolor_cabeza || ci.vision_cefalea;
  if (visCi) add({ clave: "sans", sistema: "vision", estado: "atencion", capa: "checkin", motivo: amslerDist ? "Visión borrosa o dolor de cabeza, con distorsión en la rejilla de Amsler" : "Reportaste visión borrosa o dolor de cabeza", fuente: FUENTES.sans });
  else if (amslerDist) add({ clave: "amsler", sistema: "vision", estado: "atencion", capa: "checkin", motivo: "Distorsión en la rejilla de Amsler (complemento; revísalo con el médico)", fuente: FUENTES.amsler });
  if (ci.mareo_de_pie) add({ clave: "ortostatica", var: "conciencia", sistema: "cardiovascular", estado: "atencion", capa: "checkin", motivo: "Reportaste mareo: haz la prueba ortostática", fuente: FUENTES.ortostatica });
  if (num(ci.tripulacion) != null && ci.tripulacion <= U.tarjetas.animo.tripulacionBaja) add({ clave: "tripulacion", sistema: "salud_mental", estado: "atencion", capa: "checkin", motivo: `Relación con la tripulación en ${ci.tripulacion}/5`, fuente: "nasa_salud_mental" });

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

  for (const a of lista) {
    if (a.var || a.vars) continue;
    if (a.clave === "vfc_sueno") a.vars = ["sueno", "fc"];
    else if (a.clave === "news2" || a.clave === "news2_alto") {
      const top = [...news2.desglose].sort((x, y) => (y.puntos || 0) - (x.puntos || 0))[0];
      a.var = VAR_DE_SIGNO_NEWS2[top.k];
    } else a.var = VAR_DE_CLAVE[a.clave] || Object.keys(VARIABLES).find((k) => VARIABLES[k].sistema === a.sistema) || null;
  }

  const cerradasIds = new Set(pruebasDia.filter((p) => p.desenlace === "mejoro" && p.resultado?.alerta && p.resultado?.alertaEstado !== "critico").map((p) => p.resultado.alerta));
  const cerradas = lista.filter((a) => a.capa !== "reportada" && a.estado !== "critico" && cerradasIds.has(a.id));
  const activas = lista.filter((a) => !cerradas.includes(a));
  const tarjetas = construirTarjetas({ vitals, checkins, ci, hoy, pruebas, profile, radiacion, cabina, bVfc, bReac, reaccionHoy, fechaHoy });
  for (const t of tarjetas) {
    if (t.estado === "normal") continue;
    const rel = activas.filter((a) => (a.vars || [a.var]).includes(t.k));
    const peorRel = rel.length ? peor(...rel.map((a) => a.estado)) : null;
    if (!peorRel || ORDEN[t.estado] < ORDEN[peorRel]) {
      activas.push({ id: `tarjeta_${t.k}`, clave: `tarjeta_${t.k}`, var: t.k, sistema: t.sistema, estado: t.estado, capa: "tarjeta", motivo: t.motivo || t.nombre, fuente: t.fuente });
    }
  }
  const porK = Object.fromEntries(tarjetas.map((t) => [t.k, t]));
  const contexto = {
    lectura: hoy, porK, ci, actividad: act, radiacion, cabinaHoy: porK.cabina?.cabinaHoy, horasSueno: num(vitals.at(-1)?.horas_sueno),
    vfc: num(vitals.at(-1)?.vfc), vfcBase: bVfc.media, rangos: Object.fromEntries(tarjetas.map((t) => [t.k, t.rangoPersonal])), vitals, eventos, fechaHoy, ahora,
  };
  const interpretaciones = Object.fromEntries(tarjetas.map((t) => [t.k, interpretar(t.k, contexto)]));
  for (const t of tarjetas) {
    const it = interpretaciones[t.k];
    if (it.nivel === "info" && (t.estado === "atencion" || t.estado === "critico")) {
      t.estadoRegla = t.estado;
      t.estado = "info";
      t.etiqueta = it.etiqueta || "Esfuerzo";
    }
  }
  const varsNews2 = news2.desglose.filter((x) => x.puntos).map((x) => VAR_DE_SIGNO_NEWS2[x.k]).filter(Boolean);
  for (const a of activas) {
    const vars = a.clave === "news2" || a.clave === "news2_alto" ? varsNews2 : (a.vars || [a.var]).filter(Boolean);
    if (a.capa !== "reportada" && vars.length && vars.every((k) => interpretaciones[k]?.nivel === "info")) {
      a.estadoRegla = a.estado;
      a.estado = "info";
    }
  }
  activas.sort((a, b) => ORDEN[a.estado] - ORDEN[b.estado] || (PRIORIDAD[a.clave] ?? 9) - (PRIORIDAD[b.clave] ?? 9));
  const ctxDias = contextoDias({ vitals, checkins, cabina, hoy, ci, bVfc, presc });
  const gravedades = {};
  const diasAlerta = {};
  for (const t of tarjetas) {
    const nivel = nivelAlerta(t, { interpretaciones });
    const dias = nivel === "ok" ? 0 : diasEnAlerta(t.k, ctxDias);
    diasAlerta[t.k] = dias;
    gravedades[t.k] = gravedad(t.k, { tarjeta: t, nivel, news2, lectura: hoy, ci, radiacion, dias, empeoro: nivel === "warn" && empeoroContraAyer(t.k, ctxDias) });
  }
  const salud = saludGeneral({ gravedades });

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
      estado: estadoSis.hueso_musculo, motivo: motivoSis.hueso_musculo || null, rachaDias: rachaBajoEj, valor: hoy.minutos_ejercicio, unidad: "min", etiqueta: "Ejercicio hoy",
      serie: vitals.map((x) => num(x.minutos_ejercicio)), extra: { prom7: avg(last(vitals, 7).map((x) => x.minutos_ejercicio)) },
    },
    vision: { estado: estadoSis.vision, motivo: motivoSis.vision || null, valor: ci.vision_cefalea ? "Sí" : "No", unidad: "", etiqueta: "Visión o cefalea", serie: [], extra: { amsler: amslerDist } },
    cabina: { estado: estadoSis.cabina, motivo: motivoSis.cabina || null, valor: tarjetas.find((t) => t.k === "cabina")?.valor, unidad: "ppm", etiqueta: "CO₂", serie: [], extra: {} },
    salud_mental: {
      estado: estadoSis.salud_mental, motivo: motivoSis.salud_mental || null, rachaDias: rachaAnimo, valor: ci.estres, unidad: "/ 5", etiqueta: "Estrés (auto-reporte)",
      serie: checkins.map((x) => num(x.estres)), extra: { animo: ci.animo, fatiga: ci.fatiga, reaccion: ci.tiempo_reaccion_ms, reacBase: bReac.media },
    },
  };

  const reales = activas.filter((a) => a.estado !== "info");
  const general = reales.length ? reales[0].estado : "normal";
  const capa = (c) => peor(...reales.filter((a) => a.capa === c).map((a) => a.estado));
  const news2Info = activas.some((a) => (a.clave === "news2" || a.clave === "news2_alto") && a.estado === "info");
  const nivelUrg = news2.nivel.clave === "alto" && !news2Info ? { txt: "Alta", estado: "critico" } : news2.nivel.clave === "bajo" || news2Info ? { txt: "Baja", estado: "normal" } : { txt: "Media", estado: "atencion" };
  const urgencia = {
    nivel: nivelUrg,
    estado: general,
    capas: { aguda: peor(news2Info ? null : news2.nivel.estado, capa("aguda")), tendencia: capa("tendencia"), radiacion: radiacion.estado, checkin: capa("checkin") },
  };

  const preparacion = indicePreparacion({ hoy: hoyReposo, ci, vitals, bVfc, bFc, bReac });
  const hayCritico = reales.some((a) => a.estado === "critico");
  if (hayCritico) preparacion.etiqueta = "Precaución";
  else if (reales.length && preparacion.etiqueta === "Óptimo") preparacion.etiqueta = "Estable";

  return {
    fecha: fechaHoy, suficiente, sistemas, activas, cerradas, general, urgencia, hoy, checkinHoy: ci, preparacion, hayCritico,
    news2, signos, radiacion, pruebasDia, sugerencias, tarjetas, interpretaciones, gravedades, diasAlerta, salud, actividad: act, efecto: efectoActividad(act), hoyReposo,
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
    cabina: (data.cabina || []).filter((c) => c.fecha <= fecha),
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

const NIVEL_DE_ESTADO = { critico: "bad", atencion: "warn", info: "info", normal: "ok" };

function tormentaEnLaNoche(eventos, fechaHoy) {
  if (!fechaHoy) return false;
  const fin = new Date(fechaHoy + "T08:00:00").getTime();
  const ini = fin - 12 * 36e5;
  return (eventos || []).some((e) => {
    const a = new Date(e.inicio).getTime();
    const b = e.fin ? new Date(e.fin).getTime() : Infinity;
    return a <= fin && b >= ini;
  });
}

export function interpretar(clave, datos) {
  const d = datos || {};
  const L = d.lectura || {};
  const K = d.porK || {};
  const ci = d.ci || {};
  const act = d.actividad || { estado: "reposo" };
  const U = UMBRALES;
  const fc = num(L.fc), fr = num(L.frec_resp), sp = num(L.spo2), t = num(L.temperatura), sis = num(L.sistolica), dia = num(L.diastolica);
  const sint = Array.isArray(ci.sintomas) ? ci.sintomas : [];
  const mareo = !!ci.mareo_de_pie;
  const confuso = !!ci.confusion;
  const est = num(ci.estres);
  const horas = num(d.horasSueno);
  const cab = d.cabinaHoy || {};
  const co2 = num(cab.co2_ppm), tCab = num(cab.temp_c);
  const rad = d.radiacion || {};
  const tormenta = !!rad.activo;
  const esfuerzo = act.estado === "ejercicio" || act.estado === "recuperacion";
  const reposo = !esfuerzo;
  const rFc = d.rangos?.fc;
  const fcAlta = fc != null && (fc > U.tarjetas.fc.atencionMax - 1 || (rFc != null && fc > rFc[1]));
  const vfcBaja = d.vfc != null && d.vfcBase && d.vfc <= d.vfcBase * (1 - U.vfcCaidaPct);
  const frAlta = fr != null && fr >= 21;
  const tNormal = t == null || (t > U.tarjetas.temp.atencionBaja && t < U.tarjetas.temp.fiebre);
  const spNormal = sp == null || sp >= U.tarjetas.spo2.atencion;
  const fmt1 = (x) => (x == null ? "—" : Number(x).toFixed(1));
  const chip = (variable, valor, estado = "ok") => ({ variable, valor: String(valor), estado });
  const C = {
    fc: () => chip("FC", fc ?? "—", fcAlta ? "alto" : fc != null && fc <= U.tarjetas.fc.atencionMin ? "bajo" : "ok"),
    temp: () => chip("Temp", fmt1(t), t >= U.tarjetas.temp.rojoAlta ? "bad" : t >= U.tarjetas.temp.fiebre ? "alto" : t != null && t <= U.tarjetas.temp.atencionBaja ? "bajo" : "ok"),
    spo2: () => chip("SpO₂", sp ?? "—", sp != null && sp < U.tarjetas.spo2.rojo ? "bad" : sp != null && sp < U.tarjetas.spo2.atencion ? "bajo" : "ok"),
    fr: () => chip("FR", fr ?? "—", frAlta ? "alto" : fr != null && fr <= 11 ? "bajo" : "ok"),
    pa: () => chip("PA", `${sis ?? "—"}/${dia ?? "—"}`, sis >= U.tarjetas.pa.atencionSis || dia >= U.tarjetas.pa.atencionDia ? "alto" : sis != null && sis <= U.tarjetas.pa.bajaAtencion ? "bajo" : "ok"),
    sueno: () => chip("Sueño", horas != null ? `${horas} h` : "—", horas != null && horas < U.suenoMetaHoras ? "bajo" : "ok"),
    estres: () => chip("Estrés", est != null ? `${est}/5` : "—", est >= U.estresAlto ? "alto" : "ok"),
    vfc: () => chip("VFC", d.vfc != null ? `${d.vfc} ms` : "—", vfcBaja ? "bajo" : "ok"),
    sintomas: () => chip("Síntomas", sint.length ? sint.map((x) => NOMBRE_SINTOMA[x] || x).join(", ") : "no", sint.length ? "warn" : "ok"),
    mareo: () => chip("Mareo", mareo ? "sí" : "no", mareo ? "warn" : "ok"),
    conciencia: () => chip("Conciencia", confuso ? "confuso" : "alerta", confuso ? "bad" : "ok"),
    co2: () => chip("CO₂", co2 != null ? co2.toLocaleString("es-MX") : "—", co2 >= U.cabina.co2RojoPpm ? "bad" : co2 >= U.cabina.co2AtencionPpm ? "alto" : "ok"),
    cabinaT: () => chip("Cabina", tCab != null ? `${tCab} °C` : "—", tCab > 26 ? "alto" : "ok"),
    humedad: () => chip("Humedad", cab.humedad != null ? `${cab.humedad} %` : "—", "ok"),
    actividad: () => chip("Actividad", act.estado === "ejercicio" ? "ejercicio" : "recuperación", "info"),
    tormenta: () => chip("Tormenta", tormenta ? rad.activo.nivel : "no", tormenta ? "bad" : "ok"),
    reaccion: () => chip("Reacción", K.sueno?.reaccion != null ? `${K.sueno.reaccion} ms` : "—", K.sueno?.reaccionPct > U.tarjetas.sueno.reaccionLentaPct ? "alto" : "ok"),
    fatiga: () => chip("Fatiga", K.sueno?.fatiga != null ? `${K.sueno.fatiga}/5` : "—", K.sueno?.fatiga >= U.tarjetas.sueno.fatigaAlta ? "alto" : "ok"),
    who5: () => chip("WHO-5", K.animo?.valor ?? "—", K.animo?.valor != null && K.animo.valor <= U.tarjetas.animo.who5Rojo ? "bad" : K.animo?.valor != null && K.animo.valor <= U.tarjetas.animo.who5Atencion ? "bajo" : "ok"),
    tripulacion: () => chip("Tripulación", K.animo?.tripulacion != null ? `${K.animo.tripulacion}/5` : "—", K.animo?.tripulacion != null && K.animo.tripulacion <= U.tarjetas.animo.tripulacionBaja ? "bajo" : "ok"),
    dolor: () => chip("Dolor de cabeza", ci.dolor_cabeza || ci.vision_cefalea ? "sí" : "no", ci.dolor_cabeza || ci.vision_cefalea ? "warn" : "ok"),
    borrosa: () => chip("Visión borrosa", ci.vision_borrosa ? "sí" : "no", ci.vision_borrosa ? "warn" : "ok"),
    tasa: () => chip("Tasa", `${Math.round(rad.tasa || 0)} µSv/h`, tormenta ? "bad" : rad.tasa > U.radiacion.tasaAtencionX * rad.tasaBase ? "alto" : "ok"),
    carrera: () => chip("Carrera", `${Math.round((rad.pct || 0) * 100)} %`, rad.pct >= U.radiacion.criticoPct ? "bad" : rad.pct >= U.radiacion.atencionPct ? "alto" : "ok"),
    d30: () => chip("30 días", `${Math.round((rad.pct30 || 0) * 100)} %`, rad.pct30 >= U.radiacion.criticoPct ? "bad" : rad.pct30 >= U.radiacion.atencionPct ? "alto" : "ok"),
    refugio: () => chip("Refugio", rad.refugio ? "sí" : "no", rad.refugio ? "ok" : "warn"),
    ejHoy: () => chip("Hoy", `${K.huesos?.valor ?? "—"} %`, K.huesos?.valor < U.tarjetas.huesos.atencionPct ? "bajo" : "ok"),
    fuerza: () => chip("Fuerza", `${K.huesos?.fuerza ?? "—"} min`, "ok"),
    cardio: () => chip("Cardio", `${K.huesos?.cardio ?? "—"} min`, "ok"),
    racha: () => chip("Días bajo", K.huesos?.racha ?? 0, K.huesos?.racha >= U.tarjetas.huesos.rachaRojo ? "bad" : K.huesos?.racha ? "bajo" : "ok"),
  };
  const R = (conclusion, nivel, revisado, acciones = [], etiqueta = null) => ({ conclusion, nivel, revisado: revisado.map((f) => (typeof f === "function" ? f() : f)), acciones, etiqueta });
  const tj = K[clave] || {};
  const porCard = (txt, revisado, acciones) => R(txt, NIVEL_DE_ESTADO[tj.estadoRegla || tj.estado] || "ok", revisado, acciones);

  if (clave === "fc") {
    if (fcAlta) {
      if ((sp != null && sp < 94) || (frAlta && reposo)) return R("Posible problema respiratorio", "bad", [C.fc, C.spo2, C.fr, C.temp], ["Siéntate erguido y remide la SpO₂", "Avisa al médico de tripulación"]);
      if (t >= U.tarjetas.temp.fiebre || sint.length >= 2) return R("Posible fiebre o infección", t >= U.tarjetas.temp.rojoAlta ? "bad" : "warn", [C.fc, C.temp, C.sintomas, C.spo2], ["Mide la temperatura cada 6 h", "Registra tus síntomas"]);
      if (sis != null && sis <= U.tarjetas.pa.bajaAtencion && mareo) return R("Posible deshidratación o mareo al pararte", "warn", [C.fc, C.pa, C.mareo], ["Toma 500 ml de agua con electrolitos", "Haz la prueba ortostática"]);
      if (esfuerzo && spNormal && tNormal) return R("Esfuerzo físico: es normal que suba", "info", [C.actividad, C.temp, C.spo2, C.sueno], ["Remide en reposo en 15 min"], "Esfuerzo");
      if (tormenta) return R("Estrés por la alarma de radiación", "info", [C.tormenta, C.temp, C.spo2], ["Respira lento 2 min en el refugio"], "Alarma");
      if (vfcBaja && ((horas != null && horas < U.suenoMetaHoras) || est >= U.estresAlto)) return R("Fatiga y estrés acumulado", "warn", [C.fc, C.vfc, C.sueno, C.estres], ["Pausa de 10 min con respiración lenta", "Adelanta 1 h la hora de dormir"]);
      return R("Sin causa clara: remide en reposo", "warn", [C.fc, C.temp, C.spo2, C.sueno], ["Remide en reposo en 5 min"]);
    }
    if (fc != null && fc <= U.tarjetas.fc.atencionMin) return R(fc <= U.tarjetas.fc.rojoMin ? "FC muy baja: avisa al médico" : "FC baja: remide en reposo", fc <= U.tarjetas.fc.rojoMin ? "bad" : "warn", [C.fc, C.pa, C.mareo], ["Remide en reposo en 5 min"]);
    if (vfcBaja) return R("VFC baja: te estás recuperando poco", "warn", [C.vfc, C.sueno, C.estres, C.fc], ["Pausa de 10 min con respiración lenta"]);
    return R("Dentro de tu rango", "ok", [C.fc, C.vfc, C.temp]);
  }

  if (clave === "fr") {
    if (frAlta) {
      if (sp != null && sp < 94) return R("Respiras rápido porque baja tu oxígeno", "bad", [C.fr, C.spo2, C.fc], ["Siéntate erguido y remide la SpO₂", "Avisa al médico de tripulación"]);
      if (co2 >= U.cabina.co2AtencionPpm) return R("El CO₂ de la cabina te hace respirar rápido", "warn", [C.fr, C.co2, C.spo2], ["Muévete a un módulo con mejor ventilación", "Revisa el sistema de CO₂"]);
      if (esfuerzo) return R("Esfuerzo físico", "info", [C.actividad, C.fr, C.spo2], ["Remide en reposo en 15 min"], "Esfuerzo");
      if (est >= U.estresAlto) return R("Posible respiración por ansiedad", "warn", [C.fr, C.estres, C.spo2], ["Respira 6 veces por minuto durante 5 min"]);
      return R("Remide en reposo", "warn", [C.fr, C.spo2, C.co2], ["Remide en reposo en 5 min"]);
    }
    if (fr != null && fr <= 11) return R(fr <= U.tarjetas.fr.rojoMin ? "Respiración muy lenta: avisa al médico" : "Respiración lenta: remide en reposo", fr <= U.tarjetas.fr.rojoMin ? "bad" : "warn", [C.fr, C.spo2, C.conciencia], ["Remide en reposo en 5 min"]);
    return R("Dentro de tu rango", "ok", [C.fr, C.spo2, C.co2]);
  }

  if (clave === "temp") {
    if (t != null && t >= 37.5) {
      if (sint.length) return R("Posible infección o virus reactivado", t >= U.tarjetas.temp.rojoAlta ? "bad" : "warn", [C.temp, C.sintomas, C.fc], ["Mide la temperatura cada 6 h", "Usa cubrebocas si compartes módulo"]);
      if (esfuerzo) return R("Calor por ejercicio", "info", [C.actividad, C.temp, C.fc], ["Hidrátate y remide en 15 min"], "Esfuerzo");
      if (tCab > 26) return R("La cabina está caliente", "info", [C.cabinaT, C.temp, C.humedad], ["Ajusta la temperatura del módulo"], "Cabina");
      return R("Vigila cada 6 h", "warn", [C.temp, C.sintomas, C.fc], ["Mide la temperatura cada 6 h"]);
    }
    if (t != null && t <= U.tarjetas.temp.atencionBaja) return R("Temperatura baja: remide", t <= U.tarjetas.temp.rojoBaja ? "bad" : "warn", [C.temp, C.cabinaT], ["Abrígate y remide en 15 min"]);
    if (sint.length) return R("Síntomas sin fiebre: vigila", sint.length >= 2 ? "warn" : "warn", [C.sintomas, C.temp, C.fc], ["Mide la temperatura cada 6 h", "Lávate las manos seguido"]);
    return R("Sin fiebre ni síntomas", "ok", [C.temp, C.sintomas]);
  }

  if (clave === "spo2") {
    if (sp != null && sp < 95) {
      if (frAlta || fcAlta || mareo) return R("Baja real de oxígeno", sp < U.tarjetas.spo2.rojo ? "bad" : "warn", [C.spo2, C.fr, C.fc, C.mareo], ["Siéntate erguido y respira lento", "Avisa al médico de tripulación"]);
      return R("Probable lectura falsa: revisa el sensor", "warn", [C.spo2, C.fc, C.fr, C.conciencia], ["Calienta el dedo y remide sin moverte"]);
    }
    return R("Oxigenación normal", "ok", [C.spo2, C.fr, C.fc]);
  }

  if (clave === "pa") {
    const alta = (sis != null && sis >= U.tarjetas.pa.atencionSis) || (dia != null && dia >= U.tarjetas.pa.atencionDia);
    if (alta) {
      if (esfuerzo) return R("Sube con el ejercicio: remide en 15 min", "info", [C.actividad, C.pa, C.fc], ["Remide en reposo en 15 min"], "Esfuerzo");
      if (est >= U.estresAlto || tormenta) return R("Sube por estrés", "warn", [C.pa, tormenta ? C.tormenta : C.estres, C.sueno], ["Respira lento 5 min y remide"]);
      const ult3 = (d.vitals || []).slice(-3);
      const sostenida = ult3.length === 3 && ult3.every((v, i) => {
        const s0 = i === 2 ? sis : num(v.sistolica);
        const d0 = i === 2 ? dia : num(v.diastolica);
        return s0 >= U.tarjetas.pa.atencionSis || d0 >= U.tarjetas.pa.atencionDia;
      });
      if (sostenida) return R("Presión alta sostenida", clasificarPresion(sis, dia).rango >= 2 ? "bad" : "warn", [C.pa, C.estres, C.sueno], ["Mide la presión mañana y noche", "Reduce la sal hoy"]);
      return R("Una lectura alta: remide en reposo", "warn", [C.pa, C.estres, C.fc], ["Reposo sentado 5 min y remide"]);
    }
    if (sis != null && sis <= U.tarjetas.pa.bajaAtencion) {
      if (sis <= U.tarjetas.pa.bajaRojo) return R("Presión muy baja: avisa al médico", "bad", [C.pa, C.mareo, C.fc], ["Acuéstate con las piernas elevadas", "Avisa al médico de tripulación"]);
      if (mareo) return R("Mareo por presión baja: haz la ortostática", "warn", [C.pa, C.mareo, C.fc], ["Siéntate y haz la prueba ortostática", "Toma 500 ml de agua con electrolitos"]);
      return R("Común en el espacio por el cambio de líquidos", "ok", [C.pa, C.mareo, C.fc]);
    }
    return R("Dentro de tu rango", "ok", [C.pa, C.fc, C.estres]);
  }

  if (clave === "sueno") {
    const corto = horas != null && horas < U.suenoMetaHoras;
    if ((corto || tj.estado !== "normal") && (tormenta || tormentaEnLaNoche(d.eventos, d.fechaHoy))) return R("La alarma interrumpió tu sueño", "info", [C.tormenta, C.sueno, C.reaccion], ["Siesta de 20 min si tu horario lo permite"], "Alarma");
    if (tj.estado === "critico") return R("Sueño corto y reacción lenta", "bad", [C.sueno, C.reaccion, C.vfc, C.fatiga], ["Siesta de 20 min", "Pide reprogramar tareas críticas"]);
    if (tj.estado === "atencion") return R(tj.noches >= U.rachaSueno ? `${tj.noches} noches con menos de 7 h` : tj.etiqueta === "Reacción lenta" ? "Reacción más lenta que tu normal" : "Fatiga alta", "warn", [C.sueno, C.reaccion, C.fatiga, C.estres], ["Adelanta 1 h la hora de dormir"]);
    return R("Duermes lo suficiente", "ok", [C.sueno, C.reaccion]);
  }

  if (clave === "animo") {
    if (tj.estado !== "normal") {
      const conSueno = horas != null && horas < U.suenoMetaHoras;
      const txt = tj.estado === "critico" ? "Bienestar muy bajo: habla con el médico" : conSueno ? "Ánimo bajo con sueño corto" : tj.etiqueta === "Estrés alto" ? "Estrés alto" : tj.etiqueta === "Tripulación" ? "Tensión con la tripulación" : "Ánimo bajo";
      return porCard(txt, [C.who5, C.estres, C.sueno, C.tripulacion], ["Respiración guiada de 10 min", "Contesta el PHQ-9"]);
    }
    return R("Ánimo estable", "ok", [C.who5, C.estres, C.tripulacion]);
  }

  if (clave === "vision") {
    if (tj.estado !== "normal") {
      if ((ci.dolor_cabeza || ci.vision_cefalea) && co2 >= U.cabina.co2AtencionPpm) return R("Probablemente por el CO₂ de la cabina", "warn", [C.dolor, C.co2, C.borrosa, C.pa], ["Muévete a un módulo ventilado", "Haz la rejilla de Amsler"]);
      return porCard(ci.vision_borrosa ? "Visión borrosa: haz la rejilla de Amsler" : ci.dolor_cabeza || ci.vision_cefalea ? "Dolor de cabeza: revisa tu visión" : "Distorsión en la rejilla de Amsler", [C.borrosa, C.dolor, C.pa, C.co2], ["Haz la rejilla de Amsler"]);
    }
    return R("Sin cambios en tu visión", "ok", [C.borrosa, C.dolor]);
  }

  if (clave === "conciencia") {
    if (confuso) return R("Confusión: avisa al médico ahora", "bad", [C.conciencia, C.spo2, C.temp, C.pa], ["Avisa al médico de tripulación ahora", "No te quedes solo"]);
    if (mareo) return R(sis != null && sis <= U.tarjetas.pa.bajaAtencion ? "Mareo con presión baja" : "Mareo: haz la ortostática", "warn", [C.mareo, C.pa, C.fc, C.sueno], ["Siéntate hasta que pase", "Haz la prueba ortostática"]);
    return R("Alerta y sin mareo", "ok", [C.conciencia, C.mareo]);
  }

  if (clave === "radiacion") {
    if (tormenta && !rad.refugio) return R(`Tormenta ${rad.activo.nivel}: ve al refugio`, "bad", [C.tormenta, C.tasa, C.refugio], ["Ve al refugio ahora", "Mantén el dosímetro puesto"]);
    if (tormenta) return R("En refugio: dosis reducida", "warn", [C.tormenta, C.tasa, C.refugio], ["Espera el aviso de fin de evento"]);
    if (tj.estado === "critico") return R("Cerca de un límite de dosis", "bad", [C.carrera, C.d30, C.tasa], ["Revisa tu dosis con el médico de tripulación"]);
    if (tj.estado === "atencion") return R("Acumulado alto de radiación", "warn", [C.carrera, C.d30, C.tasa], ["Prioriza zonas con más blindaje"]);
    return R("Dosis dentro de los límites", "ok", [C.tasa, C.carrera, C.d30]);
  }

  if (clave === "huesos") {
    if (tj.estado === "critico") return R(`${tj.racha} días debajo de lo prescrito`, "bad", [C.ejHoy, C.fuerza, C.cardio, C.racha], ["Rutina de bandas elásticas 45 min", "Reporta la falla del equipo"]);
    if (tj.estado === "atencion") return R(`Hoy vas al ${tj.valor} % de lo prescrito`, "warn", [C.ejHoy, C.fuerza, C.cardio], ["Completa tu fuerza y cardio de hoy"]);
    return R("Cumples tu ejercicio prescrito", "ok", [C.ejHoy, C.fuerza, C.cardio]);
  }

  if (clave === "cabina") {
    if (co2 >= U.cabina.co2RojoPpm) return R("CO₂ muy alto en tu módulo", "bad", [C.co2, C.dolor, C.fr], ["Sal del módulo ahora", "Avisa al ingeniero de vuelo"]);
    if (co2 >= U.cabina.co2AtencionPpm) return R("CO₂ alto en tu módulo", "warn", [C.co2, C.dolor, C.cabinaT], ["Revisa la remoción de CO₂", "Muévete a un módulo ventilado"]);
    return R("Aire de la cabina en rango", "ok", [C.co2, C.cabinaT, C.humedad]);
  }

  return porCard(tj.motivo || tj.nombre || "", []);
}

export const ORDEN_GRAVEDAD = { critico: 0, urgente: 1, moderado: 2, info: 3, ok: 4 };
export const COLOR_GRAVEDAD = { critico: "#ff7278", urgente: "#ff975d", moderado: "#ffd166", info: "#7cc4ff", ok: "#83e0b7" };
export const ETIQUETA_GRAVEDAD = { critico: "Crítico", urgente: "Urgente", moderado: "Moderado", info: "Esfuerzo", ok: "Normal" };
export const RESTA_GRAVEDAD = { critico: 22, urgente: 12, moderado: 5, info: 0, ok: 0 };
export const NIVELES_SALUD = [
  { min: 85, clave: "optimo", palabra: "Óptimo", color: "#83e0b7" },
  { min: 60, clave: "estable", palabra: "Estable", color: "#c8e07a" },
  { min: 35, clave: "atencion", palabra: "Atención", color: "#ff975d" },
  { min: 0, clave: "critico", palabra: "Crítico", color: "#ff7278" },
];
const NEWS2_DE_VAR = { fc: "pulso", pa: "sistolica", fr: "fr", temp: "temperatura", spo2: "spo2", conciencia: "conciencia" };
const NIVEL_DE_TARJETA = { critico: "bad", atencion: "warn", info: "info", normal: "ok" };
const RANGO_NIVEL = { bad: 0, warn: 1, info: 2, ok: 3 };

export function nivelAlerta(t, analisis) {
  const deInterp = analisis?.interpretaciones?.[t.k]?.nivel || "ok";
  if (t.estado === "info" || deInterp === "info") return t.estado === "critico" || t.estado === "atencion" ? NIVEL_DE_TARJETA[t.estado] : "info";
  const deTarjeta = NIVEL_DE_TARJETA[t.estado] || "ok";
  return RANGO_NIVEL[deTarjeta] < RANGO_NIVEL[deInterp] ? deTarjeta : deInterp;
}

const sintomasDe = (d) => (Array.isArray(d.c.sintomas) ? d.c.sintomas : []);
const ejercicioTotal = (v) => (num(v.ejercicio_fuerza_min) != null ? (num(v.ejercicio_fuerza_min) || 0) + (num(v.ejercicio_cardio_min) || 0) : num(v.minutos_ejercicio) || 0);

const REGLAS_DIA = {
  fc: { alerta: (d, x) => num(d.v.fc) > 90 || (num(d.v.fc) != null && num(d.v.fc) <= 50) || (x.vfcBase && num(d.v.vfc) != null && num(d.v.vfc) <= x.vfcBase * 0.8), malo: (d, x) => Math.max(Math.abs((num(d.v.fc) ?? 70) - 70) / 10, x.vfcBase ? ((x.vfcBase - (num(d.v.vfc) ?? x.vfcBase)) / x.vfcBase) * 10 : 0) },
  pa: { alerta: (d) => num(d.v.sistolica) >= 130 || num(d.v.diastolica) >= 85 || (num(d.v.sistolica) != null && num(d.v.sistolica) <= 100), malo: (d) => Math.max((num(d.v.sistolica) ?? 115) - 120, 110 - (num(d.v.sistolica) ?? 115), (num(d.v.diastolica) ?? 75) - 80) },
  fr: { alerta: (d) => num(d.v.frec_resp) >= 21 || (num(d.v.frec_resp) != null && num(d.v.frec_resp) <= 11), malo: (d) => Math.abs((num(d.v.frec_resp) ?? 16) - 16) },
  temp: { alerta: (d) => num(d.v.temperatura) >= 38.1 || (num(d.v.temperatura) != null && num(d.v.temperatura) <= 36) || sintomasDe(d).length > 0, malo: (d) => Math.abs((num(d.v.temperatura) ?? 36.8) - 36.8) + sintomasDe(d).length },
  spo2: { alerta: (d) => num(d.v.spo2) != null && num(d.v.spo2) < 95, malo: (d) => 100 - (num(d.v.spo2) ?? 98) },
  conciencia: { alerta: (d) => !!(d.c.confusion || d.c.mareo_de_pie), malo: (d) => (d.c.confusion ? 2 : 0) + (d.c.mareo_de_pie ? 1 : 0) },
  sueno: { alerta: (d) => num(d.v.horas_sueno) != null && num(d.v.horas_sueno) < 7, malo: (d) => 8 - (num(d.v.horas_sueno) ?? 8) },
  animo: { alerta: (d) => (num(d.c.animo) != null && num(d.c.animo) <= 2) || num(d.c.estres) >= 4, malo: (d) => (num(d.c.estres) ?? 2) - (num(d.c.animo) ?? 4) },
  vision: { alerta: (d) => !!(d.c.vision_borrosa || d.c.dolor_cabeza || d.c.vision_cefalea), malo: (d) => (d.c.vision_borrosa ? 1 : 0) + (d.c.dolor_cabeza || d.c.vision_cefalea ? 1 : 0) },
  huesos: { alerta: (d, x) => ejercicioTotal(d.v) < x.presc, malo: (d, x) => x.presc - ejercicioTotal(d.v) },
  cabina: { alerta: (d) => num(d.cab.co2_ppm) >= 3500, malo: (d) => num(d.cab.co2_ppm) ?? 0 },
  radiacion: { alerta: () => true, malo: () => 0 },
};

function contextoDias({ vitals, checkins, cabina, hoy, ci, bVfc, presc }) {
  return {
    vitals, hoy, ci, presc, vfcBase: bVfc?.media || null,
    ciPorFecha: new Map((checkins || []).map((c) => [c.fecha, c])),
    cabPorFecha: new Map((cabina || []).map((c) => [c.fecha, c])),
  };
}

function registroDia(x, i) {
  const v = x.vitals[i];
  const esHoy = i === x.vitals.length - 1;
  return { v: esHoy ? { ...v, ...x.hoy } : v, c: esHoy ? x.ci || {} : x.ciPorFecha.get(v.fecha) || {}, cab: x.cabPorFecha.get(v.fecha) || {} };
}

export function diasEnAlerta(clave, x) {
  const r = REGLAS_DIA[clave];
  if (!r || !x.vitals.length) return 1;
  let n = 0;
  for (let i = x.vitals.length - 1; i >= 0; i--) {
    if (!r.alerta(registroDia(x, i), x)) break;
    n++;
  }
  return Math.max(1, n);
}

export function empeoroContraAyer(clave, x) {
  const r = REGLAS_DIA[clave];
  const n = x.vitals.length;
  if (!r || n < 2) return false;
  const hoy = registroDia(x, n - 1);
  const ayer = registroDia(x, n - 2);
  if (!r.alerta(ayer, x)) return true;
  return r.malo(hoy, x) > r.malo(ayer, x) + 1e-9;
}

export function gravedad(clave, datos) {
  const d = datos || {};
  const nivel = d.nivel || "ok";
  if (!d.tarjeta || nivel === "ok") return "ok";
  if (nivel === "info") return "info";
  const L = d.lectura || {};
  if (NEWS2_DE_VAR[clave]) {
    if ((clave === "spo2" && num(L.spo2) != null && L.spo2 < 90) || (clave === "pa" && num(L.sistolica) != null && L.sistolica <= 90) || (clave === "conciencia" && d.ci?.confusion)) return "critico";
    const pts = d.news2?.desglose?.find((x) => x.k === NEWS2_DE_VAR[clave])?.puntos || 0;
    if (pts >= 3) return "critico";
    if (pts === 2) return "urgente";
    if (pts === 1) return "moderado";
  }
  if (clave === "radiacion" && d.radiacion?.activo) return d.radiacion.refugio ? "urgente" : "critico";
  if (nivel === "bad") return "critico";
  return d.empeoro || (d.dias || 0) >= 3 ? "urgente" : "moderado";
}

export function saludGeneral(datos) {
  let v = 100;
  for (const g of Object.values(datos?.gravedades || {})) v -= RESTA_GRAVEDAD[g] || 0;
  v = Math.max(5, v);
  const n = NIVELES_SALUD.find((x) => v >= x.min) || NIVELES_SALUD.at(-1);
  return { valor: v, ...n };
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
    case "cabina_co2":
    case "tarjeta_cabina":
      return `El CO₂ de tu módulo está en ${analisis.tarjetas?.find((t) => t.k === "cabina")?.texto} ppm. En una nave cerrada el CO₂ alto puede causar dolor de cabeza, cansancio y menor concentración. Revisa la ventilación y repórtalo. Estos umbrales son de demostración.`;
    case "temperatura":
    case "tarjeta_temp":
      return "La temperatura y los síntomas de infección (garganta, llagas, ronchas, heridas que no sanan, estómago) ayudan a detectar a tiempo una infección; en vuelo el sistema inmune funciona distinto y conviene vigilarlo de cerca.";
    case "tripulacion":
      return "La relación con la tripulación es parte de tu salud mental en misiones largas: el aislamiento y el confinamiento hacen que los conflictos pesen más. Hablarlo pronto ayuda.";
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
    const f = [resultado.confusion && "confusión", resultado.mareo_de_pie && "mareo", resultado.vision_borrosa && "visión borrosa", resultado.dolor_cabeza && "dolor de cabeza", ...(resultado.sintomas || []).map((x) => NOMBRE_SINTOMA[x] || x)].filter(Boolean);
    return { desenlace: null, interpretacion: `Ánimo ${resultado.animo}/5 · estrés ${resultado.estres}/5 · fatiga ${resultado.fatiga}/5 · tripulación ${resultado.tripulacion ?? "—"}/5${f.length ? ` · reporta ${f.join(", ")}` : " · sin síntomas"}` };
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
